#!/usr/bin/env python3
"""
Bulletproof Batch Embedding Generation & Database Upload Script
================================================================

This script processes documents in configurable batches with:
- Resume capability (tracks progress in state file)
- Error handling and retry logic
- Database transaction per batch
- Progress tracking and cost estimation
- Comprehensive logging
- Rollback on failure

Author: Data Pipeline Engineer
Date: 2025-10-31
"""

import os
import json
import logging
import time
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import argparse
import traceback

try:
    from openai import OpenAI
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError as e:
    print(f"Error: Missing required library. {e}")
    print("Install with: pip install openai psycopg2-binary")
    exit(1)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Batch configuration
DEFAULT_BATCH_SIZE = 15  # Documents per batch (conservative for Railway)
DEFAULT_CHUNK_SIZE = 500  # Tokens per chunk
DEFAULT_CHUNK_OVERLAP = 50  # Token overlap between chunks
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_EMBEDDING_DIMENSION = 1536

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
RATE_LIMIT_DELAY = 0.5  # seconds between API calls

# State file for resume capability
STATE_FILE = "/Users/a21/routellm-chatbot/scripts/.batch_progress.json"

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/a21/routellm-chatbot/scripts/batch_embeddings.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class BatchState:
    """Track batch processing progress"""
    total_documents: int
    processed_documents: int
    failed_documents: List[str]
    current_batch: int
    total_batches: int
    total_chunks_processed: int
    total_tokens_used: int
    total_cost_usd: float
    last_updated: str
    completed_batches: List[int]

    def save(self, filepath: str):
        """Save state to file"""
        with open(filepath, 'w') as f:
            json.dump(asdict(self), f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> Optional['BatchState']:
        """Load state from file"""
        if not os.path.exists(filepath):
            return None
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            return cls(**data)
        except Exception as e:
            logger.error(f"Error loading state: {e}")
            return None

# =============================================================================
# DOCUMENT PROCESSOR
# =============================================================================

class DocumentChunker:
    """Chunk documents into manageable pieces"""

    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str, doc_id: str, metadata: Dict) -> List[Dict]:
        """
        Split text into overlapping chunks

        Args:
            text: Full document text
            doc_id: Document identifier
            metadata: Document metadata

        Returns:
            List of chunk dictionaries
        """
        # Simple word-based chunking (can be improved with tiktoken for token-accurate chunking)
        words = text.split()
        chunks = []

        # Calculate chunks with overlap
        i = 0
        chunk_index = 0

        while i < len(words):
            chunk_words = words[i:i + self.chunk_size]
            chunk_text = ' '.join(chunk_words)

            chunks.append({
                'id': f"{doc_id}_chunk_{chunk_index}",
                'document_id': doc_id,
                'text': chunk_text,
                'chunk_index': chunk_index,
                'metadata': metadata,
                'tokens': len(chunk_words)  # Approximate token count
            })

            chunk_index += 1
            i += (self.chunk_size - self.overlap)

        # Update total chunks for each chunk
        for chunk in chunks:
            chunk['total_chunks'] = len(chunks)

        return chunks

# =============================================================================
# EMBEDDING GENERATOR
# =============================================================================

class BatchEmbeddingGenerator:
    """Generate embeddings with retry logic and rate limiting"""

    def __init__(self, api_key: str, model: str = DEFAULT_EMBEDDING_MODEL):
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.total_tokens_used = 0

    def generate_embeddings_batch(self, texts: List[str], retry_count: int = 0) -> Optional[List[List[float]]]:
        """
        Generate embeddings for a batch of texts with retry logic

        Args:
            texts: List of text strings
            retry_count: Current retry attempt

        Returns:
            List of embedding vectors or None on failure
        """
        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.model
            )

            self.total_tokens_used += response.usage.total_tokens
            embeddings = [data.embedding for data in response.data]

            logger.info(f"Generated {len(embeddings)} embeddings (tokens: {response.usage.total_tokens})")
            return embeddings

        except Exception as e:
            logger.error(f"Error generating embeddings (attempt {retry_count + 1}/{MAX_RETRIES}): {e}")

            if retry_count < MAX_RETRIES:
                wait_time = RETRY_DELAY * (2 ** retry_count)  # Exponential backoff
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
                return self.generate_embeddings_batch(texts, retry_count + 1)
            else:
                logger.error(f"Failed after {MAX_RETRIES} attempts")
                return None

    def estimate_cost(self) -> float:
        """Calculate cost based on tokens used"""
        # text-embedding-3-small: $0.02 per 1M tokens
        cost_per_token = 0.00002 / 1000
        return self.total_tokens_used * cost_per_token

