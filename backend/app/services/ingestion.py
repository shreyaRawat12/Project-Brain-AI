import io
import re
import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.services import db
from app.services.retrieve import embed_text

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}

def sanitize_filename(filename: str) -> str:
    """Strips path traversal elements and unsafe characters."""
    name = Path(filename).name
    # Remove control characters and weird symbols
    clean = re.sub(r'[^\w\s\.-]', '_', name).strip()
    return clean or f"doc_{uuid.uuid4().hex[:8]}"

def extract_text_from_file(filename: str, content: bytes) -> List[Tuple[str, Optional[int], Optional[str]]]:
    """
    Extracts text segments from file content.
    Returns list of (text_segment, page_number_or_none, section_heading_or_none).
    """
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file format '{ext}'. Supported formats: PDF, DOCX, TXT, MD.")
    
    if len(content) == 0:
        raise ValueError("Uploaded document is empty (0 bytes).")
    
    segments: List[Tuple[str, Optional[int], Optional[str]]] = []

    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            if len(reader.pages) == 0:
                raise ValueError("PDF file contains no pages.")
            for idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                page_text = page_text.strip()
                if page_text:
                    segments.append((page_text, idx, f"Page {idx}"))
            if not segments:
                raise ValueError("No extractable text found in PDF (it may contain only scanned images or be encrypted).")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Failed to read PDF document: {e}")

    elif ext == ".docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            current_heading = "General"
            for p in doc.paragraphs:
                text = p.text.strip()
                if not text:
                    continue
                if p.style and p.style.name and p.style.name.startswith("Heading"):
                    current_heading = text
                segments.append((text, None, current_heading))
            # Also extract tables
            for t_idx, table in enumerate(doc.tables, start=1):
                table_lines = []
                for row in table.rows:
                    cells = [c.text.strip() for c in row.cells if c.text.strip()]
                    if cells:
                        table_lines.append(" | ".join(cells))
                if table_lines:
                    segments.append(("\n".join(table_lines), None, f"Table {t_idx}"))
            if not segments:
                raise ValueError("No extractable text found in DOCX file.")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Failed to read DOCX document: {e}")

    elif ext in {".txt", ".md"}:
        try:
            # Try utf-8 first, fallback to latin-1
            try:
                raw_text = content.decode("utf-8")
            except UnicodeDecodeError:
                raw_text = content.decode("latin-1")
            
            raw_text = raw_text.strip()
            if not raw_text:
                raise ValueError("Text/Markdown file contains no readable text.")
            
            # For markdown, split by markdown headings if present
            if ext == ".md":
                lines = raw_text.splitlines()
                cur_section = "Overview"
                cur_buf = []
                for line in lines:
                    if line.startswith("#"):
                        if cur_buf:
                            segments.append(("\n".join(cur_buf).strip(), None, cur_section))
                            cur_buf = []
                        cur_section = line.lstrip("#").strip()
                    else:
                        cur_buf.append(line)
                if cur_buf:
                    segments.append(("\n".join(cur_buf).strip(), None, cur_section))
            else:
                segments.append((raw_text, None, "Document Body"))
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Failed to read text document: {e}")

    return segments

