import { Degree, DegreeDetail, Document, MockTest, MockTestDetailResponse, Project } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return response.json();
}

export const serverApi = {
  getDegrees: () => getJson<Degree[]>("/degrees"),
  getDegreeDetail: (id: string) => getJson<DegreeDetail>(`/degrees/${id}`),
  getMockTests: () => getJson<MockTest[]>("/mocktests"),
  getMockTestDetail: (id: string) => getJson<MockTestDetailResponse>(`/mocktests/${id}`),
  getProjects: () => getJson<Project[]>("/projects"),
  getProjectById: (id: string) => getJson<Project>(`/project/${id}`),
  getDocuments: () => getJson<Document[]>("/documents"),
  getDocumentsByStream: (stream: string) => getJson<Document[]>(`/documents?stream=${encodeURIComponent(stream)}`),
  getTeacherNotes: () => getJson<Document[]>("/documents/teacher-notes")
};
