import re

import pymupdf

FONT_REGULAR = "helv"
FONT_BOLD = "hebo"
FONT_ITALIC = "heit"
FONT_BOLD_ITALIC = "hebi"

# Characters the base-14 Helvetica encoding can't render (would silently
# turn into "?"), replaced before any text is written back into the PDF.
_GLYPH_REPLACEMENTS = {
    "•": "-", "●": "-", "▪": "-", "◦": "-", "‣": "-", "⁃": "-", "∙": "-",
    "·": "-", "‧": "-", "◉": "-", "○": "-", "➢": "-", "➤": "-", "➔": "-",
    "→": "-", "–": "-", "—": "-",
}

_EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_URL_PATTERN = re.compile(r"(https?://|www\.)\S+", re.IGNORECASE)
_PHONE_PATTERN = re.compile(r"(\+?\d[\d\-\s().]{7,}\d)")

# Shrink factors tried, in order, when a replacement line doesn't fit at
# the original font size — if none fit, the edit is skipped entirely
# rather than letting it overflow or clip.
_FIT_SCALES = (1.0, 0.95, 0.9, 0.85)


def clean_pdf_text(text):
    if not text:
        return text

    for old, new in _GLYPH_REPLACEMENTS.items():
        text = text.replace(old, new)

    return text


def _font_for_flags(flags):
    bold = bool(flags & 2**4)
    italic = bool(flags & 2**1)

    if bold and italic:
        return FONT_BOLD_ITALIC
    if bold:
        return FONT_BOLD
    if italic:
        return FONT_ITALIC

    return FONT_REGULAR


def _color_int_to_rgb(color_int):
    r = ((color_int >> 16) & 255) / 255
    g = ((color_int >> 8) & 255) / 255
    b = (color_int & 255) / 255
    return (r, g, b)


def _is_locked(text):
    """
    Contact-info-like lines (email/phone/URL) are hard-excluded from the
    editable set in code, as a guarantee on top of the prompt's own
    truthfulness rules — these are unambiguous factual data that should
    never be rewritten.
    """
    return bool(
        _EMAIL_PATTERN.search(text)
        or _URL_PATTERN.search(text)
        or _PHONE_PATTERN.search(text)
    )


def extract_editable_lines(pdf_path):
    """
    Flattens every text line in the PDF (in reading order) into records
    carrying exactly what's needed to put replacement text back in the
    same place, in the same font/size/color: {index, page_num, bbox,
    text, fontname, size, color, locked}.
    """
    document = pymupdf.open(pdf_path)
    lines = []
    index = 0

    try:
        for page_num in range(len(document)):
            page_dict = document[page_num].get_text("dict")

            for block in page_dict.get("blocks", []):
                if block.get("type") != 0:
                    continue

                for line in block.get("lines", []):
                    spans = line.get("spans", [])
                    text = "".join(span.get("text", "") for span in spans).strip()

                    if not text:
                        continue

                    first_span = spans[0]

                    lines.append({
                        "index": index,
                        "page_num": page_num,
                        "bbox": tuple(line.get("bbox")),
                        "text": text,
                        "fontname": _font_for_flags(first_span.get("flags", 0)),
                        "size": first_span.get("size", 9),
                        "color": _color_int_to_rgb(first_span.get("color", 0)),
                        "locked": _is_locked(text),
                    })
                    index += 1
    finally:
        document.close()

    return lines


def apply_line_edits(original_pdf_path, lines, edits):
    """
    Opens a FRESH copy of the original PDF (never mutates a previous
    attempt's output) and applies only the given {line_index, new_text}
    edits, each via redaction (white-out + reinsert) at the original
    line's exact bbox/font/size/color. A replacement that doesn't fit the
    original line's width — even after shrinking the font down through
    _FIT_SCALES — is skipped entirely rather than allowed to overflow or
    clip into neighboring text.

    Returns (pdf_bytes, applied_count).
    """
    lines_by_index = {line["index"]: line for line in lines}
    document = pymupdf.open(original_pdf_path)
    applied_count = 0

    try:
        pages_touched = set()

        for edit in edits:
            line = lines_by_index.get(edit.get("line_index"))

            if line is None or line["locked"]:
                continue

            new_text = clean_pdf_text((edit.get("new_text") or "").strip())

            if not new_text or new_text == line["text"]:
                continue

            bbox = pymupdf.Rect(line["bbox"])
            fontname = line["fontname"]
            base_size = line["size"]

            fitted_size = None

            for scale in _FIT_SCALES:
                candidate_size = base_size * scale
                width = pymupdf.get_text_length(
                    new_text, fontname=fontname, fontsize=candidate_size
                )

                if width <= bbox.width:
                    fitted_size = candidate_size
                    break

            if fitted_size is None:
                # Doesn't fit even shrunk — skip rather than overflow/clip.
                continue

            page = document[line["page_num"]]
            page.add_redact_annot(
                bbox,
                text=new_text,
                fontname=fontname,
                fontsize=fitted_size,
                text_color=line["color"],
                fill=(1, 1, 1),
                align=0,
                cross_out=False,
            )
            pages_touched.add(line["page_num"])
            applied_count += 1

        for page_num in pages_touched:
            document[page_num].apply_redactions()

        pdf_bytes = document.tobytes(garbage=4, deflate=True)
    finally:
        document.close()

    return pdf_bytes, applied_count
