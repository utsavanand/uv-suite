import uuid

from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel

from . import store
from .pdf import extract_chunks
from .qa import Index

app = FastAPI(title="pdf-qa backend")


class UploadResponse(BaseModel):
    id: str
    filename: str
    num_chunks: int


class AskRequest(BaseModel):
    question: str


class AnswerResponse(BaseModel):
    answer: str
    score: float
    chunk_index: int


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/documents", response_model=UploadResponse)
async def upload(file: UploadFile) -> UploadResponse:
    chunks = extract_chunks(await file.read())
    if not chunks:
        raise HTTPException(422, "No extractable text found in PDF")
    doc = store.Document(id=uuid.uuid4().hex, filename=file.filename or "untitled.pdf", index=Index(chunks))
    store.save(doc)
    return UploadResponse(id=doc.id, filename=doc.filename, num_chunks=len(chunks))


@app.post("/documents/{doc_id}/ask", response_model=AnswerResponse)
def ask(doc_id: str, req: AskRequest) -> AnswerResponse:
    doc = store.get(doc_id)
    if doc is None:
        raise HTTPException(404, "Document not found")
    idx, score = doc.index.answer(req.question)
    if idx < 0:
        return AnswerResponse(answer="No relevant passage found in this document.", score=0.0, chunk_index=-1)
    return AnswerResponse(answer=doc.index.chunks[idx], score=round(score, 4), chunk_index=idx)
