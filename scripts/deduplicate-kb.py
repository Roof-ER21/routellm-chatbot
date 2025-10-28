#!/usr/bin/env python3
"""
Knowledge Base Deduplication Script

This script analyzes and deduplicates documents from:
1. lib/insurance-argumentation-kb.ts (hardcoded documents)
2. public/kb-documents.json (extracted documents)
3. data/susan_ai_embeddings.json (embeddings with chunks)

Identifies duplicates based on:
- Exact ID matches
- Exact title matches
- Similar content (>90% similarity using TF-IDF)
- Same filename

Outputs:
- Deduplicated dataset
- Detailed report of removed duplicates
"""

import json
import re
import os
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

# Configuration
SIMILARITY_THRESHOLD = 0.90  # 90% similarity for content deduplication
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent


class KnowledgeBaseDeduplicator:
    """Handles deduplication of knowledge base documents"""

    def __init__(self):
        self.kb_ts_docs = []
        self.kb_json_docs = []
        self.embedding_docs = []
        self.all_docs = []
        self.duplicate_groups = []

    def load_data_sources(self):
        """Load all data sources"""
        print("Loading data sources...")

        # 1. Load kb-documents.json
        kb_json_path = PROJECT_ROOT / "public" / "kb-documents.json"
        if kb_json_path.exists():
            with open(kb_json_path, 'r', encoding='utf-8') as f:
                self.kb_json_docs = json.load(f)
            print(f"  ✓ Loaded {len(self.kb_json_docs)} documents from kb-documents.json")
        else:
            print(f"  ⚠ kb-documents.json not found")

        # 2. Parse hardcoded documents from TypeScript file
        kb_ts_path = PROJECT_ROOT / "lib" / "insurance-argumentation-kb.ts"
        if kb_ts_path.exists():
            self.kb_ts_docs = self._parse_typescript_kb(kb_ts_path)
            print(f"  ✓ Parsed {len(self.kb_ts_docs)} hardcoded documents from TypeScript")
        else:
            print(f"  ⚠ insurance-argumentation-kb.ts not found")

        # 3. Extract unique documents from embeddings
        embeddings_path = PROJECT_ROOT / "data" / "susan_ai_embeddings.json"
        if embeddings_path.exists():
            self.embedding_docs = self._extract_docs_from_embeddings(embeddings_path)
            print(f"  ✓ Extracted {len(self.embedding_docs)} unique documents from embeddings")
        else:
            print(f"  ⚠ susan_ai_embeddings.json not found")

        # Combine all sources
        self.all_docs = []
        for doc in self.kb_ts_docs:
            doc['source'] = 'typescript_kb'
            self.all_docs.append(doc)
        for doc in self.kb_json_docs:
            doc['source'] = 'kb_json'
            self.all_docs.append(doc)
        for doc in self.embedding_docs:
            doc['source'] = 'embeddings'
            self.all_docs.append(doc)

        print(f"\nTotal documents before deduplication: {len(self.all_docs)}")

    def _parse_typescript_kb(self, file_path: Path) -> List[Dict]:
        """Parse hardcoded documents from TypeScript file"""
        docs = []
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract documents from INSURANCE_KB_DOCUMENTS array
        # This is a simple extraction - looks for id, filename, category, title patterns
        doc_pattern = r'\{[\s\S]*?id:\s*[\'"]([^\'"]+)[\'"][\s\S]*?filename:\s*[\'"]([^\'"]+)[\'"][\s\S]*?category:\s*[\'"]([^\'"]+)[\'"][\s\S]*?title:\s*[\'"]([^\'"]+)[\'"][\s\S]*?summary:\s*[\'"]([^\'"]*)[\'"]'

        matches = re.finditer(doc_pattern, content)
        for match in matches:
            doc_id, filename, category, title, summary = match.groups()
            docs.append({
                'id': doc_id,
                'filename': filename,
                'category': category,
                'title': title,
                'summary': summary,
                'content': '',  # Would need more complex parsing
                'keywords': []
            })

        return docs

    def _extract_docs_from_embeddings(self, file_path: Path) -> List[Dict]:
        """Extract unique documents from embeddings chunks"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if 'chunks' not in data:
            return []

        # Group chunks by filename
        docs_by_filename = defaultdict(lambda: {'chunks': [], 'metadata': {}})

        for chunk in data['chunks']:
            if 'metadata' in chunk and 'filename' in chunk['metadata']:
                filename = chunk['metadata']['filename']
                docs_by_filename[filename]['chunks'].append(chunk['text'])
                docs_by_filename[filename]['metadata'] = chunk['metadata']

        # Create document objects
        docs = []
        for filename, data in docs_by_filename.items():
            # Combine all chunks for this document
            full_text = ' '.join(data['chunks'])

            # Generate ID from filename
            doc_id = self._generate_id_from_filename(filename)

            # Extract title from first chunk or filename
            title = self._extract_title_from_text(data['chunks'][0] if data['chunks'] else filename)

            docs.append({
                'id': doc_id,
                'filename': filename,
                'category': 'reference',  # Default category
                'title': title,
                'summary': full_text[:200] + '...' if len(full_text) > 200 else full_text,
                'content': full_text,
                'keywords': [],
                'metadata': data['metadata']
            })

        return docs

    def _generate_id_from_filename(self, filename: str) -> str:
        """Generate consistent ID from filename"""
        # Remove extension and convert to uppercase with underscores
        base = Path(filename).stem
        return re.sub(r'[^a-zA-Z0-9]+', '_', base).upper()

    def _extract_title_from_text(self, text: str) -> str:
        """Extract title from first line of text"""
        lines = text.strip().split('\n')
        first_line = lines[0].strip()
        # Remove common prefixes
        first_line = re.sub(r'^(##+|\*\*|__)', '', first_line).strip()
        return first_line[:100] if len(first_line) > 100 else first_line

    def find_duplicates(self):
        """Identify all duplicate documents"""
        print("\nAnalyzing for duplicates...")

        # Track duplicates by different criteria
        by_id = defaultdict(list)
        by_title = defaultdict(list)
        by_filename = defaultdict(list)

        for i, doc in enumerate(self.all_docs):
            by_id[doc['id']].append(i)
            by_title[doc['title'].lower().strip()].append(i)
            by_filename[doc['filename'].lower().strip()].append(i)

        # Find duplicate groups
        seen_indices = set()

        # 1. Exact ID matches
        for doc_id, indices in by_id.items():
            if len(indices) > 1 and indices[0] not in seen_indices:
                self.duplicate_groups.append({
                    'type': 'exact_id',
                    'key': doc_id,
                    'indices': indices,
                    'docs': [self.all_docs[i] for i in indices]
                })
                seen_indices.update(indices)

        # 2. Exact title matches (not already grouped)
        for title, indices in by_title.items():
            if len(indices) > 1 and indices[0] not in seen_indices:
                self.duplicate_groups.append({
                    'type': 'exact_title',
                    'key': title,
                    'indices': indices,
                    'docs': [self.all_docs[i] for i in indices]
                })
                seen_indices.update(indices)

        # 3. Exact filename matches (not already grouped)
        for filename, indices in by_filename.items():
            if len(indices) > 1 and indices[0] not in seen_indices:
                self.duplicate_groups.append({
                    'type': 'exact_filename',
                    'key': filename,
                    'indices': indices,
                    'docs': [self.all_docs[i] for i in indices]
                })
                seen_indices.update(indices)

        # 4. Similar content (expensive, so only check remaining docs)
        remaining_indices = [i for i in range(len(self.all_docs)) if i not in seen_indices]
        similar_groups = self._find_similar_content(remaining_indices)
        self.duplicate_groups.extend(similar_groups)

        print(f"  ✓ Found {len(self.duplicate_groups)} duplicate groups")

        # Count total duplicates
        total_duplicates = sum(len(g['indices']) - 1 for g in self.duplicate_groups)
        print(f"  ✓ Total duplicate documents: {total_duplicates}")

    def _find_similar_content(self, indices: List[int]) -> List[Dict]:
        """Find documents with similar content using sequence matching"""
        similar_groups = []
        seen = set()

        for i, idx1 in enumerate(indices):
            if idx1 in seen:
                continue

            doc1 = self.all_docs[idx1]
            group_indices = [idx1]

            for idx2 in indices[i+1:]:
                if idx2 in seen:
                    continue

                doc2 = self.all_docs[idx2]

                # Compare content similarity
                content1 = doc1.get('content', doc1.get('summary', ''))
                content2 = doc2.get('content', doc2.get('summary', ''))

                if len(content1) < 50 or len(content2) < 50:
                    continue

                similarity = self._calculate_similarity(content1, content2)

                if similarity >= SIMILARITY_THRESHOLD:
                    group_indices.append(idx2)
                    seen.add(idx2)

            if len(group_indices) > 1:
                similar_groups.append({
                    'type': 'similar_content',
                    'key': doc1['title'],
                    'indices': group_indices,
                    'docs': [self.all_docs[i] for i in group_indices]
                })
                seen.add(idx1)

        return similar_groups

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings"""
        # Simple sequence matching
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

    def deduplicate(self) -> List[Dict]:
        """Remove duplicates and return clean dataset"""
        print("\nDeduplicating...")

        # Keep track of indices to remove (keep first occurrence)
        indices_to_remove = set()

        for group in self.duplicate_groups:
            # Keep first document, remove rest
            for idx in group['indices'][1:]:
                indices_to_remove.add(idx)

        # Create deduplicated dataset
        deduplicated_docs = [
            doc for i, doc in enumerate(self.all_docs)
            if i not in indices_to_remove
        ]

        # Remove 'source' field from final output
        for doc in deduplicated_docs:
            doc.pop('source', None)

        print(f"  ✓ Removed {len(indices_to_remove)} duplicate documents")
        print(f"  ✓ Final document count: {len(deduplicated_docs)}")

        return deduplicated_docs

    def generate_report(self) -> str:
        """Generate detailed deduplication report"""
        report = []
        report.append("=" * 80)
        report.append("KNOWLEDGE BASE DEDUPLICATION REPORT")
        report.append("=" * 80)
        report.append("")

        # Summary
        report.append("SUMMARY")
        report.append("-" * 80)
        report.append(f"Total documents before deduplication: {len(self.all_docs)}")
        report.append(f"  - From TypeScript KB: {len(self.kb_ts_docs)}")
        report.append(f"  - From kb-documents.json: {len(self.kb_json_docs)}")
        report.append(f"  - From embeddings: {len(self.embedding_docs)}")
        report.append("")

        total_duplicates = sum(len(g['indices']) - 1 for g in self.duplicate_groups)
        report.append(f"Total duplicate groups found: {len(self.duplicate_groups)}")
        report.append(f"Total duplicate documents: {total_duplicates}")
        report.append(f"Final document count: {len(self.all_docs) - total_duplicates}")
        report.append("")

        # Duplicate groups by type
        report.append("DUPLICATES BY TYPE")
        report.append("-" * 80)
        by_type = defaultdict(int)
        for group in self.duplicate_groups:
            by_type[group['type']] += len(group['indices']) - 1

        for dup_type, count in sorted(by_type.items()):
            report.append(f"  {dup_type.replace('_', ' ').title()}: {count} duplicates")
        report.append("")

        # Detailed duplicate groups
        report.append("DETAILED DUPLICATE GROUPS")
        report.append("-" * 80)

        for i, group in enumerate(self.duplicate_groups, 1):
            report.append(f"\n{i}. {group['type'].upper()}: {group['key']}")
            report.append(f"   Found {len(group['indices'])} occurrences:")

            for j, doc in enumerate(group['docs']):
                status = "KEPT" if j == 0 else "REMOVED"
                report.append(f"   [{status}] ID: {doc['id']}")
                report.append(f"          Source: {doc.get('source', 'unknown')}")
                report.append(f"          Title: {doc['title'][:60]}...")
                report.append(f"          Filename: {doc['filename']}")

        report.append("")
        report.append("=" * 80)
        report.append("END OF REPORT")
        report.append("=" * 80)

        return "\n".join(report)

    def save_results(self, deduplicated_docs: List[Dict], report: str):
        """Save deduplicated dataset and report"""
        # Save deduplicated documents
        output_path = PROJECT_ROOT / "public" / "kb-documents-deduplicated.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(deduplicated_docs, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Saved deduplicated documents to: {output_path}")

        # Save report
        report_path = PROJECT_ROOT / "scripts" / "deduplication-report.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"✓ Saved deduplication report to: {report_path}")

        # Save summary JSON
        summary = {
            'total_before': len(self.all_docs),
            'total_after': len(deduplicated_docs),
            'duplicates_removed': len(self.all_docs) - len(deduplicated_docs),
            'duplicate_groups': len(self.duplicate_groups),
            'sources': {
                'typescript_kb': len(self.kb_ts_docs),
                'kb_json': len(self.kb_json_docs),
                'embeddings': len(self.embedding_docs)
            },
            'duplicates_by_type': {}
        }

        for group in self.duplicate_groups:
            dup_type = group['type']
            summary['duplicates_by_type'][dup_type] = \
                summary['duplicates_by_type'].get(dup_type, 0) + (len(group['indices']) - 1)

        summary_path = PROJECT_ROOT / "scripts" / "deduplication-summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)
        print(f"✓ Saved summary to: {summary_path}")