def chunk_text(
    segments: List[Tuple[str, Optional[int], Optional[str]]],
    chunk_size: int = 700,
    overlap: int = 120
) -> List[Dict[str, Any]]:
    """
    Splits document segments into overlapping chunks, preserving metadata.
    """
    chunks = []
    chunk_idx = 0

    for seg_text, page_num, section in segments:
        if not seg_text.strip():
            continue
        
        # If segment fits within chunk_size, keep it intact
        if len(seg_text) <= chunk_size:
            chunks.append({
                "chunk_index": chunk_idx,
                "text": seg_text,
                "page": page_num,
                "section": section
            })
            chunk_idx += 1
            continue

        # Split long text by paragraphs or sentences
        paragraphs = seg_text.split("\n\n")
        current_chunk = []
        current_len = 0

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            
            if current_len + len(p) <= chunk_size:
                current_chunk.append(p)
                current_len += len(p) + 2
            else:
                if current_chunk:
                    chunk_str = "\n\n".join(current_chunk)
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "text": chunk_str,
                        "page": page_num,
                        "section": section
                    })
                    chunk_idx += 1
                    # Keep overlap from the end of current chunk
                    overlap_chars = chunk_str[-overlap:] if len(chunk_str) > overlap else ""
                    current_chunk = [overlap_chars, p] if overlap_chars else [p]
                    current_len = len(overlap_chars) + len(p) + 2
                else:
                    # Single paragraph exceeds chunk_size, split by character
                    for i in range(0, len(p), chunk_size - overlap):
                        sub_text = p[i:i + chunk_size]
                        chunks.append({
                            "chunk_index": chunk_idx,
                            "text": sub_text,
                            "page": page_num,
                            "section": section
                        })
                        chunk_idx += 1
                    current_chunk = []
                    current_len = 0

        if current_chunk:
            chunk_str = "\n\n".join(current_chunk).strip()
            if chunk_str:
                chunks.append({
                    "chunk_index": chunk_idx,
                    "text": chunk_str,
                    "page": page_num,
                    "section": section
                })
                chunk_idx += 1

    return chunks

def process_document(
    filename: str,
    content: bytes,
    project_id: Optional[str] = None,
    document_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    End-to-end ingestion pipeline:
    Validate -> Extract -> Clean -> Chunk -> Embed -> Store in DB -> Update Status.
    """
    clean_name = sanitize_filename(filename)
    doc_id = document_id or f"doc_{uuid.uuid4().hex[:12]}"
    ext = Path(clean_name).suffix.lower()
    file_size = len(content)

    # Initial record: uploading
    db.save_document_record({
        "id": doc_id,
        "project_id": project_id,
        "filename": clean_name,
        "file_type": ext.lstrip("."),
        "file_size": file_size,
        "status": "uploading",
        "chunk_count": 0,
        "error_message": None
    })

    try:
        # Step 1: Extract Text
        db.update_document_status(doc_id, "extracting")
        segments = extract_text_from_file(clean_name, content)

        # Step 2: Chunking
        raw_chunks = chunk_text(segments)
        if not raw_chunks:
            raise ValueError("No meaningful content chunks could be generated from document.")

        # Step 3: Embeddings & Storage
        db.update_document_status(doc_id, "indexing", chunk_count=len(raw_chunks))
        
        stored_chunks = []
        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        for c in raw_chunks:
            c_idx = c["chunk_index"]
            c_id = f"{doc_id}_c{c_idx}"
            text = c["text"]
            
            # Enrich chunk text with metadata prefix so section & doc context are indexed
            prefix_parts = [f"[{clean_name}]"]
            if c.get("section"):
                prefix_parts.append(f"({c['section']})")
            if c.get("page"):
                prefix_parts.append(f"(Page {c['page']})")
            
            embed_input = " ".join(prefix_parts) + "\n" + text
            vector = embed_text(embed_input)

            stored_chunks.append({
                "id": c_id,
                "project_id": project_id,
                "document_id": doc_id,
                "type": "document",
                "text": text,
                "source_url": clean_name,
                "author": "Document Upload",
                "date": today_str,
                "linked_ids": [doc_id],
                "files": [clean_name],
                "embedding": vector
            })

        # Save to database
        db.save_chunks_batch(stored_chunks)

        # Step 4: Mark Ready
        db.update_document_status(doc_id, "ready", chunk_count=len(stored_chunks))
        logger.info(f"Successfully processed document '{clean_name}' into {len(stored_chunks)} chunks.")

        return {
            "document_id": doc_id,
            "filename": clean_name,
            "status": "ready",
            "chunk_count": len(stored_chunks),
            "project_id": project_id
        }

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error processing document {clean_name}: {err_msg}")
        db.update_document_status(doc_id, "failed", error_message=err_msg)
        raise
