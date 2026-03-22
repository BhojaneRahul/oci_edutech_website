import asyncHandler from "express-async-handler";
import { prisma } from "../config/db.js";
import { withMongoStyleId } from "../utils/serializers.js";
import {
  applyMockTestExitPenalty,
  awardMockTestStartXp,
  awardMockTestSubmitXp
} from "../services/gamificationService.js";
import { buildMockTestTargetPath, createNotifications } from "../services/notificationService.js";

const OPTION_VALUES = ["A", "B", "C", "D"];

const serializeQuestion = (question) => ({
  _id: question.id,
  orderIndex: question.orderIndex,
  questionText: question.questionText,
  options: [
    { key: "A", value: question.optionA },
    { key: "B", value: question.optionB },
    { key: "C", value: question.optionC },
    { key: "D", value: question.optionD }
  ]
});

const serializeAttempt = (attempt) => ({
  _id: attempt.id,
  started: attempt.started,
  completed: attempt.completed,
  exited: attempt.exited,
  currentQuestion: attempt.currentQuestion,
  score: attempt.score,
  totalQuestions: attempt.totalQuestions,
  correctAnswers: attempt.correctAnswers,
  wrongAnswers: attempt.wrongAnswers,
  accuracy: attempt.accuracy,
  xpEarned: attempt.xpEarned,
  startedAt: attempt.startedAt,
  submittedAt: attempt.submittedAt,
  answers: attempt.answers.map((answer) => ({
    _id: answer.id,
    questionId: answer.questionId,
    selectedOption: answer.selectedOption,
    isCorrect: answer.isCorrect
  }))
});

const serializeMockTestListItem = (test) =>
  withMongoStyleId({
    ...test,
    totalQuestions: test._count.questions
  });

const serializeMockTestDetail = (test) =>
  withMongoStyleId({
    ...test,
    totalQuestions: [...test.questions].sort((a, b) => a.orderIndex - b.orderIndex).length,
    questions: [...test.questions].sort((a, b) => a.orderIndex - b.orderIndex).map(serializeQuestion)
  });

const serializeAdminQuestion = (question) => ({
  _id: question.id,
  orderIndex: question.orderIndex,
  questionText: question.questionText,
  optionA: question.optionA,
  optionB: question.optionB,
  optionC: question.optionC,
  optionD: question.optionD,
  correctAnswer: question.correctAnswer
});

const serializeAdminMockTestDetail = (test) =>
  withMongoStyleId({
    ...test,
    totalQuestions: [...test.questions].sort((a, b) => a.orderIndex - b.orderIndex).length,
    questions: [...test.questions].sort((a, b) => a.orderIndex - b.orderIndex).map(serializeAdminQuestion)
  });

const getActiveAttempt = async (mockTestId, userId) =>
  prisma.testAttempt.findFirst({
    where: {
      mockTestId,
      userId,
      completed: false,
      exited: false
    },
    include: {
      answers: true
    },
    orderBy: { createdAt: "desc" }
  });

const normalizeMockTestPayload = ({
  title,
  description,
  durationMinutes,
  difficulty = "medium",
  subject,
  degreeId,
  stream,
  isPublished = true,
  questions = []
}) => {
  if (!title || !description || !durationMinutes || !subject || !degreeId || !stream) {
    const error = new Error("Title, description, duration, subject, degree, and stream are required");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(questions) || !questions.length) {
    const error = new Error("At least one question is required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedQuestions = questions.map((question, index) => {
    if (
      !question.questionText ||
      !question.optionA ||
      !question.optionB ||
      !question.optionC ||
      !question.optionD ||
      !OPTION_VALUES.includes(String(question.correctAnswer || "").toUpperCase())
    ) {
      const error = new Error(`Question ${index + 1} is incomplete`);
      error.statusCode = 400;
      throw error;
    }

    return {
      orderIndex: index + 1,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: String(question.correctAnswer).toUpperCase()
    };
  });

  return {
    title,
    description,
    durationMinutes: Number(durationMinutes),
    difficulty,
    subject,
    degreeId: Number(degreeId),
    stream,
    isPublished: Boolean(isPublished),
    normalizedQuestions
  };
};

