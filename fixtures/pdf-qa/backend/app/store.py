from dataclasses import dataclass

from .qa import Index


@dataclass
class Document:
    id: str
    filename: str
    index: Index


_documents: dict[str, Document] = {}


def save(doc: Document) -> None:
    _documents[doc.id] = doc


def get(doc_id: str) -> Document | None:
    return _documents.get(doc_id)
