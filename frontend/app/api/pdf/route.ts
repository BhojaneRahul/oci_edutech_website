import { NextRequest } from "next/server";

function getBackendOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    return new URL(apiUrl).origin;
  } catch {
    return "http://localhost:5000";
  }
}

function resolveSourceUrl(source: string) {
  const backendOrigin = getBackendOrigin();

  if (source.startsWith("/uploads/")) {
    return new URL(source, backendOrigin);
  }

  return new URL(source);
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("src");

  if (!source) {
    return Response.json({ success: false, message: "PDF source is required." }, { status: 400 });
  }

  let resolvedUrl: URL;

  try {
    resolvedUrl = resolveSourceUrl(source);
  } catch {
    return Response.json({ success: false, message: "Invalid PDF source URL." }, { status: 400 });
  }
  const isHttpSource = /^https?:$/i.test(resolvedUrl.protocol);
  if (!isHttpSource) {
    return Response.json({ success: false, message: "Only HTTP and HTTPS PDF files are allowed." }, { status: 400 });
  }

  let response: Response;

  try {
    response = await fetch(resolvedUrl.toString(), {
      cache: "no-store"
    });
  } catch {
    return Response.json(
      { success: false, message: "PDF source could not be reached right now. Please try again." },
      { status: 504 }
    );
  }

  if (!response.ok) {
    return Response.json({ success: false, message: "Unable to fetch the uploaded PDF." }, { status: response.status });
  }

  const headers = new Headers();
  headers.set("Content-Type", response.headers.get("content-type") || "application/pdf");
  headers.set("Cache-Control", "no-store");

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(response.body, {
    status: 200,
    headers
  });
}
