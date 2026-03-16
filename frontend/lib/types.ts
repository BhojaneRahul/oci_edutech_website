export type User = {
  id: string | number;
  name: string;
  email: string;
  profilePhoto?: string | null;
  university?: string | null;
  phone?: string | null;
  course?: string | null;
  semester?: string | null;
  role: "admin" | "student";
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
  degreeId: string | number;
  questions: { question: string; options: string[]; answer: string }[];
};

export type Project = {
  _id: string | number;
  title: string;
  description: string;
  degree: string;
  downloadLink: string;
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
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  documentId?: number | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationResponse = {
  success: true;
  unreadCount: number;
  notifications: NotificationItem[];
};
