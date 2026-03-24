export type User = {
  id: string | number;
  name: string;
  email: string;
  profilePhoto?: string | null;
  university?: string | null;
  phone?: string | null;
  course?: string | null;
  semester?: string | null;
  role: "admin" | "student" | "teacher";
  verifiedTeacher?: boolean;
  communityGroupId?: number | null;
  createdAt: string;
};

export type Degree = {
  _id: string | number;
  name: string;
  description: string;
  icon: string;
};

export type Subject = {
  _id: string | number;
  degreeId?: string | number;
  category: "degree" | "puc";
  group?: string;
  name: string;
  semester: string;
};

export type Note = {
  _id: string | number;
  subjectId: string | Subject;
  title: string;
  pdfUrl: string;
  type: "notes" | "model_qp";
  createdAt: string;
};

export type MockTest = {
  _id: string | number;
  title: string;
  description: string;
  degreeId: string | number;
  subject: string;
  stream: string;
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  isPublished?: boolean;
  attemptsCount?: number;
  degree?: {
    _id?: string | number;
    id?: string | number;
    name: string;
  };
  questions?: MockTestQuestion[];
};

export type MockTestQuestion = {
  _id: string | number;
  orderIndex: number;
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: "A" | "B" | "C" | "D";
  options: { key: "A" | "B" | "C" | "D"; value: string }[];
};

export type MockTestAnswer = {
  _id: number;
  questionId: number;
  selectedOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
};

export type MockTestAttempt = {
  _id: number;
  started: boolean;
  completed: boolean;
  exited: boolean;
  currentQuestion: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  xpEarned: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  answers: MockTestAnswer[];
};

export type MockTestDetailResponse = {
  success: true;
  mockTest: MockTest;
  activeAttempt: MockTestAttempt | null;
};

export type MockTestResult = {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  xpEarned: number;
};

export type Project = {
  _id: string | number;
  title: string;
  description: string;
  category: string;
  level: string;
  technologies: string[];
  images: string[];
  fileUrl?: string | null;
  reportUrl?: string | null;
  createdAt: string;
};

export type DegreeDetail = {
  degree: Degree;
  subjects: Subject[];
  notes: {
    notes: Document[];
    modelQps: Document[];
  };
};

export type Settings = {
  downloadsEnabled: boolean;
  siteStats?: {
    appInstalls: string;
    youtubeMembers: string;
  };
};

export type Document = {
  _id: string | number;
  title: string;
  subject: string;
  stream: string;
  type: "notes" | "model_qp";
  fileUrl: string;
  createdAt: string;
  canDownload?: boolean;
  viewCount?: number;
  downloadCount?: number;
  uploader?: {
    id: number;
    name: string | null;
    email: string;
  };
};

export type SavedDocument = {
  id: number;
  savedAt: string;
  document: Document;
};

export type SearchResults = {
  success: true;
  degrees: Degree[];
  subjects: Subject[];
  documents: Document[];
  mockTests: MockTest[];
  projects: Project[];
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type?: string;
  documentId?: number | null;
  targetPath?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationResponse = {
  success: true;
  unreadCount: number;
  notifications: NotificationItem[];
};

export type LeaderboardEntry = {
  rank: number;
  xp: number;
  level: number;
  streak: number;
  user: {
    id: number;
    name: string | null;
    profilePhoto?: string | null;
    course?: string | null;
  };
};

export type StudyProgressItem = {
  id: number;
  documentId: number;
  title: string;
  subject: string;
  stream: string;
  type: "notes" | "model_qp";
  fileUrl: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
};

export type GamificationDashboard = {
  success: true;
  xp: number;
  level: number;
  streak: {
    current: number;
    longest: number;
    lastStudyDate?: string | null;
  };
  progress: StudyProgressItem[];
  recommendations: Document[];
  leaderboard: LeaderboardEntry[];
};

export type FullLeaderboardResponse = {
  success: true;
  leaderboard: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
};

export type CommunityGroup = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type CommunityChatMessage = {
  id: number;
  groupId: number;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  user: {
    id: number;
    name: string | null;
    profilePhoto?: string | null;
    role: "admin" | "student" | "teacher";
    verifiedTeacher: boolean;
  };
  replyTo: null | {
    id: number;
    content: string;
    user: {
      id: number;
      name: string | null;
    };
  };
  reactions: {
    emoji: string;
    count: number;
    userIds: number[];
  }[];
  files?: {
    id: number;
    fileUrl: string;
    fileName: string;
    fileType: "pdf" | "doc" | "ppt" | "image";
    mimeType: string;
    sizeBytes: number;
    expiresAt: string;
  }[];
};

export type CommunityPresenceMember = {
  id: number;
  name: string | null;
  profilePhoto?: string | null;
  role: "admin" | "student" | "teacher";
  verifiedTeacher: boolean;
};

export type TeacherVerification = {
  id: number;
  fullName: string;
  university: string;
  subjectExpertise: string;
  idCardUrl: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string | null;
  createdAt: string;
  communityGroup: CommunityGroup;
  user?: {
    id: number;
    name: string | null;
    email: string;
    profilePhoto?: string | null;
  };
};

export type CommunityBootstrap = {
  success: true;
  groups: CommunityGroup[];
  activeGroupId: number | null;
  verification: TeacherVerification | null;
  onlineMembers?: CommunityPresenceMember[];
  onlineCount?: number;
  muteSetting?: {
    muted: boolean;
    muteUntil: string | Date | null;
    label: string | null;
  };
  verifiedTeachers: CommunityPresenceMember[];
  messages: CommunityChatMessage[];
};

export type CommunityMessagesResponse = {
  success: true;
  messages: CommunityChatMessage[];
  verifiedTeachers: CommunityPresenceMember[];
  muteSetting: {
    muted: boolean;
    muteUntil: string | Date | null;
    label: string | null;
  };
};

