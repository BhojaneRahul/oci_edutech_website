import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import { buildDocumentTargetPath, createNotifications } from "../services/notificationService.js";

const getRequestOrigin = (req) => {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol || "http")
    .split(",")[0]
    .trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || req.get("host") || "")
    .split(",")[0]
    .trim();

  return `${forwardedProto}://${forwardedHost}`;
};

const buildUploadUrl = (req, folder, filename) => `${getRequestOrigin(req)}/uploads/${folder}/${filename}`;

export const normalizeDocument = (document) => ({
  ...withMongoStyleId(document),
  canDownload: document.type === "model_qp",
  isFeatured: Boolean(document.isFeatured),
  isHidden: Boolean(document.isHidden),
  noteCategory: document.noteCategory ?? null,
  viewCount: document.viewCount ?? 0,
  downloadCount: document.downloadCount ?? 0,
  uploader: document.uploader
    ? {
        ...document.uploader,
        verifiedTeacher: Boolean(document.uploader.verifiedTeacher)
      }
    : undefined
});

export const getDocuments = asyncHandler(async (req, res) => {
  const where = {};

  if (req.query.stream) {
    where.stream = req.query.stream;
  }

  if (req.query.type) {
    where.type = req.query.type;
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  res.json(documents.map(normalizeDocument));
});

export const getTeacherNotes = asyncHandler(async (req, res) => {
  const where = {
    type: "notes",
    isHidden: false,
    uploader: {
      verifiedTeacher: true
    }
  };

  if (req.query.stream) {
    where.stream = String(req.query.stream);
  }

  if (req.query.subject) {
    where.subject = {
      contains: String(req.query.subject),
      mode: "insensitive"
    };
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          verifiedTeacher: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(documents.map(normalizeDocument));
});

export const getAdminTeacherNotes = asyncHandler(async (req, res) => {
  const documents = await prisma.document.findMany({
    where: {
      type: "notes",
      uploader: {
        verifiedTeacher: true
      }
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          verifiedTeacher: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(documents.map(normalizeDocument));
});

export const getDocumentById = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  res.json({
    ...normalizeDocument(document),
    uploader: document.uploader
  });
});

export const getAdminDocuments = asyncHandler(async (req, res) => {
  const documents = await prisma.document.findMany({
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(
    documents.map((document) => ({
      ...normalizeDocument(document),
      uploader: document.uploader
    }))
  );
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("PDF file is required");
  }

  const { title, subject, stream, type } = req.body;
  const requestedStreams = req.body.streams ?? req.body["streams[]"] ?? stream;

  const streams = Array.from(
    new Set(
      (Array.isArray(requestedStreams) ? requestedStreams : [requestedStreams])
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );

  if (!title || !subject || !type || !streams.length) {
    res.status(400);
    throw new Error("Title, subject, type, and at least one stream are required");
  }

  const fileUrl = buildUploadUrl(req, "pdfs", req.file.filename);

  const createdDocuments = await prisma.$transaction(
    streams.map((selectedStream) =>
      prisma.document.create({
        data: {
          title,
          subject,
          stream: selectedStream,
          type,
          fileUrl,
          uploadedBy: req.user.id
        }
      })
    )
  );

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: req.user.id
      }
    },
    select: { id: true }
  });

  if (users.length) {
    for (const document of createdDocuments) {
      await createNotifications({
        userIds: users.map((user) => user.id),
        documentId: document.id,
        type: type === "model_qp" ? "document_model_qp" : "document_notes",
        title: `New ${type === "model_qp" ? "Model QP" : "Notes"} Uploaded`,
        message: `${document.stream} ${subject} ${title}`,
        targetPath: buildDocumentTargetPath(document)
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Document uploaded successfully to ${createdDocuments.length} stream${createdDocuments.length > 1 ? "s" : ""}.`,
    documents: createdDocuments.map(normalizeDocument)
  });
});

export const uploadTeacherNote = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("PDF file is required");
  }

  const { title, subject, stream, noteCategory } = req.body;
  const requestedStreams = req.body.streams ?? req.body["streams[]"] ?? stream;
  const streams = Array.from(
    new Set((Array.isArray(requestedStreams) ? requestedStreams : [requestedStreams]).map((value) => String(value ?? "").trim()).filter(Boolean))
  );

  if (!title || !subject || !streams.length || !noteCategory) {
    res.status(400);
    throw new Error("Title, subject, at least one stream, and note category are required");
  }

  const fileUrl = buildUploadUrl(req, "pdfs", req.file.filename);

  const createdDocuments = await prisma.$transaction(
    streams.map((selectedStream) =>
      prisma.document.create({
        data: {
          title,
          subject,
          stream: selectedStream,
          noteCategory,
          type: "notes",
          fileUrl,
          uploadedBy: req.user.id
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhoto: true,
              verifiedTeacher: true,
              createdAt: true
            }
          }
        }
      })
    )
  );
  const primaryDocument = createdDocuments[0];

  const admins = await prisma.user.findMany({
    where: {
      role: "admin",
      id: {
        not: req.user.id
      }
    },
    select: { id: true }
  });

  if (admins.length) {
    await createNotifications({
      userIds: admins.map((admin) => admin.id),
      documentId: primaryDocument.id,
      type: "admin_lecturer_notes",
      title: "New Lecturer Notes Uploaded",
      message: `${primaryDocument.title} was uploaded by ${primaryDocument.uploader?.name || primaryDocument.uploader?.email || "a lecturer"}.`,
      targetPath: "/admin#teacher-notes"
    });
  }

  res.status(201).json({
    success: true,
    message: `Lecturer notes uploaded successfully to ${createdDocuments.length} stream${createdDocuments.length > 1 ? "s" : ""}.`,
    documents: createdDocuments.map(normalizeDocument)
  });
});

export const updateTeacherNote = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: {
        select: {
          id: true,
          verifiedTeacher: true
        }
      }
    }
  });

  if (!existingDocument || existingDocument.type !== "notes" || !existingDocument.uploader?.verifiedTeacher) {
    res.status(404);
    throw new Error("Teacher notes not found");
  }

  if (existingDocument.uploadedBy !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You can only edit your own teacher notes");
  }

  const { title, subject, stream, noteCategory } = req.body;
  const requestedStreams = req.body.streams ?? req.body["streams[]"] ?? stream;
  const streams = Array.from(
    new Set((Array.isArray(requestedStreams) ? requestedStreams : [requestedStreams]).map((value) => String(value ?? "").trim()).filter(Boolean))
  );

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: title ?? existingDocument.title,
      subject: subject ?? existingDocument.subject,
      stream: streams[0] ?? existingDocument.stream,
      noteCategory: noteCategory ?? existingDocument.noteCategory,
      fileUrl: req.file ? buildUploadUrl(req, "pdfs", req.file.filename) : existingDocument.fileUrl
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          verifiedTeacher: true,
          createdAt: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: "Lecturer notes updated successfully.",
    document: normalizeDocument(updatedDocument)
  });
});

export const updateTeacherNoteStatus = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const { isFeatured, isHidden } = req.body;

  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: {
        select: {
          verifiedTeacher: true
        }
      }
    }
  });

  if (!existingDocument || existingDocument.type !== "notes" || !existingDocument.uploader?.verifiedTeacher) {
    res.status(404);
    throw new Error("Teacher note not found");
  }

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : existingDocument.isFeatured,
      isHidden: typeof isHidden === "boolean" ? isHidden : existingDocument.isHidden
    },
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          verifiedTeacher: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: "Lecturer notes status updated successfully",
    document: normalizeDocument(updatedDocument)
  });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!existingDocument) {
    res.status(404);
    throw new Error("Document not found");
  }

  const { title, subject, stream, type } = req.body;

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: title ?? existingDocument.title,
      subject: subject ?? existingDocument.subject,
      stream: stream ?? existingDocument.stream,
      type: type ?? existingDocument.type,
      fileUrl: req.file ? buildUploadUrl(req, "pdfs", req.file.filename) : existingDocument.fileUrl
    }
  });

  res.json({
    success: true,
    message: "Document updated successfully",
    document: normalizeDocument(updatedDocument)
  });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId }
  });

  if (!existingDocument) {
    res.status(404);
    throw new Error("Document not found");
  }

  await prisma.document.delete({
    where: { id: documentId }
  });

  try {
    const filename = String(existingDocument.fileUrl).split("/uploads/pdfs/")[1];
    if (filename) {
      const filePath = path.resolve(process.cwd(), "backend", "uploads", "pdfs", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Keep the database delete successful even if file cleanup fails.
  }

  res.json({
    success: true,
    message: "Document deleted successfully"
  });
});

export const deleteTeacherNote = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDocument = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: {
        select: {
          id: true,
          verifiedTeacher: true
        }
      }
    }
  });

  if (!existingDocument || existingDocument.type !== "notes" || !existingDocument.uploader?.verifiedTeacher) {
    res.status(404);
    throw new Error("Teacher note not found");
  }

  const canDelete = req.user.role === "admin" || existingDocument.uploadedBy === req.user.id;

  if (!canDelete) {
    res.status(403);
    throw new Error("You can only delete your own teacher notes");
  }

  await prisma.document.delete({
    where: { id: documentId }
  });

  try {
    const filename = String(existingDocument.fileUrl).split("/uploads/pdfs/")[1];
    if (filename) {
      const filePath = path.resolve(process.cwd(), "backend", "uploads", "pdfs", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Keep the database delete successful even if file cleanup fails.
  }

  res.json({
    success: true,
    message: "Lecturer notes deleted successfully"
  });
});

export const incrementDocumentView = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingView = await prisma.documentView.findUnique({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    }
  });

  let document;

  if (existingView) {
    document = await prisma.document.findUnique({
      where: { id: documentId }
    });
  } else {
    await prisma.documentView.create({
      data: {
        userId: req.user.id,
        documentId
      }
    });

    document = await prisma.document.update({
      where: { id: documentId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });
  }

  res.json({
    success: true,
    viewCount: document?.viewCount ?? 0,
    counted: !existingView
  });
});

export const incrementDocumentDownload = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id);
  const existingDownload = await prisma.documentDownload.findUnique({
    where: {
      userId_documentId: {
        userId: req.user.id,
        documentId
      }
    }
  });

  let document;

  if (existingDownload) {
    document = await prisma.document.findUnique({
      where: { id: documentId }
    });
  } else {
    await prisma.documentDownload.create({
      data: {
        userId: req.user.id,
        documentId
      }
    });

    document = await prisma.document.update({
      where: { id: documentId },
      data: {
        downloadCount: {
          increment: 1
        }
      }
    });
  }

  res.json({
    success: true,
    downloadCount: document?.downloadCount ?? 0,
    counted: !existingDownload
  });
});
