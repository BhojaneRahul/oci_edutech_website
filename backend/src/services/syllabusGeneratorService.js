import fsSync from "fs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { PDFParse } from "pdf-parse";
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { syllabusGeneratedDir } from "../middleware/uploadMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stopwords = new Set([
  "about",
  "after",
  "again",
  "against",
  "basic",
  "between",
  "course",
  "chapter",
  "class",
  "concept",
  "content",
  "could",
  "degree",
  "first",
  "from",
  "have",
  "important",
  "into",
  "learning",
  "module",
  "notes",
  "outcome",
  "overview",
  "paper",
  "part",
  "question",
  "revision",
  "section",
  "semester",
  "should",
  "study",
  "subject",
  "syllabus",
  "their",
  "there",
  "these",
  "topic",
  "topics",
  "unit",
  "using",
  "what",
  "when",
  "where",
  "with",
  "will",
  "would",
  "your"
]);

const cleanLine = (line) => line.replace(/\s+/g, " ").replace(/[•·●▪■]/g, "").trim();

const isLikelyHeading = (line) => {
  if (!line) return false;
  if (/^(unit|module|chapter|part|lesson)\b/i.test(line)) return true;
  if (line.length > 72) return false;
  if (/^[A-Z0-9\s,:&()/-]+$/.test(line) && line.length > 6) return true;
  return /^\d+[\].)\-:\s]+[A-Za-z]/.test(line);
};

const dedupe = (values) => Array.from(new Set(values.filter(Boolean)));

const chunk = (items, size) => {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
};

const normalizeQuestionSet = (items) =>
  Array.isArray(items)
    ? items
        .map((item) => ({
          question: String(item?.question || "").trim(),
          answer: String(item?.answer || "").trim()
        }))
        .filter((item) => item.question && item.answer)
        .slice(0, 10)
    : [];

const stringifyError = (error) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return JSON.stringify(
    {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      stack: error.stack
    },
    null,
    2
  );
};

const getAiClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
};

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
};

const toJsonString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const extractJsonBlock = (value) => {
  const text = value.trim();
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
};

const getMimeTypeFromPath = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
};

const extractGeminiText = (response) => {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
    if (text) {
      return text;
    }
  }

  return "";
};

