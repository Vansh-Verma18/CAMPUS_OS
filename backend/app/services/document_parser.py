import io
import fitz  # PyMuPDF
from docx import Document

class DocumentParserError(Exception):
    pass

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text() + "\n\n"
        return text.strip()
    except Exception as e:
        raise DocumentParserError(f"Failed to parse PDF: {e}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()])
        return text.strip()
    except Exception as e:
        raise DocumentParserError(f"Failed to parse DOCX: {e}")
