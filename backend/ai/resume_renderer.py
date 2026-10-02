import re

import pymupdf


PAGE_WIDTH = 612
PAGE_HEIGHT = 792
MARGIN = 42
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN)

FONT_REGULAR = "helv"
FONT_BOLD = "hebo"
FONT_ITALIC = "heit"

TEXT_COLOR = (0.12, 0.12, 0.14)
MUTED_COLOR = (0.35, 0.35, 0.38)
RULE_COLOR = (0.55, 0.55, 0.58)
ACCENT_COLOR = (0.07, 0.14, 0.3)


def clean_pdf_text(text):
    """
    Replace characters the base-14 Helvetica encoding ("helv") cannot
    render, which otherwise silently turn into "?" in the output PDF.
    """
    if not text:
        return text

    replacements = {
        "•": "-",
        "●": "-",
        "▪": "-",
        "◦": "-",
        "‣": "-",
        "⁃": "-",
        "∙": "-",
        "·": "-",
        "‧": "-",
        "◉": "-",
        "○": "-",
        "➢": "-",
        "➤": "-",
        "➔": "-",
        "→": "-",
        "–": "-",
        "—": "-",
        " ": " ",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def wrap_text(text, fontname, fontsize, max_width):
    """Greedy word-wrap using actual glyph widths for this font/size."""
    text = clean_pdf_text(text or "").strip()

    if not text:
        return []

    words = text.split()
    lines = []
    current = ""

    for word in words:
        candidate = f"{current} {word}".strip()

        if pymupdf.get_text_length(candidate, fontname=fontname, fontsize=fontsize) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines or [text]


def find_keyword_spans(text, keywords):
    """
    Find non-overlapping (start, end) spans in text matching any of the
    given keywords, case-insensitively, on word boundaries, longest
    keyword first (so "vector database" wins over "database").
    """
    if not keywords:
        return []

    unique_keywords = sorted(
        {keyword.strip() for keyword in keywords if keyword and keyword.strip()},
        key=len,
        reverse=True,
    )

    lower_text = text.lower()
    occupied = [False] * len(text)
    spans = []

    for keyword in unique_keywords:
        keyword_lower = keyword.lower()
        if not keyword_lower:
            continue

        search_start = 0
        while True:
            index = lower_text.find(keyword_lower, search_start)
            if index == -1:
                break

            end = index + len(keyword_lower)
            before_ok = index == 0 or not text[index - 1].isalnum()
            after_ok = end == len(text) or not text[end].isalnum()

            if before_ok and after_ok and not any(occupied[index:end]):
                spans.append((index, end))
                for i in range(index, end):
                    occupied[i] = True

            search_start = index + 1

    spans.sort()
    return spans


def build_styled_words(text, keywords):
    """
    Split text into real whitespace-delimited words, each word itself a
    list of (sub_text, is_bold) runs with NO inserted spacing between
    them — this keeps punctuation glued to its word (e.g. "(RAG)")
    while still bolding just the matched keyword portion inside it.
    """
    spans = find_keyword_spans(text, keywords)
    words = []

    for match in re.finditer(r"\S+", text):
        word_start, word_end = match.start(), match.end()
        runs = []
        cursor = word_start

        for span_start, span_end in spans:
            if span_end <= cursor or span_start >= word_end:
                continue

            start = max(span_start, cursor)
            end = min(span_end, word_end)

            if start > cursor:
                runs.append((text[cursor:start], False))

            runs.append((text[start:end], True))
            cursor = end

        if cursor < word_end:
            runs.append((text[cursor:word_end], False))

        words.append(runs or [(text[word_start:word_end], False)])

    return words


def _word_width(word_runs, fontsize):
    return sum(
        pymupdf.get_text_length(
            run_text,
            fontname=FONT_BOLD if is_bold else FONT_REGULAR,
            fontsize=fontsize,
        )
        for run_text, is_bold in word_runs
    )


def wrap_word_runs(words, fontsize, max_width):
    """Greedy word-wrap a list of words (each word a list of (text,
    is_bold) runs) into lines, respecting each run's own font metrics
    (bold glyphs are slightly wider than regular ones)."""
    space_width = pymupdf.get_text_length(" ", fontname=FONT_REGULAR, fontsize=fontsize)

    lines = []
    current_line = []
    current_width = 0.0

    for word_runs in words:
        width = _word_width(word_runs, fontsize)
        extra = (space_width if current_line else 0) + width

        if current_line and current_width + extra > max_width:
            lines.append(current_line)
            current_line = [word_runs]
            current_width = width
        else:
            current_line.append(word_runs)
            current_width += extra

    if current_line:
        lines.append(current_line)

    return lines


class ResumeCanvas:
    """
    Builds a fresh, clean, single-column resume PDF from structured
    content by flowing text top-to-bottom with exact, computed line
    heights — unlike redacting/reinserting text into the original
    PDF's fixed bounding boxes, this never leaves leftover blank space
    when optimized content is shorter than the original.
    """

    def __init__(self):
        self.document = pymupdf.open()
        self.page = None
        self.y = 0
        self._new_page()

    def _new_page(self):
        self.page = self.document.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
        self.y = MARGIN

    def ensure_space(self, height):
        if self.y + height > PAGE_HEIGHT - MARGIN:
            self._new_page()

    def spacer(self, height):
        self.y += height

    def hr(self, gap_before=4, gap_after=8):
        self.y += gap_before
        self.page.draw_line(
            (MARGIN, self.y),
            (PAGE_WIDTH - MARGIN, self.y),
            color=RULE_COLOR,
            width=0.75,
        )
        self.y += gap_after

    def text_line(
        self,
        text,
        fontsize=10,
        bold=False,
        color=TEXT_COLOR,
        align="left",
        x0=None,
        x1=None,
        line_height=None,
    ):
        text = clean_pdf_text(text)
        if not text:
            return

        fontname = FONT_BOLD if bold else FONT_REGULAR
        left = MARGIN if x0 is None else x0
        right = PAGE_WIDTH - MARGIN if x1 is None else x1

        self.ensure_space(fontsize * 1.4)

        if align == "center":
            text_width = pymupdf.get_text_length(text, fontname=fontname, fontsize=fontsize)
            origin_x = left + ((right - left) - text_width) / 2
        elif align == "right":
            text_width = pymupdf.get_text_length(text, fontname=fontname, fontsize=fontsize)
            origin_x = right - text_width
        else:
            origin_x = left

        baseline_y = self.y + fontsize
        self.page.insert_text(
            (origin_x, baseline_y),
            text,
            fontsize=fontsize,
            fontname=fontname,
            color=color,
        )

        self.y += line_height if line_height is not None else fontsize * 1.4

    def two_column_line(
        self,
        left_text,
        right_text,
        fontsize=10,
        bold_left=True,
    ):
        """One baseline, left-aligned primary text and right-aligned
        secondary text (e.g. degree name vs. graduation year)."""
        left_text = clean_pdf_text(left_text)
        right_text = clean_pdf_text(right_text)

        self.ensure_space(fontsize * 1.4)

        baseline_y = self.y + fontsize

        if left_text:
            self.page.insert_text(
                (MARGIN, baseline_y),
                left_text,
                fontsize=fontsize,
                fontname=FONT_BOLD if bold_left else FONT_REGULAR,
                color=TEXT_COLOR,
            )

        if right_text:
            right_width = pymupdf.get_text_length(
                right_text, fontname=FONT_REGULAR, fontsize=fontsize
            )
            self.page.insert_text(
                (PAGE_WIDTH - MARGIN - right_width, baseline_y),
                right_text,
                fontsize=fontsize,
                fontname=FONT_REGULAR,
                color=MUTED_COLOR,
            )

        self.y += fontsize * 1.4

    def paragraph(
        self,
        text,
        fontsize=9.5,
        bold=False,
        color=TEXT_COLOR,
        line_spacing=1.28,
        max_width=None,
    ):
        width = CONTENT_WIDTH if max_width is None else max_width
        fontname = FONT_BOLD if bold else FONT_REGULAR
        lines = wrap_text(text, fontname, fontsize, width)
        line_height = fontsize * line_spacing

        for line in lines:
            self.ensure_space(line_height)
            baseline_y = self.y + fontsize
            self.page.insert_text(
                (MARGIN, baseline_y),
                line,
                fontsize=fontsize,
                fontname=fontname,
                color=color,
            )
            self.y += line_height

    def bullet(self, text, fontsize=9.5, indent=13, line_spacing=1.26, gap_after=0.5, keywords=None):
        text = clean_pdf_text(text)
        if not text:
            return

        bullet_x = MARGIN + 2
        text_x = MARGIN + indent
        max_width = CONTENT_WIDTH - indent
        line_height = fontsize * line_spacing

        words = build_styled_words(text, keywords or [])
        styled_lines = wrap_word_runs(words, fontsize, max_width)

        space_width = pymupdf.get_text_length(" ", fontname=FONT_REGULAR, fontsize=fontsize)

        for index, line_words in enumerate(styled_lines):
            self.ensure_space(line_height)
            baseline_y = self.y + fontsize

            if index == 0:
                self.page.draw_circle(
                    (bullet_x, baseline_y - fontsize * 0.32),
                    radius=1.3,
                    color=TEXT_COLOR,
                    fill=TEXT_COLOR,
                )

            x = text_x
            for word_index, word_runs in enumerate(line_words):
                if word_index > 0:
                    x += space_width

                for run_text, is_bold in word_runs:
                    fontname = FONT_BOLD if is_bold else FONT_REGULAR
                    self.page.insert_text(
                        (x, baseline_y),
                        run_text,
                        fontsize=fontsize,
                        fontname=fontname,
                        color=TEXT_COLOR,
                    )
                    x += pymupdf.get_text_length(run_text, fontname=fontname, fontsize=fontsize)

            self.y += line_height

        self.y += gap_after

    def heading(self, text):
        self.spacer(7)
        self.text_line(text.upper(), fontsize=10.5, bold=True, color=ACCENT_COLOR, line_height=13)
        self.hr(gap_before=2, gap_after=6)

    def save(self, path):
        self.document.save(path, garbage=4, deflate=True)
        self.document.close()
