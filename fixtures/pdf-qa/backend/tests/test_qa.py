import math
import pytest

from app.qa import Index, _cosine, _tokens


class TestTokens:
    def test_lowercases_input(self):
        assert _tokens("Hello World") == ["hello", "world"]

    def test_strips_punctuation(self):
        assert _tokens("Hello, World!") == ["hello", "world"]

    def test_keeps_digits(self):
        assert _tokens("Page 42") == ["page", "42"]

    def test_empty_string_returns_empty_list(self):
        assert _tokens("") == []

    def test_only_punctuation_returns_empty_list(self):
        assert _tokens("!!! ???") == []

    def test_mixed_alphanumeric_word_is_single_token(self):
        assert _tokens("abc123") == ["abc123"]


class TestCosine:
    def test_identical_vectors_return_1(self):
        vec = {"a": 2.0, "b": 3.0}
        assert _cosine(vec, vec) == pytest.approx(1.0)

    def test_orthogonal_vectors_return_0(self):
        a = {"x": 1.0}
        b = {"y": 1.0}
        assert _cosine(a, b) == 0.0

    def test_empty_first_arg_returns_0(self):
        assert _cosine({}, {"a": 1.0}) == 0.0

    def test_empty_second_arg_returns_0(self):
        assert _cosine({"a": 1.0}, {}) == 0.0

    def test_both_empty_returns_0(self):
        assert _cosine({}, {}) == 0.0

    def test_partial_overlap_is_between_0_and_1(self):
        a = {"a": 1.0, "b": 1.0}
        b = {"a": 1.0, "c": 1.0}
        score = _cosine(a, b)
        assert 0.0 < score < 1.0

    def test_dot_product_zero_with_shared_key_returns_0(self):
        # shared key exists but one value is 0.0 -> dot == 0
        a = {"a": 0.0, "b": 1.0}
        b = {"a": 1.0, "c": 1.0}
        score = _cosine(a, b)
        # dot = 0*1 = 0, so result must be 0.0
        assert score == 0.0


class TestIndex:
    def test_best_chunk_returned_for_matching_question(self):
        chunks = [
            "The cat sat on the mat and ate fish",
            "Python is a programming language used by developers",
            "Dogs are loyal companions and make great pets",
        ]
        index = Index(chunks)
        idx, score = index.answer("What programming language do developers use?")
        assert idx == 1
        assert score > 0.0

    def test_returns_chunk_with_highest_term_overlap(self):
        chunks = [
            "apple orange banana fruit salad",
            "car truck bus vehicle transport",
        ]
        index = Index(chunks)
        idx, score = index.answer("banana fruit salad apple")
        assert idx == 0

    def test_empty_question_returns_no_match(self):
        index = Index(["some text here about things"])
        idx, score = index.answer("")
        assert idx == -1
        assert score == 0.0

    def test_question_with_no_shared_terms_returns_no_match(self):
        index = Index(["apples and oranges are delicious fruits"])
        idx, score = index.answer("xyz zyx zzz")
        assert idx == -1
        assert score == 0.0

    def test_single_chunk_matched_by_overlapping_question(self):
        index = Index(["machine learning transforms data into predictions"])
        idx, score = index.answer("machine learning predictions")
        assert idx == 0
        assert score > 0.0

    def test_score_is_bounded_between_0_and_1(self):
        chunks = ["deep learning neural networks gradient descent backprop"]
        index = Index(chunks)
        _, score = index.answer("neural networks gradient descent")
        assert 0.0 <= score <= 1.0

    def test_repeated_term_in_chunk_boosts_score_over_absent_term(self):
        # chunk 0 has "python" three times, chunk 1 has it zero times
        chunks = [
            "python python python is great for scripting",
            "java is a verbose object oriented language",
        ]
        index = Index(chunks)
        idx, _ = index.answer("python")
        assert idx == 0

    def test_single_chunk_index_always_returns_0_when_there_is_overlap(self):
        index = Index(["the quick brown fox jumps over the lazy dog"])
        idx, _ = index.answer("fox jumps dog")
        assert idx == 0

    def test_empty_chunks_list_does_not_crash_and_returns_no_match(self):
        index = Index([])
        idx, score = index.answer("anything")
        assert idx == -1
        assert score == 0.0

    def test_idf_down_weights_terms_present_in_every_chunk(self):
        # "common" appears in both chunks; "unique" appears in only one
        chunks = [
            "common word unique alpha beta",
            "common word other gamma delta",
        ]
        index = Index(chunks)
        # "unique" is exclusive to chunk 0, so a query on it should prefer chunk 0
        idx, _ = index.answer("unique")
        assert idx == 0

    def test_answer_returns_tuple_of_int_and_float(self):
        index = Index(["hello world foo bar"])
        result = index.answer("hello")
        assert isinstance(result[0], int)
        assert isinstance(result[1], float)
