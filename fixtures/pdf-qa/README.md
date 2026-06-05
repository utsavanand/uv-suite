# PDF Q&A — multi-service fixture

A small, runnable, polyglot app used as a test fixture for the `/understand --stack` and
`/understand` skills. Upload a PDF, ask a question, get back the passage from
the document that best matches the question.

The answer is **extractive, not generative** — there is no LLM. The backend
ranks the document's text chunks against the question with a hand-rolled TF-IDF
cosine similarity and returns the top chunk. This keeps the fixture dependency-light
and instant to run; the point is the service topology, not answer quality.

## Services

| Service | Language | Port | Role |
|---------|----------|------|------|
| `frontend` | React + TypeScript (Vite) | 5173 | Upload UI + question box. Talks only to the BFF. |
| `bff` | Go (stdlib `net/http`) | 8080 | REST proxy + CORS. Forwards `/api/*` to the backend. |
| `backend` | Python (FastAPI) | 8000 | PDF text extraction + TF-IDF retrieval. In-memory doc store. |
| `sdk` | TypeScript | — | Client library for the BFF API. Imported by the frontend. |

## Data flow

```
Browser ──upload PDF──▶ frontend ──(SDK)──▶ BFF :8080 ──REST──▶ backend :8000
                                                                   │
                                                          extract text (pypdf)
                                                          build TF-IDF index
                                                                   │
Browser ◀──answer──────  frontend ◀──(SDK)── BFF :8080 ◀──REST──── backend
```

Cross-service edges (what the mapping skills should find):
- `frontend` imports `sdk` as a shared library (`@pdf-qa/sdk`, via a Vite alias).
- `frontend` → `bff` over REST (browser → `VITE_BFF_URL`, CORS-enabled).
- `bff` → `backend` over REST (`BACKEND_URL`, docker-internal DNS).
- `backend` holds documents in an in-memory store (no external DB).

## Run it

```bash
docker compose up --build
```

Then open http://localhost:5173, upload any text-based PDF, and ask a question.
(Scanned/image-only PDFs have no extractable text and will be rejected with 422.)

## API (backend, proxied by the BFF under `/api`)

| Method | BFF path | Backend path | Body | Returns |
|--------|----------|--------------|------|---------|
| GET | `/api/health` | `/health` | — | `{"status":"ok"}` |
| POST | `/api/documents` | `/documents` | multipart `file` | `{id, filename, num_chunks}` |
| POST | `/api/documents/{id}/ask` | `/documents/{id}/ask` | `{"question": "..."}` | `{answer, score, chunk_index}` |

## Why this exists

`/understand --stack` and `/understand` had nothing realistic to map inside this repo.
This fixture gives them a genuine multi-language, multi-service topology with REST
edges and a shared client library — the relationships those skills are built to surface.
