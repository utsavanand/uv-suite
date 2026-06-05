import { useState } from "react";

import type { AnswerResponse, UploadResponse } from "@pdf-qa/sdk";

import { client } from "./api";

export function App() {
  const [doc, setDoc] = useState<UploadResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      setDoc(await client.uploadPdf(file));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onAsk() {
    if (!doc || !question.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setAnswer(await client.ask(doc.id, question));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>PDF Q&amp;A</h1>

      <input
        type="file"
        accept="application/pdf"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />

      {doc && (
        <p>
          Loaded <strong>{doc.filename}</strong> ({doc.num_chunks} chunks). Ask a question:
        </p>
      )}

      {doc && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            value={question}
            disabled={busy}
            placeholder="What is this document about?"
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAsk()}
          />
          <button onClick={onAsk} disabled={busy || !question.trim()}>
            Ask
          </button>
        </div>
      )}

      {answer && (
        <blockquote style={{ borderLeft: "3px solid #ccc", paddingLeft: 12 }}>
          <p>{answer.answer}</p>
          <small>match score: {answer.score}</small>
        </blockquote>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
