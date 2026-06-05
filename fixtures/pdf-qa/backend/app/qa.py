import math
import re
from collections import Counter

_WORD = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> list[str]:
    return _WORD.findall(text.lower())


class Index:
    """TF-IDF index over a document's chunks with cosine-similarity lookup."""

    def __init__(self, chunks: list[str]):
        self.chunks = chunks
        self._tf = [Counter(_tokens(c)) for c in chunks]
        df: Counter[str] = Counter()
        for tf in self._tf:
            df.update(tf.keys())
        n = max(len(chunks), 1)
        self._idf = {term: math.log((n + 1) / (count + 1)) + 1 for term, count in df.items()}
        self._vectors = [self._vectorize(tf) for tf in self._tf]

    def _vectorize(self, tf: Counter[str]) -> dict[str, float]:
        return {term: count * self._idf.get(term, 0.0) for term, count in tf.items()}

    def answer(self, question: str) -> tuple[int, float]:
        """Return the (chunk index, similarity score) best matching the question."""
        q_vec = self._vectorize(Counter(_tokens(question)))
        best_idx, best_score = -1, 0.0
        for i, vec in enumerate(self._vectors):
            score = _cosine(q_vec, vec)
            if score > best_score:
                best_idx, best_score = i, score
        return best_idx, best_score


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    shared = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in shared)
    if dot == 0:
        return 0.0
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    return dot / (norm_a * norm_b)
