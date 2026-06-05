import type { AnswerResponse, UploadResponse } from "./types";

export type { AnswerResponse, UploadResponse };

/** Client for the PDF-QA BFF. Browser code talks to the BFF only, never the backend. */
export class PdfQaClient {
  constructor(private readonly baseUrl: string) {}

  async uploadPdf(file: File): Promise<UploadResponse> {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${this.baseUrl}/api/documents`, { method: "POST", body });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
    }
    return res.json();
  }

  async ask(docId: string, question: string): Promise<AnswerResponse> {
    const res = await fetch(`${this.baseUrl}/api/documents/${docId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      throw new Error(`Ask failed (${res.status}): ${await res.text()}`);
    }
    return res.json();
  }
}