const waitForGeminiFileActive = async (client, uploadedFileName) => {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const current = await client.files.get({ name: uploadedFileName });
    if (current?.state === "ACTIVE") {
      return current;
    }

    if (current?.state && current.state !== "PROCESSING") {
      throw new Error(`Gemini file processing failed with state: ${current.state}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  throw new Error("Gemini file processing timed out.");
};

const buildAiInputContent = async ({
  extractedText,
  subject,
  course,
  semester,
  outputType,
  manualTopics,
  sourceFileName,
  sourceFilePath,
  sourceMimeType
}) => {
  const manualTopicText = manualTopics.length ? manualTopics.join(", ") : "No manual topic hints provided.";
  const outputLabel = outputType.replace(/_/g, " ");
  const trimmedSyllabus = extractedText.replace(/\s+/g, " ").trim().slice(0, 32000);
  const textPrompt = [
    `Create a high-quality ${outputLabel} study pack from this uploaded syllabus.`,
    `Subject: ${subject || "Not provided"}`,
    `Course: ${course || "Not provided"}`,
    `Semester: ${semester || "Not provided"}`,
    `Manual topics: ${manualTopicText}`,
    `Source file: ${sourceFileName}`,
    "",
    "Use the uploaded file as the primary source of truth. Read every visible point, heading, topic, unit, outcome, and instruction from it before generating the notes.",
    "If extracted text is incomplete, recover as much as possible from the visual file itself.",
    "",
    "Extracted text (may be partial for scanned PDFs/images):",
    trimmedSyllabus || "No reliable plain text was extracted."
  ].join("\n");

  const content = [
    {
      type: "input_text",
      text: textPrompt
    }
  ];

  if (!sourceFilePath) {
    return { content, uploadedFileId: null };
  }

  const mimeType = sourceMimeType || getMimeTypeFromPath(sourceFilePath);
  const client = getAiClient();
  if (!client) {
    return { content, uploadedFileId: null };
  }

  const uploadedFile = await client.files.create({
    file: fsSync.createReadStream(sourceFilePath),
    purpose: "user_data"
  });

  await client.files.waitForProcessing(uploadedFile.id, {
    pollInterval: 1000,
    maxWait: 60 * 1000
  });

  if (mimeType === "application/pdf") {
    content.push({
      type: "input_file",
      file_id: uploadedFile.id
    });
  } else if (mimeType.startsWith("image/")) {
    content.push({
      type: "input_image",
      file_id: uploadedFile.id,
      detail: "high"
    });
  }

  return { content, uploadedFileId: uploadedFile.id };
};

const buildStructuredNotesWithGemini = async ({
  extractedText,
  subject,
  course,
  semester,
  outputType,
  manualTopics = [],
  sourceFileName,
  sourceFilePath,
  sourceMimeType
}) => {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  const outputLabel = outputType.replace(/_/g, " ");
  const manualTopicText = manualTopics.length ? manualTopics.join(", ") : "No manual topic hints provided.";
  const trimmedSyllabus = extractedText.replace(/\s+/g, " ").trim().slice(0, 32000);
  const modelsToTry = dedupe([
    sourceFilePath ? process.env.GEMINI_FILE_MODEL : null,
    process.env.GEMINI_MODEL,
    sourceFilePath ? "gemini-2.0-flash" : "gemini-2.5-flash",
    sourceFilePath ? "gemini-1.5-flash" : null
  ]);
  const prompt = [
    `Create a high-quality ${outputLabel} study pack from this uploaded syllabus.`,
    `Subject: ${subject || "Not provided"}`,
    `Course: ${course || "Not provided"}`,
    `Semester: ${semester || "Not provided"}`,
    `Manual topics: ${manualTopicText}`,
    `Source file: ${sourceFileName}`,
    "",
    "Use the uploaded file as the primary source of truth. Read every visible point, heading, topic, unit, outcome, and instruction from it before generating the notes.",
    "If extracted text is incomplete, recover the missing details from the visual document itself.",
    "",
    "Return only valid JSON with keys: title, overview, units, keywords, revisionChecklist, likelyQuestions.",
    "Each unit should have a concise title and 4 to 8 specific bullet points based on the actual syllabus content.",
    "Likely questions should feel like realistic university exam questions, not generic placeholders.",
    "",
    "Extracted text (may be partial for scanned PDFs/images):",
    trimmedSyllabus || "No reliable plain text was extracted."
  ].join("\n");

  let uploadedFile = null;
  let lastError = null;

  try {
    if (sourceFilePath) {
      uploadedFile = await client.files.upload({
        file: sourceFilePath,
        config: {
          mimeType: sourceMimeType || getMimeTypeFromPath(sourceFilePath),
          displayName: sourceFileName
        }
      });

      uploadedFile = await waitForGeminiFileActive(client, uploadedFile.name);
    }

    const contents =
      uploadedFile?.uri && uploadedFile?.mimeType
        ? [prompt, createPartFromUri(uploadedFile.uri, uploadedFile.mimeType)]
        : [prompt];

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents
        });

        const parsedNotes = JSON.parse(extractJsonBlock(extractGeminiText(response)));

        return normalizeStructuredNotes(parsedNotes, {
          extractedText,
          subject,
          course,
          semester,
          outputType,
          manualTopics,
          sourceFileName
        });
      } catch (error) {
        lastError = error;
        console.error(`Gemini model ${model} failed for syllabus generation:`, stringifyError(error));
      }
    }

    throw lastError || new Error("Gemini could not generate notes for this syllabus.");
  } finally {
    if (uploadedFile?.name) {
      await client.files.delete({ name: uploadedFile.name }).catch(() => undefined);
    }
  }
};

export const extractTextFromSyllabusPdf = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const textResult = await parser.getText();
    return textResult.text ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
};

const extractKeywords = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 5 && !stopwords.has(word));

  const frequencies = new Map();
  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([word]) => word.replace(/^\w/, (letter) => letter.toUpperCase()));
};

const extractUnits = (text, manualTopics = []) => {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length >= 3);

  const units = [];
  let currentUnit = null;

  for (const line of lines) {
    if (isLikelyHeading(line)) {
      if (currentUnit) {
        units.push(currentUnit);
      }

      currentUnit = {
        title: line,
        points: []
      };
      continue;
    }

    if (!currentUnit) {
      currentUnit = {
        title: "Course overview",
        points: []
      };
    }

    if (currentUnit.points.length < 5) {
      currentUnit.points.push(line);
    }
  }

  if (currentUnit) {
    units.push(currentUnit);
  }

  const compactUnits = units
    .map((unit) => ({
      title: unit.title,
      points: dedupe(unit.points).slice(0, 4)
    }))
    .filter((unit) => unit.title && unit.points.length);

  if (compactUnits.length >= 2) {
    return compactUnits.slice(0, 8);
  }

  const fallbackTopics = dedupe(manualTopics)
    .map((topic) => cleanLine(topic))
    .filter(Boolean);

  if (fallbackTopics.length) {
    return fallbackTopics.slice(0, 8).map((topic) => ({
      title: topic,
      points: [
        `Key concepts from ${topic}`,
        `Important definitions and explanations`,
        `Revision focus areas for ${topic}`
      ]
    }));
  }

  const contentLines = dedupe(lines).slice(0, 16);
  return chunk(contentLines, 3).slice(0, 5).map((group, index) => ({
    title: `Unit ${index + 1}`,
    points: group
  }));
};

const buildStructuredNotesFallback = ({
  extractedText,
  subject,
  course,
  semester,
  outputType,
  manualTopics = [],
  sourceFileName
}) => {
  const units = extractUnits(extractedText, manualTopics);
  const keywords = extractKeywords(extractedText);
  const normalizedSubject = subject?.trim() || sourceFileName.replace(/\.pdf$/i, "");
  const normalizedCourse = course?.trim() || "Course";
  const normalizedSemester = semester?.trim() || "Current semester";

  const overview = `This ${outputType.replace(/_/g, " ")} draft was prepared from the uploaded syllabus for ${normalizedSubject} in ${normalizedCourse}. It organizes the available topics into a cleaner sequence so students can focus on concepts, revision priorities, and likely question areas for ${normalizedSemester}.`;

  const revisionChecklist = dedupe([
    ...units.slice(0, 4).map((unit) => `Revise the core idea behind ${unit.title}`),
    ...keywords.slice(0, 4).map((keyword) => `Review examples and definitions for ${keyword}`)
  ]).slice(0, 6);

  const likelyQuestions = units.slice(0, 5).map((unit) => `Explain the main ideas, applications, and important discussion points from ${unit.title}.`);

  const definitions = keywords.slice(0, 6).map((keyword) => ({
    term: keyword,
    meaning: `${keyword} is an important syllabus concept that should be explained with definition, features, examples, and practical relevance.`
  }));

  const keyPoints = dedupe([
    ...units.flatMap((unit) => unit.points.slice(0, 2)),
    ...revisionChecklist
  ]).slice(0, 10);

  const probableQuestions2Mark = units.slice(0, 5).map((unit) => ({
    question: `Write a short note on ${unit.title}.`,
    answer: unit.points[0] || `Explain the core meaning and exam importance of ${unit.title}.`
  }));

  const probableQuestions5Mark = units.slice(0, 5).map((unit) => ({
    question: `Explain ${unit.title} with key features and applications.`,
    answer: dedupe(unit.points).slice(0, 4).join(" ")
  }));

  const probableQuestions10Mark = units.slice(0, 4).map((unit) => ({
    question: `Discuss ${unit.title} in detail with definitions, concepts, features, and examples.`,
    answer: `A strong 10-mark answer should cover ${unit.title}, including definition, major concepts, core features, applications, and a short conclusion. ${dedupe(unit.points).join(" ")}`
  }));

  return {
    title: `${normalizedSubject} ${outputType.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}`,
    overview,
    units,
    keywords,
    definitions,
    keyPoints,
    revisionChecklist,
    likelyQuestions,
    probableQuestions2Mark,
    probableQuestions5Mark,
    probableQuestions10Mark
  };
};

const normalizeStructuredNotes = (rawNotes, fallbackInput) => {
  const fallback = buildStructuredNotesFallback(fallbackInput);
  const notes = rawNotes && typeof rawNotes === "object" ? rawNotes : {};

  const normalizedUnits = Array.isArray(notes.units)
    ? notes.units
        .map((unit) => ({
          title: String(unit?.title || "").trim(),
          points: Array.isArray(unit?.points)
            ? unit.points.map((point) => String(point || "").trim()).filter(Boolean).slice(0, 6)
            : []
        }))
        .filter((unit) => unit.title && unit.points.length)
        .slice(0, 8)
    : [];

  return {
    title: String(notes.title || fallback.title).trim() || fallback.title,
    overview: String(notes.overview || fallback.overview).trim() || fallback.overview,
    units: normalizedUnits.length ? normalizedUnits : fallback.units,
    keywords:
      Array.isArray(notes.keywords) && notes.keywords.length
        ? dedupe(notes.keywords.map((keyword) => String(keyword || "").trim())).slice(0, 10)
        : fallback.keywords,
    definitions:
      Array.isArray(notes.definitions) && notes.definitions.length
        ? notes.definitions
            .map((item) => ({
              term: String(item?.term || "").trim(),
              meaning: String(item?.meaning || "").trim()
            }))
            .filter((item) => item.term && item.meaning)
            .slice(0, 12)
        : fallback.definitions,
    keyPoints:
      Array.isArray(notes.keyPoints) && notes.keyPoints.length
        ? dedupe(notes.keyPoints.map((item) => String(item || "").trim())).slice(0, 12)
        : fallback.keyPoints,
    revisionChecklist:
      Array.isArray(notes.revisionChecklist) && notes.revisionChecklist.length
        ? dedupe(notes.revisionChecklist.map((item) => String(item || "").trim())).slice(0, 8)
        : fallback.revisionChecklist,
    likelyQuestions:
      Array.isArray(notes.likelyQuestions) && notes.likelyQuestions.length
        ? dedupe(notes.likelyQuestions.map((item) => String(item || "").trim())).slice(0, 8)
        : fallback.likelyQuestions,
    probableQuestions2Mark: normalizeQuestionSet(notes.probableQuestions2Mark).length
      ? normalizeQuestionSet(notes.probableQuestions2Mark)
      : fallback.probableQuestions2Mark,
    probableQuestions5Mark: normalizeQuestionSet(notes.probableQuestions5Mark).length
      ? normalizeQuestionSet(notes.probableQuestions5Mark)
      : fallback.probableQuestions5Mark,
    probableQuestions10Mark: normalizeQuestionSet(notes.probableQuestions10Mark).length
      ? normalizeQuestionSet(notes.probableQuestions10Mark)
      : fallback.probableQuestions10Mark
  };
};

const hasEnoughExtractedTextForFallback = (value) => value.replace(/\s+/g, " ").trim().length >= 250;

const buildStructuredNotesWithAi = async ({
  extractedText,
  subject,
  course,
  semester,
  outputType,
  manualTopics = [],
  sourceFileName,
  sourceFilePath,
  sourceMimeType
}) => {
  const extractedTextStrongEnough = hasEnoughExtractedTextForFallback(extractedText);

  if (getGeminiClient()) {
    try {
      return await buildStructuredNotesWithGemini({
        extractedText,
        subject,
        course,
        semester,
        outputType,
        manualTopics,
        sourceFileName,
        sourceFilePath,
        sourceMimeType
      });
    } catch (error) {
      console.error("Gemini syllabus generation failed:", error);
      if (!extractedTextStrongEnough) {
        if (error?.status === 429) {
          throw new Error(
            "Gemini quota is exhausted for syllabus generation. Please wait for quota reset or reduce requests, then try again."
          );
        }

        throw new Error(
          "We could not extract this scanned PDF/image with Gemini right now. Please check the Gemini key/model setup and try again."
        );
      }

      console.error("Gemini syllabus generation failed, trying OpenAI/fallback path:", error);
    }
  }

  const client = getAiClient();
  if (!client) {
    if (!extractedTextStrongEnough) {
      throw new Error(
        "This syllabus looks like a scanned PDF or image. Add a working Gemini or OpenAI key with available quota to extract it correctly."
      );
    }

    return buildStructuredNotesFallback({
      extractedText,
      subject,
      course,
      semester,
      outputType,
      manualTopics,
      sourceFileName
    });
  }

  const outputLabel = outputType.replace(/_/g, " ");
  const model =
    sourceMimeType === "application/pdf" || sourceMimeType?.startsWith("image/")
      ? process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
      : process.env.OPENAI_MODEL || "gpt-4o-mini";
  let uploadedFileId = null;

  try {
    const buildResult = await buildAiInputContent({
      extractedText,
      subject,
      course,
      semester,
      outputType,
      manualTopics,
      sourceFileName,
      sourceFilePath,
      sourceMimeType
    });
    const aiContent = buildResult.content;
    uploadedFileId = buildResult.uploadedFileId;

    const response = await client.responses.create({
      model,
      temperature: 0.3,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are an academic content generator for a study platform. Study the uploaded syllabus carefully and return only valid JSON with keys: title, overview, units, keywords, revisionChecklist, likelyQuestions. Cover every meaningful point from the syllabus. Build an exam-oriented study pack, not a generic summary. Each unit should have a concise title and 4 to 8 specific bullet points based on the actual syllabus content. Keywords should be useful revision terms. Revision checklist should be actionable. Likely questions should be realistic university exam questions. Do not include markdown fences or explanation outside JSON."
            }
          ]
        },
        {
          role: "user",
          content: aiContent
        }
      ]
    });

    if (uploadedFileId) {
      await client.files.delete(uploadedFileId).catch(() => undefined);
    }

    const outputText = extractJsonBlock(toJsonString(response.output_text));
    const parsedNotes = JSON.parse(outputText);

    return normalizeStructuredNotes(parsedNotes, {
      extractedText,
      subject,
      course,
      semester,
      outputType,
      manualTopics,
      sourceFileName
    });
  } catch (error) {
    if (uploadedFileId) {
      await client.files.delete(uploadedFileId).catch(() => undefined);
    }

    if (!extractedTextStrongEnough) {
      if (error?.status === 429 || error?.code === "insufficient_quota") {
        throw new Error(
          "OpenAI quota is exhausted for syllabus generation. Please check billing/quota, then try the scanned PDF or image again."
        );
      }

      throw new Error(
        "We could not extract this scanned PDF/image with AI right now. Please check the OpenAI key/model setup and try again."
      );
    }

    console.error("AI syllabus generation failed, falling back to heuristic generation:", error);
    return buildStructuredNotesFallback({
      extractedText,
      subject,
      course,
      semester,
      outputType,
      manualTopics,
      sourceFileName
    });
  }
};

export const buildStructuredNotes = async (input) => buildStructuredNotesWithAi(input);

const ensureParentDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const writeSectionTitle = (doc, title) => {
  doc
    .moveDown()
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#0f172a")
    .text(title);
  doc.moveDown(0.4);
};

const writeBullets = (doc, items) => {
  doc.font("Helvetica").fontSize(11).fillColor("#334155");
  items.forEach((item) => {
    doc.text(`• ${item}`, { indent: 14, continued: false });
    doc.moveDown(0.25);
  });
};

export const generateStructuredPdf = async ({
  title,
  subject,
  course,
  semester,
  outputType,
  sourceFileName,
  structuredNotes
}) => {
  const safeStem = `${Date.now()}-${title}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const filename = `${safeStem || "syllabus-notes"}.pdf`;
  const outputPath = path.resolve(syllabusGeneratedDir, filename);
  await ensureParentDir(outputPath);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 54
    });

    const stream = doc.pipe(fsSync.createWriteStream(outputPath));
    stream.on("finish", resolve);
    stream.on("error", reject);

    doc.rect(0, 0, doc.page.width, 140).fill("#fff7ed");
    doc.fillColor("#d97706").font("Helvetica-Bold").fontSize(11).text("OCI - EduTech Smart Generator", 54, 46, {
      characterSpacing: 2
    });
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(24).text(title, 54, 68, {
      width: doc.page.width - 108
    });
    doc.fillColor("#475569").font("Helvetica").fontSize(11).text(
      [subject, course, semester].filter(Boolean).join(" • ") || "Generated study support",
      54,
      112
    );

    doc.moveDown(5.5);
    doc.font("Helvetica").fontSize(11).fillColor("#334155").text(structuredNotes.overview, {
      lineGap: 4
    });

    writeSectionTitle(doc, "Source");
    writeBullets(doc, [
      `Uploaded syllabus: ${sourceFileName}`,
      `Output type: ${outputType.replace(/_/g, " ")}`,
      "Generated as a structured study-ready draft from the uploaded syllabus"
    ]);

    writeSectionTitle(doc, "Unit-wise topics");
    structuredNotes.units.forEach((unit, index) => {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text(`${index + 1}. ${unit.title}`);
      doc.moveDown(0.25);
      writeBullets(doc, unit.points);
      doc.moveDown(0.35);
    });

    writeSectionTitle(doc, "Keywords and revision concepts");
    writeBullets(doc, structuredNotes.keywords);

    writeSectionTitle(doc, "Revision checklist");
    writeBullets(doc, structuredNotes.revisionChecklist);

    writeSectionTitle(doc, "Likely exam questions");
    writeBullets(doc, structuredNotes.likelyQuestions);

    doc.moveDown();
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("#64748b").text(
      "This PDF was prepared from the uploaded syllabus and should be reviewed with the official curriculum before final study use.",
      {
        lineGap: 4
      }
    );

    doc.end();
  });

  return {
    filename,
    outputPath
  };
};

export const removeGeneratedAsset = async (fileUrl) => {
  if (!fileUrl?.includes("/uploads/")) return;
  const relativePath = fileUrl.split("/uploads/")[1];
  if (!relativePath) return;

  const absolutePath = path.resolve(__dirname, "../../uploads", relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Failed to remove syllabus asset:", absolutePath, error);
    }
  }
};
