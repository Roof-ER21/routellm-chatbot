#!/usr/bin/env python3
"""
Embedding Generation Script for RAG System
Reads extracted chunks and generates embeddings using OpenAI API.
"""

import os
import json
import logging
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import argparse

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai library not installed. Install with: pip install openai")
    exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('embedding_generation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """Generates embeddings for text chunks using OpenAI API"""

    def __init__(self, api_key: str, model: str = "text-embedding-3-small", batch_size: int = 100):
        """
        Initialize the embedding generator

        Args:
            api_key: OpenAI API key
            model: Embedding model to use
            batch_size: Number of chunks to process in each batch
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.batch_size = batch_size
        self.total_tokens_used = 0
        logger.info(f"Initialized EmbeddingGenerator (model={model}, batch_size={batch_size})")

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding for a single text

        Args:
            text: Text to embed

        Returns:
            Embedding vector or None on error
        """
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.model
            )

            # Track token usage
            self.total_tokens_used += response.usage.total_tokens

            return response.data[0].embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

    def generate_embeddings_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Generate embeddings for a batch of texts

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors (None for failed embeddings)
        """
        if not texts:
            return []

        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.model
            )

            # Track token usage
            self.total_tokens_used += response.usage.total_tokens

            # Extract embeddings in order
            embeddings = [data.embedding for data in response.data]

            logger.info(f"Generated {len(embeddings)} embeddings (tokens used: {response.usage.total_tokens})")

            return embeddings

        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            # Fall back to individual generation
            logger.info("Falling back to individual embedding generation...")
            return [self.generate_embedding(text) for text in texts]

    def process_chunks(self, chunks: List[Dict[str, Any]],
                      show_progress: bool = True,
                      rate_limit_delay: float = 0.1) -> List[Dict[str, Any]]:
        """
        Process all chunks and add embeddings

        Args:
            chunks: List of chunk dictionaries
            show_progress: Whether to show progress information
            rate_limit_delay: Delay between batches (seconds)

        Returns:
            List of chunks with embeddings added
        """
        logger.info(f"Processing {len(chunks)} chunks...")

        embedded_chunks = []
        failed_chunks = []

        # Process in batches
        for i in range(0, len(chunks), self.batch_size):
            batch_chunks = chunks[i:i + self.batch_size]
            batch_texts = [chunk['text'] for chunk in batch_chunks]

            if show_progress:
                progress = (i / len(chunks)) * 100
                logger.info(f"Progress: {progress:.1f}% ({i}/{len(chunks)} chunks)")

            # Generate embeddings for batch
            embeddings = self.generate_embeddings_batch(batch_texts)

            # Add embeddings to chunks
            for chunk, embedding in zip(batch_chunks, embeddings):
                if embedding is not None:
                    chunk_with_embedding = chunk.copy()
                    chunk_with_embedding['embedding'] = embedding
                    embedded_chunks.append(chunk_with_embedding)
                else:
                    failed_chunks.append(chunk['id'])
                    logger.warning(f"Failed to generate embedding for chunk: {chunk['id']}")

            # Rate limiting delay
            if i + self.batch_size < len(chunks):
                time.sleep(rate_limit_delay)

        logger.info(f"Successfully embedded {len(embedded_chunks)}/{len(chunks)} chunks")

        if failed_chunks:
            logger.warning(f"Failed chunks: {len(failed_chunks)}")
            logger.warning(f"Failed IDs: {failed_chunks[:10]}...")  # Show first 10

        return embedded_chunks


def load_chunks(input_path: str) -> Dict[str, Any]:
    """
    Load chunks from JSON file

    Args:
        input_path: Path to input JSON file

    Returns:
        Dictionary containing chunks and metadata
    """
    logger.info(f"Loading chunks from: {input_path}")

    if not os.path.exists(input_path):
        logger.error(f"Input file not found: {input_path}")
        raise FileNotFoundError(f"Input file not found: {input_path}")

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    logger.info(f"Loaded {len(data.get('chunks', []))} chunks")
    return data


def save_embeddings(output_path: str, chunks: List[Dict[str, Any]], metadata: Dict[str, Any]):
    """
    Save chunks with embeddings to JSON file

    Args:
        output_path: Path to output JSON file
        chunks: List of chunks with embeddings
        metadata: Metadata dictionary
    """
    logger.info(f"Saving embeddings to: {output_path}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    output_data = {
        "metadata": metadata,
        "chunks": chunks
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    # Get file size
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    logger.info(f"Saved {len(chunks)} chunks with embeddings ({file_size_mb:.2f} MB)")


def calculate_cost(total_tokens: int, model: str = "text-embedding-3-small") -> float:
    """
    Calculate approximate cost based on token usage

    Args:
        total_tokens: Total tokens used
        model: Model name

    Returns:
        Estimated cost in USD
    """
    # Pricing as of 2025 (tokens per dollar)
    pricing = {
        "text-embedding-3-small": 0.00002,  # $0.02 per 1M tokens
        "text-embedding-3-large": 0.00013,  # $0.13 per 1M tokens
        "text-embedding-ada-002": 0.0001,   # $0.10 per 1M tokens
    }

    cost_per_token = pricing.get(model, 0.0001)
    return total_tokens * cost_per_token


def main():
    """Main execution function"""

    parser = argparse.ArgumentParser(description='Generate embeddings for document chunks')
    parser.add_argument('--input', type=str,
                       default='/Users/a21/Desktop/routellm-chatbot-railway/data/extracted_chunks.json',
                       help='Input JSON file with extracted chunks')
    parser.add_argument('--output', type=str,
                       default='/Users/a21/Desktop/routellm-chatbot-railway/data/embeddings.json',
                       help='Output JSON file for embeddings')
    parser.add_argument('--api-key', type=str,
                       help='OpenAI API key (can also use OPENAI_API_KEY env var)')
    parser.add_argument('--model', type=str, default='text-embedding-3-small',
                       help='OpenAI embedding model to use')
    parser.add_argument('--batch-size', type=int, default=100,
                       help='Batch size for API requests')
    parser.add_argument('--rate-limit-delay', type=float, default=0.1,
                       help='Delay between batches (seconds)')

    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.environ.get('OPENAI_API_KEY')

    if not api_key:
        logger.error("OpenAI API key not provided. Use --api-key or set OPENAI_API_KEY environment variable")
        return

    logger.info("=" * 80)
    logger.info("Starting Embedding Generation Pipeline")
    logger.info("=" * 80)

    try:
        # Load chunks
        data = load_chunks(args.input)
        chunks = data.get('chunks', [])

        if not chunks:
            logger.error("No chunks found in input file")
            return

        # Initialize generator
        generator = EmbeddingGenerator(
            api_key=api_key,
            model=args.model,
            batch_size=args.batch_size
        )

        # Generate embeddings
        start_time = time.time()
        embedded_chunks = generator.process_chunks(
            chunks,
            show_progress=True,
            rate_limit_delay=args.rate_limit_delay
        )
        end_time = time.time()

        # Update metadata
        metadata = data.get('metadata', {})
        metadata.update({
            'total_chunks_with_embeddings': len(embedded_chunks),
            'embedding_model': args.model,
            'total_tokens_used': generator.total_tokens_used,
            'processing_time_seconds': round(end_time - start_time, 2),
            'embedding_dimension': len(embedded_chunks[0]['embedding']) if embedded_chunks else 0
        })

        # Calculate cost
        estimated_cost = calculate_cost(generator.total_tokens_used, args.model)
        metadata['estimated_cost_usd'] = round(estimated_cost, 4)

        # Save embeddings
        save_embeddings(args.output, embedded_chunks, metadata)

        # Print summary
        logger.info("=" * 80)
        logger.info("Embedding Generation Complete!")
        logger.info("=" * 80)
        logger.info(f"Total chunks processed: {len(embedded_chunks)}/{len(chunks)}")
        logger.info(f"Embedding model: {args.model}")
        logger.info(f"Embedding dimension: {metadata['embedding_dimension']}")
        logger.info(f"Total tokens used: {generator.total_tokens_used:,}")
        logger.info(f"Estimated cost: ${estimated_cost:.4f}")
        logger.info(f"Processing time: {metadata['processing_time_seconds']:.2f} seconds")
        logger.info(f"Output saved to: {args.output}")
        logger.info("=" * 80)

        # Print sample
        if embedded_chunks:
            logger.info("\nSample embedded chunk:")
            sample = embedded_chunks[0]
            logger.info(f"  ID: {sample['id']}")
            logger.info(f"  Text preview: {sample['text'][:100]}...")
            logger.info(f"  Embedding dimension: {len(sample['embedding'])}")
            logger.info(f"  Document type: {sample['metadata']['doc_type']}")
            logger.info(f"  Source: {sample['metadata']['filename']}")

    except Exception as e:
        logger.error(f"Error in embedding generation pipeline: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