# =============================================================================
# DATABASE MANAGER
# =============================================================================

class DatabaseManager:
    """Manage PostgreSQL database operations with transaction support"""

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.conn = None
        self.cursor = None

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(self.connection_string)
            self.cursor = self.conn.cursor()
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("Database connection closed")

    def verify_schema(self) -> bool:
        """Verify that required tables exist"""
        try:
            self.cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'rag_documents'
                )
            """)
            docs_exists = self.cursor.fetchone()[0]

            self.cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'rag_chunks'
                )
            """)
            chunks_exists = self.cursor.fetchone()[0]

            if not (docs_exists and chunks_exists):
                logger.error("Required tables not found. Run schema.sql first.")
                return False

            logger.info("Database schema verified")
            return True

        except Exception as e:
            logger.error(f"Schema verification failed: {e}")
            return False

    def insert_document(self, doc_data: Dict) -> bool:
        """
        Insert or update document in rag_documents table

        Args:
            doc_data: Document data dictionary

        Returns:
            True if successful
        """
        try:
            # Calculate content hash
            content_hash = hashlib.sha256(doc_data['content'].encode()).hexdigest()

            self.cursor.execute("""
                INSERT INTO rag_documents (
                    id, filename, filepath, type, content, summary,
                    metadata, version, hash, created_at, updated_at
                ) VALUES (
                    %(id)s, %(filename)s, %(filepath)s, %(type)s, %(content)s, %(summary)s,
                    %(metadata)s, 1, %(hash)s, NOW(), NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    content = EXCLUDED.content,
                    summary = EXCLUDED.summary,
                    metadata = EXCLUDED.metadata,
                    hash = EXCLUDED.hash,
                    version = rag_documents.version + 1,
                    updated_at = NOW()
            """, {
                'id': doc_data['id'],
                'filename': doc_data['filename'],
                'filepath': doc_data['filepath'],
                'type': doc_data['type'],
                'content': doc_data['content'],
                'summary': doc_data.get('summary', ''),
                'metadata': json.dumps(doc_data.get('metadata', {})),
                'hash': content_hash
            })

            return True

        except Exception as e:
            logger.error(f"Error inserting document {doc_data['id']}: {e}")
            return False

    def insert_chunks_batch(self, chunks: List[Dict]) -> bool:
        """
        Insert chunks with embeddings in batch

        Args:
            chunks: List of chunk dictionaries with embeddings

        Returns:
            True if successful
        """
        try:
            # Prepare data for bulk insert
            values = [
                (
                    chunk['id'],
                    chunk['document_id'],
                    chunk['text'],
                    chunk['tokens'],
                    chunk['chunk_index'],
                    chunk['total_chunks'],
                    chunk.get('position_start'),
                    chunk.get('position_end'),
                    chunk['embedding'],
                    json.dumps(chunk['metadata'])
                )
                for chunk in chunks
            ]

            # Bulk insert with ON CONFLICT
            execute_values(
                self.cursor,
                """
                INSERT INTO rag_chunks (
                    id, document_id, text, tokens, chunk_index, total_chunks,
                    position_start, position_end, embedding, metadata
                ) VALUES %s
                ON CONFLICT (id) DO UPDATE SET
                    text = EXCLUDED.text,
                    embedding = EXCLUDED.embedding,
                    metadata = EXCLUDED.metadata
                """,
                values,
                template="(%s, %s, %s, %s, %s, %s, %s, %s, %s::vector, %s::jsonb)"
            )

            logger.info(f"Inserted {len(chunks)} chunks into database")
            return True

        except Exception as e:
            logger.error(f"Error inserting chunks: {e}")
            logger.error(traceback.format_exc())
            return False

    def commit(self):
        """Commit transaction"""
        self.conn.commit()
        logger.info("Transaction committed")

    def rollback(self):
        """Rollback transaction"""
        self.conn.rollback()
        logger.warning("Transaction rolled back")

# =============================================================================
# BATCH PROCESSOR
# =============================================================================

