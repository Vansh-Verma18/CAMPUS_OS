import re
from typing import List, Dict, Any

class DocumentChunk:
    def __init__(self, text: str, metadata: Dict[str, Any]):
        self.text = text
        self.metadata = metadata

def chunk_text(
    text: str, 
    document_metadata: Dict[str, Any], 
    max_chunk_size: int = 1000, 
    overlap_size: int = 200
) -> List[DocumentChunk]:
    """
    Deterministically chunks text into pieces of roughly max_chunk_size characters,
    with an overlap_size to preserve context across boundaries.
    
    Tries to split on paragraphs or sentences where possible.
    """
    # Simple recursive character splitting logic
    chunks = []
    
    # 1. Split by double newline (paragraphs)
    paragraphs = re.split(r'\n\s*\n', text)
    
    current_chunk_text = ""
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        # If adding this paragraph exceeds max size and we already have content
        if len(current_chunk_text) + len(para) > max_chunk_size and current_chunk_text:
            chunks.append(DocumentChunk(current_chunk_text.strip(), document_metadata.copy()))
            
            # Start new chunk with overlap from the end of the previous chunk
            # Extract roughly overlap_size characters from the end, snapping to word boundary
            overlap_text = current_chunk_text[-overlap_size:] if overlap_size > 0 else ""
            if overlap_text:
                # Find the first space to avoid cutting words in half
                first_space = overlap_text.find(' ')
                if first_space != -1:
                    overlap_text = overlap_text[first_space+1:]
            
            current_chunk_text = overlap_text + (" " if overlap_text else "") + para
        else:
            current_chunk_text += ("\n\n" if current_chunk_text else "") + para
            
        # If a single paragraph is longer than max_chunk_size, we need to split it by sentences
        while len(current_chunk_text) > max_chunk_size:
            # Force split
            split_point = current_chunk_text.rfind('. ', 0, max_chunk_size)
            if split_point == -1:
                split_point = current_chunk_text.rfind(' ', 0, max_chunk_size)
            if split_point == -1:
                split_point = max_chunk_size
                
            chunks.append(DocumentChunk(current_chunk_text[:split_point+1].strip(), document_metadata.copy()))
            
            # Start next chunk with overlap
            overlap_text = current_chunk_text[split_point+1-overlap_size:split_point+1] if split_point+1 > overlap_size else ""
            if overlap_text:
                first_space = overlap_text.find(' ')
                if first_space != -1:
                    overlap_text = overlap_text[first_space+1:]
                    
            current_chunk_text = overlap_text + (" " if overlap_text else "") + current_chunk_text[split_point+1:].strip()
            
    if current_chunk_text:
        chunks.append(DocumentChunk(current_chunk_text.strip(), document_metadata.copy()))
        
    # Final pass to attach chunk index for ordered retrieval
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        
    return chunks
