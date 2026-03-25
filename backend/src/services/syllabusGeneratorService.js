import fsSync from "fs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { PDFParse } from "pdf-parse";
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

const getAiClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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

  return {
    title: `${normalizedSubject} ${outputType.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}`,
    overview,
    units,
    keywords,
    revisionChecklist,
    likelyQuestions
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
    revisionChecklist:
      Array.isArray(notes.revisionChecklist) && notes.revisionChecklist.length
        ? dedupe(notes.revisionChecklist.map((item) => String(item || "").trim())).slice(0, 8)
        : fallback.revisionChecklist,
    likelyQuestions:
      Array.isArray(notes.likelyQuestions) && notes.likelyQuestions.length
        ? dedupe(notes.likelyQuestions.map((item) => String(item || "").trim())).slice(0, 8)
        : fallback.likelyQuestions
  };
};

const buildStructuredNotesWithAi = async ({
  extractedText,
  subject,
  course,
  semester,
  outputType,
  manualTopics = [],
  sourceFileName
}) => {
  const client = getAiClient();
  if (!client) {
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

  const trimmedSyllabus = extractedText.replace(/\s+/g, " ").trim().slice(0, 24000);
  const manualTopicText = manualTopics.length ? manualTopics.join(", ") : "No manual topic hints provided.";
  const outputLabel = outputType.replace(/_/g, " ");
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are an academic content generator for a study platform. Read syllabus text carefully and return only valid JSON with keys: title, overview, units, keywords, revisionChecklist, likelyQuestions. Keep the content accurate to the provided syllabus, cover as many meaningful points as possible, and make the notes practical, exam-oriented, and student-friendly. Each unit should have a concise title and 3 to 6 bullet points. Do not include markdown fences."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Create ${outputLabel} from this syllabus.\nSubject: ${subject || "Not provided"}\nCourse: ${course || "Not provided"}\nSemester: ${semester || "Not provided"}\nManual topics: ${manualTopicText}\nSource file: ${sourceFileName}\n\nSyllabus text:\n${trimmedSyllabus}`
            }
          ]
        }
      ]
    });

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
