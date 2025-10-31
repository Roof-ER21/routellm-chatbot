#!/usr/bin/env python3
"""
Cost Estimator for Batch Embedding Generation
Calculates expected costs before running the batch processor
"""

import os
import json
import argparse
from pathlib import Path

# Pricing (as of 2025)
PRICING = {
    "text-embedding-3-small": 0.00002 / 1000,  # $0.02 per 1M tokens → $0.00002 per 1K tokens
    "text-embedding-3-large": 0.00013 / 1000,  # $0.13 per 1M tokens
    "text-embedding-ada-002": 0.0001 / 1000,   # $0.10 per 1M tokens
}

def estimate_tokens(text: str) -> int:
    """Rough estimation: 1 token ≈ 0.75 words"""
    words = len(text.split())
    return int(words * 1.3)  # Conservative estimate

def analyze_documents(documents_dir: str) -> dict:
    """Analyze all documents and estimate costs"""

    total_docs = 0
    total_text_length = 0
    total_estimated_tokens = 0
    documents_analyzed = []

    for filename in os.listdir(documents_dir):
        if not filename.endswith('.json'):
            continue

        filepath = os.path.join(documents_dir, filename)

        try:
            with open(filepath, 'r') as f:
                doc_data = json.load(f)

            text = doc_data.get('extractedText') or doc_data.get('content') or ''

            if not text or len(text.strip()) < 50:
                print(f"⚠️  Skipping {filename} - no extractable text")
                continue

            text_length = len(text)
            estimated_tokens = estimate_tokens(text)

            total_docs += 1
            total_text_length += text_length
            total_estimated_tokens += estimated_tokens

            documents_analyzed.append({
                'filename': filename,
                'text_length': text_length,
                'estimated_tokens': estimated_tokens
            })

        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")

    return {
        'total_documents': total_docs,
        'total_text_length': total_text_length,
        'total_estimated_tokens': total_estimated_tokens,
        'documents': documents_analyzed
    }

def calculate_costs(total_tokens: int, chunk_size: int = 500, chunk_overlap: int = 50) -> dict:
    """Calculate costs for different models"""

    # Estimate chunks (with overlap, tokens increase by ~10-15%)
    overlap_multiplier = 1 + (chunk_overlap / chunk_size) * 0.5
    total_tokens_with_overlap = int(total_tokens * overlap_multiplier)

    costs = {}
    for model, cost_per_token in PRICING.items():
        cost = total_tokens_with_overlap * cost_per_token
        costs[model] = {
            'cost': cost,
            'tokens': total_tokens_with_overlap
        }

    return costs

def main():
    parser = argparse.ArgumentParser(description='Estimate embedding generation costs')
    parser.add_argument('--documents-dir', type=str,
                       default='/Users/a21/routellm-chatbot/data/processed-kb/documents-ready',
                       help='Directory containing processed documents')
    parser.add_argument('--chunk-size', type=int, default=500,
                       help='Tokens per chunk')
    parser.add_argument('--chunk-overlap', type=int, default=50,
                       help='Token overlap between chunks')
    parser.add_argument('--model', type=str, default='text-embedding-3-small',
                       choices=list(PRICING.keys()),
                       help='Embedding model to use')

    args = parser.parse_args()

    print("=" * 80)
    print("EMBEDDING COST ESTIMATOR")
    print("=" * 80)
    print()

    # Analyze documents
    print(f"Analyzing documents in: {args.documents_dir}")
    print()

    analysis = analyze_documents(args.documents_dir)

    if analysis['total_documents'] == 0:
        print("❌ No valid documents found!")
        print("   Check that documents have 'extractedText' or 'content' field")
        return

    print(f"📊 Documents analyzed: {analysis['total_documents']}")
    print(f"📝 Total text length: {analysis['total_text_length']:,} characters")
    print(f"🔢 Estimated tokens: {analysis['total_estimated_tokens']:,}")
    print()

    # Show document breakdown
    print("Top 10 largest documents:")
    print("-" * 80)
    sorted_docs = sorted(analysis['documents'], key=lambda x: x['estimated_tokens'], reverse=True)[:10]
    for i, doc in enumerate(sorted_docs, 1):
        print(f"{i:2}. {doc['filename'][:50]:50} | {doc['estimated_tokens']:6,} tokens")
    print()

    # Calculate costs
    print("💰 Cost Estimates:")
    print("-" * 80)

    costs = calculate_costs(
        analysis['total_estimated_tokens'],
        args.chunk_size,
        args.chunk_overlap
    )

    for model, data in costs.items():
        marker = "👉" if model == args.model else "  "
        print(f"{marker} {model:30} | {data['tokens']:8,} tokens | ${data['cost']:.4f}")

    print()
    print("=" * 80)
    print("BATCH PROCESSING ESTIMATE")
    print("=" * 80)
    print()

    # Batch estimates
    batch_sizes = [5, 10, 15, 20]
    selected_cost = costs[args.model]

    print(f"Using model: {args.model}")
    print(f"Total tokens (with overlap): {selected_cost['tokens']:,}")
    print(f"Total cost: ${selected_cost['cost']:.4f}")
    print()

    print("Batch size options:")
    print("-" * 80)
    print(f"{'Batch Size':12} | {'Batches':8} | {'Cost/Batch':12} | {'Time/Batch':12} | {'Total Time':12}")
    print("-" * 80)

    for batch_size in batch_sizes:
        num_batches = (analysis['total_documents'] + batch_size - 1) // batch_size
        cost_per_batch = selected_cost['cost'] / num_batches
        time_per_batch_min = batch_size * 0.3  # Rough estimate: 0.3 min per doc
        total_time_min = time_per_batch_min * num_batches

        marker = "👉" if batch_size == 15 else "  "
        print(f"{marker} {batch_size:2} docs/batch | {num_batches:2} | ${cost_per_batch:10.4f} | {time_per_batch_min:5.1f} min | {total_time_min:5.1f} min")

    print()
    print("💡 Recommendations:")
    print("  - Batch size 15: Best balance of speed and reliability")
    print("  - Use text-embedding-3-small for cost efficiency (1536 dimensions)")
    print("  - Start with a test batch of 5 documents before full run")
    print()

    # Commands
    print("🚀 Next Steps:")
    print("-" * 80)
    print("1. Test with 5 documents:")
    print("   python3 batch_embeddings_processor.py --batch-size 5 --reset-state")
    print()
    print("2. Run full processing:")
    print("   python3 batch_embeddings_processor.py --batch-size 15 --reset-state")
    print()
    print("3. Monitor progress:")
    print("   ./verify_batch_progress.sh")
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