class BatchProcessor:
    """Main batch processing orchestrator"""

    def __init__(
        self,
        documents_dir: str,
        db_connection_string: str,
        openai_api_key: str,
        batch_size: int = DEFAULT_BATCH_SIZE,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
    ):
        self.documents_dir = documents_dir
        self.batch_size = batch_size

        # Initialize components
        self.chunker = DocumentChunker(chunk_size, chunk_overlap)
        self.embedder = BatchEmbeddingGenerator(openai_api_key)
        self.db = DatabaseManager(db_connection_string)

        # State tracking
        self.state = None

    def load_documents(self) -> List[Dict]:
        """Load all documents from directory"""
        documents = []

        for filename in os.listdir(self.documents_dir):
            if not filename.endswith('.json'):
                continue

            filepath = os.path.join(self.documents_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    doc_data = json.load(f)
                    documents.append(doc_data)
            except Exception as e:
                logger.error(f"Error loading {filename}: {e}")

        logger.info(f"Loaded {len(documents)} documents from {self.documents_dir}")
        return documents

    def process_batch(self, batch_docs: List[Dict], batch_num: int) -> Tuple[bool, int, int]:
        """
        Process a single batch of documents

        Args:
            batch_docs: List of document dictionaries
            batch_num: Batch number

        Returns:
            (success, chunks_processed, tokens_used)
        """
        logger.info(f"=" * 80)
        logger.info(f"Processing Batch {batch_num}")
        logger.info(f"Documents in batch: {len(batch_docs)}")
        logger.info(f"=" * 80)

        batch_chunks = []
        batch_tokens = 0

        try:
            # Step 1: Chunk all documents in batch
            for doc in batch_docs:
                # Extract text (assuming it's in a 'content' or 'extractedText' field)
                text = doc.get('extractedText') or doc.get('content') or ''

                if not text or len(text.strip()) < 50:
                    logger.warning(f"Skipping document {doc['id']} - insufficient text")
                    continue

                # Create chunks
                chunks = self.chunker.chunk_text(
                    text=text,
                    doc_id=doc['id'],
                    metadata={
                        'filename': doc['sourceFile'],
                        'category': doc.get('category', 'unknown'),
                        'doc_type': doc['type']
                    }
                )

                batch_chunks.extend(chunks)
                logger.info(f"Document {doc['id']}: {len(chunks)} chunks created")

            if not batch_chunks:
                logger.warning("No chunks created in this batch")
                return True, 0, 0

            # Step 2: Generate embeddings in sub-batches (OpenAI has limits)
            EMBEDDING_SUB_BATCH = 100  # OpenAI limit
            all_embeddings = []

            for i in range(0, len(batch_chunks), EMBEDDING_SUB_BATCH):
                sub_batch = batch_chunks[i:i + EMBEDDING_SUB_BATCH]
                texts = [chunk['text'] for chunk in sub_batch]

                logger.info(f"Generating embeddings for chunks {i} to {i + len(sub_batch)}")
                embeddings = self.embedder.generate_embeddings_batch(texts)

                if embeddings is None:
                    raise Exception(f"Failed to generate embeddings for chunk batch {i}")

                all_embeddings.extend(embeddings)
                time.sleep(RATE_LIMIT_DELAY)  # Rate limiting

            # Step 3: Add embeddings to chunks
            for chunk, embedding in zip(batch_chunks, all_embeddings):
                chunk['embedding'] = embedding

            # Step 4: Insert into database (transaction)
            logger.info("Inserting data into database...")

            # Insert documents
            for doc in batch_docs:
                doc_data = {
                    'id': doc['id'],
                    'filename': doc['sourceFile'],
                    'filepath': doc.get('sourcePath', ''),
                    'type': doc['type'],
                    'content': doc.get('extractedText') or doc.get('content') or '',
                    'summary': doc.get('summary', ''),
                    'metadata': {
                        'category': doc.get('category', 'unknown'),
                        'relative_path': doc.get('relativePath', '')
                    }
                }

                if not self.db.insert_document(doc_data):
                    raise Exception(f"Failed to insert document {doc['id']}")

            # Insert chunks
            if not self.db.insert_chunks_batch(batch_chunks):
                raise Exception("Failed to insert chunks")

            # Commit transaction
            self.db.commit()

            batch_tokens = self.embedder.total_tokens_used
            logger.info(f"Batch {batch_num} completed successfully")
            logger.info(f"Chunks processed: {len(batch_chunks)}")
            logger.info(f"Tokens used: {batch_tokens}")

            return True, len(batch_chunks), batch_tokens

        except Exception as e:
            logger.error(f"Error processing batch {batch_num}: {e}")
            logger.error(traceback.format_exc())
            self.db.rollback()
            return False, 0, 0

    def run(self, resume: bool = True):
        """
        Run the batch processing pipeline

        Args:
            resume: Whether to resume from previous state
        """
        logger.info("=" * 80)
        logger.info("STARTING BATCH EMBEDDING GENERATION PIPELINE")
        logger.info("=" * 80)

        # Load or initialize state
        if resume:
            self.state = BatchState.load(STATE_FILE)

        # Load documents
        all_documents = self.load_documents()
        total_docs = len(all_documents)
        total_batches = (total_docs + self.batch_size - 1) // self.batch_size

        if not self.state:
            self.state = BatchState(
                total_documents=total_docs,
                processed_documents=0,
                failed_documents=[],
                current_batch=0,
                total_batches=total_batches,
                total_chunks_processed=0,
                total_tokens_used=0,
                total_cost_usd=0.0,
                last_updated=datetime.now().isoformat(),
                completed_batches=[]
            )

        logger.info(f"Total documents: {total_docs}")
        logger.info(f"Batch size: {self.batch_size}")
        logger.info(f"Total batches: {total_batches}")

        if resume and self.state.processed_documents > 0:
            logger.info(f"Resuming from batch {self.state.current_batch + 1}")
            logger.info(f"Already processed: {self.state.processed_documents} documents")

        # Connect to database
        self.db.connect()

        if not self.db.verify_schema():
            logger.error("Database schema verification failed. Exiting.")
            return

        # Process batches
        for batch_num in range(self.state.current_batch, total_batches):
            start_idx = batch_num * self.batch_size
            end_idx = min(start_idx + self.batch_size, total_docs)
            batch_docs = all_documents[start_idx:end_idx]

            # Process batch
            success, chunks, tokens = self.process_batch(batch_docs, batch_num + 1)

            # Update state
            if success:
                self.state.current_batch = batch_num + 1
                self.state.processed_documents += len(batch_docs)
                self.state.total_chunks_processed += chunks
                self.state.total_tokens_used += tokens
                self.state.total_cost_usd = self.embedder.estimate_cost()
                self.state.completed_batches.append(batch_num + 1)
            else:
                self.state.failed_documents.extend([doc['id'] for doc in batch_docs])
                logger.error(f"Batch {batch_num + 1} failed. Stopping pipeline.")
                break

            # Save state after each batch
            self.state.last_updated = datetime.now().isoformat()
            self.state.save(STATE_FILE)

            # Log progress
            progress_pct = (self.state.processed_documents / total_docs) * 100
            logger.info(f"Progress: {progress_pct:.1f}% ({self.state.processed_documents}/{total_docs} documents)")
            logger.info(f"Total cost so far: ${self.state.total_cost_usd:.4f}")

        # Cleanup
        self.db.disconnect()

        # Final summary
        logger.info("=" * 80)
        logger.info("BATCH PROCESSING COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Documents processed: {self.state.processed_documents}/{total_docs}")
        logger.info(f"Total chunks: {self.state.total_chunks_processed}")
        logger.info(f"Total tokens: {self.state.total_tokens_used:,}")
        logger.info(f"Total cost: ${self.state.total_cost_usd:.4f}")
        logger.info(f"Failed documents: {len(self.state.failed_documents)}")

        if self.state.failed_documents:
            logger.warning(f"Failed document IDs: {self.state.failed_documents}")

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='Batch process documents and generate embeddings')
    parser.add_argument('--documents-dir', type=str,
                       default='/Users/a21/routellm-chatbot/data/processed-kb/documents-ready',
                       help='Directory containing processed documents')
    parser.add_argument('--db-url', type=str,
                       help='PostgreSQL connection string (or use DATABASE_URL env var)')
    parser.add_argument('--openai-key', type=str,
                       help='OpenAI API key (or use OPENAI_API_KEY env var)')
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE,
                       help='Number of documents per batch')
    parser.add_argument('--chunk-size', type=int, default=DEFAULT_CHUNK_SIZE,
                       help='Tokens per chunk')
    parser.add_argument('--chunk-overlap', type=int, default=DEFAULT_CHUNK_OVERLAP,
                       help='Token overlap between chunks')
    parser.add_argument('--no-resume', action='store_true',
                       help='Start fresh (ignore previous state)')
    parser.add_argument('--reset-state', action='store_true',
                       help='Reset state file and start over')

    args = parser.parse_args()

    # Get credentials
    db_url = args.db_url or os.environ.get('DATABASE_URL')
    openai_key = args.openai_key or os.environ.get('OPENAI_API_KEY')

    if not db_url:
        logger.error("Database URL not provided. Use --db-url or set DATABASE_URL env var")
        return

    if not openai_key:
        logger.error("OpenAI API key not provided. Use --openai-key or set OPENAI_API_KEY env var")
        return

    # Reset state if requested
    if args.reset_state and os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
        logger.info("State file reset")

    # Run processor
    processor = BatchProcessor(
        documents_dir=args.documents_dir,
        db_connection_string=db_url,
        openai_api_key=openai_key,
        batch_size=args.batch_size,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap
    )

    processor.run(resume=not args.no_resume)

if __name__ == "__main__":
    main()
