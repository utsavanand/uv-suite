from io import BytesIO

from pypdf import PdfReader


def extract_chunks(data: bytes) -> list[str]:
    """Extract text from a PDF and split it into paragraph-sized chunks."""
    reader = PdfReader(BytesIO(data))
    chunks: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        for para in text.split("\n\n"):
            para = " ".join(para.split())
            if len(para) >= 40:
                chunks.append(para)
    return chunks