export const getMockTests = asyncHandler(async (req, res) => {
  const degreeId = req.query.degreeId ? Number(req.query.degreeId) : undefined;
  const stream = req.query.stream ? String(req.query.stream) : undefined;

  const mockTests = await prisma.mockTest.findMany({
    where: {
      isPublished: true,
      degreeId,
      ...(stream ? { stream } : {})
    },
    include: {
      degree: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          questions: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  res.json(mockTests.map(serializeMockTestListItem));
});

export const getMockTestById = asyncHandler(async (req, res) => {
  const mockTestId = Number(req.params.id);

  if (!mockTestId) {
    res.status(400);
    throw new Error("Mock test id is required");
  }

  const mockTest = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
    include: {
      degree: {
        select: {
          id: true,
          name: true
        }
      },
      questions: true
    }
  });

  if (!mockTest || !mockTest.isPublished) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  let activeAttempt = null;
  if (req.user?.id) {
    activeAttempt = await getActiveAttempt(mockTestId, req.user.id);
  }

  res.json({
    success: true,
    mockTest: serializeMockTestDetail(mockTest),
    activeAttempt: activeAttempt ? serializeAttempt(activeAttempt) : null
  });
});

export const createMockTest = asyncHandler(async (req, res) => {
  let normalizedPayload;
  try {
    normalizedPayload = normalizeMockTestPayload(req.body);
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  }

  const {
    title,
    description,
    durationMinutes: normalizedDurationMinutes,
    difficulty,
    subject,
    degreeId: normalizedDegreeId,
    stream,
    isPublished,
    normalizedQuestions
  } = normalizedPayload;

  const mockTest = await prisma.mockTest.create({
    data: {
      title,
      description,
      durationMinutes: normalizedDurationMinutes,
      difficulty,
      subject,
      degreeId: normalizedDegreeId,
      stream,
      isPublished,
      questions: {
        create: normalizedQuestions
      }
    },
    include: {
      degree: {
        select: {
          id: true,
          name: true
        }
      },
      questions: {
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (mockTest.isPublished) {
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.id
        }
      },
      select: { id: true }
    });

    if (users.length) {
      await createNotifications({
        userIds: users.map((user) => user.id),
        type: "mock_test",
        title: "New Mock Test Published",
        message: `${mockTest.stream} • ${mockTest.title}`,
        targetPath: buildMockTestTargetPath(mockTest.id)
      });
    }
  }

  res.status(201).json({
    success: true,
    mockTest: serializeMockTestDetail(mockTest)
  });
});

export const getAdminMockTests = asyncHandler(async (_req, res) => {
  const mockTests = await prisma.mockTest.findMany({
    include: {
      degree: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          questions: true,
          attempts: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
  });

  res.json(
    mockTests.map((test) =>
      withMongoStyleId({
        ...test,
        totalQuestions: test._count.questions,
        attemptsCount: test._count.attempts
      })
    )
  );
});

export const getAdminMockTestById = asyncHandler(async (req, res) => {
  const mockTestId = Number(req.params.id);

  if (!mockTestId) {
    res.status(400);
    throw new Error("Mock test id is required");
  }

  const mockTest = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
    include: {
      degree: {
        select: {
          id: true,
          name: true
        }
      },
      questions: {
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!mockTest) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  res.json({
    success: true,
    mockTest: serializeAdminMockTestDetail(mockTest)
  });
});

export const updateMockTest = asyncHandler(async (req, res) => {
  const mockTestId = Number(req.params.id);

  if (!mockTestId) {
    res.status(400);
    throw new Error("Mock test id is required");
  }

  let normalizedPayload;
  try {
    normalizedPayload = normalizeMockTestPayload(req.body);
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  }

  const {
    title,
    description,
    durationMinutes,
    difficulty,
    subject,
    degreeId,
    stream,
    isPublished,
    normalizedQuestions
  } = normalizedPayload;

  const mockTest = await prisma.$transaction(async (tx) => {
    await tx.answer.deleteMany({
      where: {
        question: {
          mockTestId
        }
      }
    });

    await tx.question.deleteMany({
      where: { mockTestId }
    });

    return tx.mockTest.update({
      where: { id: mockTestId },
      data: {
        title,
        description,
        durationMinutes,
        difficulty,
        subject,
        degreeId,
        stream,
        isPublished,
        questions: {
          create: normalizedQuestions
        }
      },
      include: {
        degree: {
          select: {
            id: true,
            name: true
          }
        },
        questions: true
      }
    });
  });

  if (mockTest.isPublished) {
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.id
        }
      },
      select: { id: true }
    });

    if (users.length) {
      await createNotifications({
        userIds: users.map((user) => user.id),
        type: "mock_test",
        title: "Mock Test Updated",
        message: `${mockTest.stream} • ${mockTest.title}`,
        targetPath: buildMockTestTargetPath(mockTest.id)
      });
    }
  }

  res.json({
    success: true,
    message: "Mock test updated successfully",
    mockTest: serializeAdminMockTestDetail(mockTest)
  });
});

export const deleteMockTest = asyncHandler(async (req, res) => {
  const mockTestId = Number(req.params.id);

  if (!mockTestId) {
    res.status(400);
    throw new Error("Mock test id is required");
  }

  await prisma.mockTest.delete({
    where: { id: mockTestId }
  });

  res.json({
    success: true,
    message: "Mock test deleted successfully"
  });
});

