import logging

import pdfplumber

logger = logging.getLogger(__name__)


class ResumeParsingError(Exception):
    """Raised when an uploaded PDF can't be opened or read."""


def extract_text_from_pdf(file_path):
    text = ""

    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as error:
        # Covers encrypted/password-protected PDFs and corrupted or
        # non-PDF uploads, which pdfplumber/pdfminer raise as a generic
        # PdfminerException with no further handling upstream. Never log
        # the file path or resume content here, only the error itself.
        logger.exception(
            "Failed to extract text from uploaded PDF (%s)",
            type(error).__name__,
        )
        raise ResumeParsingError(
            "Could not read this PDF. It may be corrupted, password-protected, "
            "or in an unsupported format."
        ) from error

    return text.strip()