def main():
    """Main execution function"""
    print("\n" + "=" * 80)
    print("KNOWLEDGE BASE DEDUPLICATION SCRIPT")
    print("=" * 80 + "\n")

    deduplicator = KnowledgeBaseDeduplicator()

    # Step 1: Load all data sources
    deduplicator.load_data_sources()

    # Step 2: Find duplicates
    deduplicator.find_duplicates()

    # Step 3: Deduplicate
    deduplicated_docs = deduplicator.deduplicate()

    # Step 4: Generate report
    report = deduplicator.generate_report()

    # Step 5: Save results
    deduplicator.save_results(deduplicated_docs, report)

    # Print summary
    print("\n" + "=" * 80)
    print("DEDUPLICATION COMPLETE")
    print("=" * 80)
    print(f"\nOriginal count: {len(deduplicator.all_docs)}")
    print(f"Final count: {len(deduplicated_docs)}")
    print(f"Duplicates removed: {len(deduplicator.all_docs) - len(deduplicated_docs)}")
    print("\nNext steps:")
    print("1. Review the deduplication report")
    print("2. Backup original kb-documents.json")
    print("3. Replace kb-documents.json with kb-documents-deduplicated.json")
    print("4. Update document counts in the application\n")


if __name__ == "__main__":
    main()