export const startMockTest = asyncHandler(async (req, res) => {
  const mockTestId = Number(req.body.mockTestId);

  if (!mockTestId) {
    res.status(400);
    throw new Error("Mock test id is required");
  }

  const mockTest = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
    include: {
      degree: {
        select: { id: true, name: true }
      },
      questions: {
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!mockTest || !mockTest.isPublished) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  const existingAttempt = await getActiveAttempt(mockTestId, req.user.id);
  if (existingAttempt) {
    res.json({
      success: true,
      message: "Existing attempt resumed",
      mockTest: serializeMockTestDetail(mockTest),
      attempt: serializeAttempt(existingAttempt)
    });
    return;
  }

  const attempt = await prisma.$transaction(async (tx) => {
    const createdAttempt = await tx.testAttempt.create({
      data: {
        mockTestId,
        userId: req.user.id,
        started: true,
        currentQuestion: 1,
        totalQuestions: mockTest.questions.length,
        startedAt: new Date()
      },
      include: {
        answers: true
      }
    });

    await awardMockTestStartXp(req.user.id, mockTestId, tx);

    return createdAttempt;
  });

  res.status(201).json({
    success: true,
    message: "Mock test started",
    mockTest: serializeMockTestDetail(mockTest),
    attempt: serializeAttempt(attempt)
  });
});

export const saveMockTestAnswer = asyncHandler(async (req, res) => {
  const attemptId = Number(req.body.attemptId);
  const questionId = Number(req.body.questionId);
  const selectedOption = String(req.body.selectedOption || "").toUpperCase();

  if (!attemptId || !questionId || !OPTION_VALUES.includes(selectedOption)) {
    res.status(400);
    throw new Error("Attempt, question, and selected option are required");
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      mockTest: {
        include: {
          questions: {
            orderBy: { orderIndex: "asc" }
          }
        }
      },
      answers: true
    }
  });

  if (!attempt || attempt.userId !== req.user.id) {
    res.status(404);
    throw new Error("Attempt not found");
  }

  if (attempt.completed || attempt.exited) {
    res.status(400);
    throw new Error("This attempt is already closed");
  }

  const question = attempt.mockTest.questions.find((item) => item.id === questionId);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  if (question.orderIndex > attempt.currentQuestion) {
    res.status(403);
    throw new Error("This question is locked");
  }

  const savedAnswer = await prisma.$transaction(async (tx) => {
    const answer = await tx.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId
        }
      },
      update: {
        selectedOption,
        isCorrect: question.correctAnswer === selectedOption
      },
      create: {
        attemptId,
        questionId,
        selectedOption,
        isCorrect: question.correctAnswer === selectedOption
      }
    });

    const nextQuestion = Math.min(attempt.totalQuestions, question.orderIndex + 1);
    const updatedAttempt = await tx.testAttempt.update({
      where: { id: attemptId },
      data: {
        currentQuestion: Math.max(attempt.currentQuestion, nextQuestion)
      },
      include: {
        answers: true
      }
    });

    return { answer, updatedAttempt };
  });

  res.json({
    success: true,
    message: "Answer saved",
    answer: {
      questionId,
      selectedOption,
      isCorrect: savedAnswer.answer.isCorrect
    },
    attempt: serializeAttempt(savedAnswer.updatedAttempt)
  });
});

export const submitMockTest = asyncHandler(async (req, res) => {
  const attemptId = Number(req.body.attemptId);

  if (!attemptId) {
    res.status(400);
    throw new Error("Attempt id is required");
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      mockTest: {
        include: {
          questions: {
            orderBy: { orderIndex: "asc" }
          }
        }
      },
      answers: true
    }
  });

  if (!attempt || attempt.userId !== req.user.id) {
    res.status(404);
    throw new Error("Attempt not found");
  }

  if (attempt.completed) {
    res.json({
      success: true,
      message: "Mock test already submitted",
      result: {
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        accuracy: attempt.accuracy,
        xpEarned: attempt.xpEarned
      }
    });
    return;
  }

  const totalQuestions = attempt.mockTest.questions.length;
  const correctAnswers = attempt.answers.filter((answer) => answer.isCorrect).length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const score = correctAnswers;
  const accuracy = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const result = await prisma.$transaction(async (tx) => {
    const xpEarned = await awardMockTestSubmitXp(req.user.id, attempt.mockTestId, accuracy, tx);

    return tx.testAttempt.update({
      where: { id: attemptId },
      data: {
        completed: true,
        exited: false,
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        accuracy,
        xpEarned,
        submittedAt: new Date()
      }
    });
  });

  res.json({
    success: true,
    message: "Mock test submitted",
    result: {
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      accuracy: result.accuracy,
      xpEarned: result.xpEarned
    }
  });
});

export const exitMockTest = asyncHandler(async (req, res) => {
  const attemptId = Number(req.body.attemptId);

  if (!attemptId) {
    res.status(400);
    throw new Error("Attempt id is required");
  }

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId }
  });

  if (!attempt || attempt.userId !== req.user.id) {
    res.status(404);
    throw new Error("Attempt not found");
  }

  if (attempt.completed || attempt.exited) {
    res.json({
      success: true,
      message: "Attempt already closed"
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.testAttempt.update({
      where: { id: attemptId },
      data: {
        exited: true,
        exitPenaltyApplied: true
      }
    });

    await applyMockTestExitPenalty(req.user.id, attempt.mockTestId, tx);
  });

  res.json({
    success: true,
    message: "Exit penalty applied"
  });
});
