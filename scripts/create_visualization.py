#!/usr/bin/env python3
"""
Create visualization charts for deduplication analysis
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

# Load summary data
SCRIPT_DIR = Path(__file__).parent
summary_path = SCRIPT_DIR / "deduplication-summary.json"

with open(summary_path, 'r') as f:
    summary = json.load(f)

# Create figure with subplots
fig = plt.figure(figsize=(16, 10))
fig.suptitle('Knowledge Base Deduplication Analysis', fontsize=20, fontweight='bold')

# 1. Before/After Comparison (Bar Chart)
ax1 = plt.subplot(2, 3, 1)
categories = ['Before\nDeduplication', 'After\nDeduplication']
counts = [summary['total_before'], summary['total_after']]
colors = ['#ff6b6b', '#51cf66']
bars = ax1.bar(categories, counts, color=colors, alpha=0.8, edgecolor='black', linewidth=2)
ax1.set_ylabel('Document Count', fontsize=12, fontweight='bold')
ax1.set_title('Document Count Comparison', fontsize=14, fontweight='bold')
ax1.set_ylim(0, 300)
ax1.grid(axis='y', alpha=0.3)

# Add value labels on bars
for bar, count in zip(bars, counts):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height,
             f'{int(count)}',
             ha='center', va='bottom', fontsize=14, fontweight='bold')

# 2. Data Source Distribution (Stacked Bar)
ax2 = plt.subplot(2, 3, 2)
sources = summary['sources']
source_names = ['TypeScript\nKB', 'JSON\nKB', 'Embeddings']
source_values = [sources['typescript_kb'], sources['kb_json'], sources['embeddings']]
colors_sources = ['#845ef7', '#339af0', '#20c997']

bars = ax2.bar(source_names, source_values, color=colors_sources, alpha=0.8,
               edgecolor='black', linewidth=2)
ax2.set_ylabel('Document Count', fontsize=12, fontweight='bold')
ax2.set_title('Documents by Source', fontsize=14, fontweight='bold')
ax2.set_ylim(0, 140)
ax2.grid(axis='y', alpha=0.3)

# Add value labels
for bar, count in zip(bars, source_values):
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height,
             f'{int(count)}',
             ha='center', va='bottom', fontsize=12, fontweight='bold')

# 3. Duplicate Types (Pie Chart)
ax3 = plt.subplot(2, 3, 3)
dup_types = summary['duplicates_by_type']
labels = [f"{k.replace('_', ' ').title()}\n({v})" for k, v in dup_types.items()]
sizes = list(dup_types.values())
colors_dup = ['#ff6b6b', '#ffd43b', '#74c0fc']
explode = (0.05, 0.05, 0.05)

ax3.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90,
        colors=colors_dup, explode=explode, shadow=True)
ax3.set_title('Duplicates by Type', fontsize=14, fontweight='bold')

# 4. Deduplication Impact (Horizontal Bar)
ax4 = plt.subplot(2, 3, 4)
metrics = ['Total\nDocuments', 'Unique\nDocuments', 'Duplicates\nRemoved']
before_after = [
    [summary['total_before'], summary['total_after']],
    [summary['total_after'], summary['total_after']],
    [0, summary['duplicates_removed']]
]

x = range(len(metrics))
width = 0.35

bars1 = ax4.barh([i - width/2 for i in x], [b[0] for b in before_after],
                 width, label='Before', color='#ff6b6b', alpha=0.8, edgecolor='black')
bars2 = ax4.barh([i + width/2 for i in x], [b[1] for b in before_after],
                 width, label='After', color='#51cf66', alpha=0.8, edgecolor='black')

ax4.set_yticks(x)
ax4.set_yticklabels(metrics)
ax4.set_xlabel('Count', fontsize=12, fontweight='bold')
ax4.set_title('Impact Analysis', fontsize=14, fontweight='bold')
ax4.legend()
ax4.grid(axis='x', alpha=0.3)

# 5. Reduction Percentage (Gauge-style)
ax5 = plt.subplot(2, 3, 5)
reduction_pct = (summary['duplicates_removed'] / summary['total_before']) * 100

# Create a simple gauge chart
theta = [0, reduction_pct, 100]
r = [1, 1, 1]
colors_gauge = ['#51cf66', '#ff6b6b', '#e9ecef']

ax5.barh([0], [reduction_pct], color='#ff6b6b', alpha=0.8, edgecolor='black', linewidth=2)
ax5.barh([0], [100-reduction_pct], left=reduction_pct, color='#51cf66',
         alpha=0.8, edgecolor='black', linewidth=2)
ax5.set_xlim(0, 100)
ax5.set_ylim(-0.5, 0.5)
ax5.set_yticks([])
ax5.set_xlabel('Percentage', fontsize=12, fontweight='bold')
ax5.set_title(f'Reduction Rate: {reduction_pct:.1f}%', fontsize=14, fontweight='bold')
ax5.text(50, 0, f'{reduction_pct:.1f}%\nReduced',
         ha='center', va='center', fontsize=18, fontweight='bold')
ax5.grid(axis='x', alpha=0.3)

# 6. Summary Statistics (Text)
ax6 = plt.subplot(2, 3, 6)
ax6.axis('off')

summary_text = f"""
DEDUPLICATION SUMMARY

Original Count:     {summary['total_before']:>3} documents
Final Count:        {summary['total_after']:>3} documents
Duplicates Removed: {summary['duplicates_removed']:>3} documents

Reduction Rate:     {reduction_pct:.1f}%

DUPLICATE BREAKDOWN:
• Exact ID:         {dup_types.get('exact_id', 0):>3} duplicates
• Exact Filename:   {dup_types.get('exact_filename', 0):>3} duplicates
• Exact Title:      {dup_types.get('exact_title', 0):>3} duplicates

DATA SOURCES:
• TypeScript KB:    {sources['typescript_kb']:>3} documents
• JSON KB:          {sources['kb_json']:>3} documents
• Embeddings:       {sources['embeddings']:>3} documents

DUPLICATE GROUPS:   {summary['duplicate_groups']:>3} groups

Status: ✓ COMPLETED SUCCESSFULLY
"""

ax6.text(0.1, 0.5, summary_text, transform=ax6.transAxes,
         fontsize=11, verticalalignment='center', fontfamily='monospace',
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))

# Adjust layout and save
plt.tight_layout()
output_path = SCRIPT_DIR / "deduplication-visualization.png"
plt.savefig(output_path, dpi=300, bbox_inches='tight')
print(f"✓ Saved visualization to: {output_path}")

# Also save as PDF
output_pdf = SCRIPT_DIR / "deduplication-visualization.pdf"
plt.savefig(output_pdf, dpi=300, bbox_inches='tight')
print(f"✓ Saved PDF to: {output_pdf}")

plt.close()

print("\nVisualization complete!")
