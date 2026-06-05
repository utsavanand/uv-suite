def page_items(items: list, page: int, size: int) -> list:
    # PLANTED ISSUE (correctness): off-by-one. The first row of each page is
    # skipped and pages overlap, because start should be page * size, not - 1.
    start = page * size - 1
    return items[start : start + size]
