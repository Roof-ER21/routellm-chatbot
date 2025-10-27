/**
 * Knowledge Base Numbering System
 * Provides grouped sub-numbering for documents (1.1, 1.2, 2.1, 2.2, etc.)
 */

import { InsuranceKBDocument, DocumentCategory } from './insurance-argumentation-kb'

export interface NumberedDocument extends InsuranceKBDocument {
  displayNumber: string
  categoryIndex: number
  documentIndex: number
}

export interface CategoryGroup {
  category: DocumentCategory
  categoryNumber: number
  documents: NumberedDocument[]
  label: string
  icon: string
  count: number
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  pushback: 'Insurance Pushbacks',
  building_codes: 'Building Codes',
  manufacturer_specs: 'GAF Guidelines',
  warranties: 'Warranties',
  training: 'Training Materials',
  licenses: 'State Licenses',
  agreements: 'Contractual Agreements',
  email_templates: 'Email Templates',
  sales_scripts: 'Sales Scripts',
  photo_examples: 'Photo Examples',
  templates: 'Document Templates',
  reports: 'Inspection Reports',
  photo_reports: 'Sample Photo Reports',
  certifications: 'Certifications & Licenses',
  training_scripts: 'Call & Meeting Scripts',
  training_materials: 'Training Manuals & Guides',
  pushback_strategies: 'Escalation Strategies',
  process_guides: 'Process & How-To Guides',
  reference: 'Quick Reference Materials'
}

const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  pushback: '🛡️',
  building_codes: '📋',
  manufacturer_specs: '🏭',
  warranties: '✅',
  training: '📚',
  licenses: '🎓',
  agreements: '📄',
  email_templates: '✉️',
  sales_scripts: '💬',
  photo_examples: '📸',
  templates: '📝',
  reports: '📊',
  photo_reports: '📷',
  certifications: '🏆',
  training_scripts: '🎤',
  training_materials: '📖',
  pushback_strategies: '⚡',
  process_guides: '🗺️',
  reference: '📌'
}

/**
 * Group documents by category and assign numbered labels
 * Returns grouped structure with 1.1, 1.2, 2.1, 2.2 style numbering
 */
export function groupAndNumberDocuments(
  documents: InsuranceKBDocument[]
): CategoryGroup[] {
  // Group documents by category
  const grouped = new Map<DocumentCategory, InsuranceKBDocument[]>()

  documents.forEach(doc => {
    if (!grouped.has(doc.category)) {
      grouped.set(doc.category, [])
    }
    grouped.get(doc.category)!.push(doc)
  })

  // Convert to CategoryGroup array with numbering
  const categoryGroups: CategoryGroup[] = []
  let categoryNumber = 1

  // Process categories in a consistent order
  const orderedCategories: DocumentCategory[] = [
    'building_codes',
    'pushback',
    'pushback_strategies',
    'manufacturer_specs',
    'warranties',
    'templates',
    'email_templates',
    'reports',
    'photo_reports',
    'training_scripts',
    'sales_scripts',
    'training_materials',
    'training',
    'process_guides',
    'agreements',
    'certifications',
    'licenses',
    'reference',
    'photo_examples'
  ]

  orderedCategories.forEach(category => {
    const docs = grouped.get(category)
    if (!docs || docs.length === 0) return

    const numberedDocs: NumberedDocument[] = docs.map((doc, index) => ({
      ...doc,
      displayNumber: `${categoryNumber}.${index + 1}`,
      categoryIndex: categoryNumber,
      documentIndex: index + 1
    }))

    categoryGroups.push({
      category,
      categoryNumber,
      documents: numberedDocs,
      label: CATEGORY_LABELS[category],
      icon: CATEGORY_ICONS[category],
      count: docs.length
    })

    categoryNumber++
  })

  return categoryGroups
}

/**
 * Search documents across all categories and maintain numbering
 */
export function searchNumberedDocuments(
  categoryGroups: CategoryGroup[],
  query: string
): NumberedDocument[] {
  const lowerQuery = query.toLowerCase()
  const results: NumberedDocument[] = []

  categoryGroups.forEach(group => {
    group.documents.forEach(doc => {
      const searchText = `
        ${doc.title}
        ${doc.summary}
        ${doc.content}
        ${doc.keywords.join(' ')}
        ${doc.metadata.code_citations?.join(' ') || ''}
      `.toLowerCase()

      if (searchText.includes(lowerQuery)) {
        results.push(doc)
      }
    })
  })

  return results
}

/**
 * Filter documents by category and maintain numbering
 */
export function filterByCategory(
  categoryGroups: CategoryGroup[],
  category: DocumentCategory | 'all'
): NumberedDocument[] {
  if (category === 'all') {
    return categoryGroups.flatMap(group => group.documents)
  }

  const group = categoryGroups.find(g => g.category === category)
  return group?.documents || []
}

/**
 * Get document preview text (first N characters)
 */
export function getDocumentPreview(document: InsuranceKBDocument, length: number = 50): string {
  const content = document.content.trim()
  if (content.length <= length) return content
  return content.substring(0, length).trim() + '...'
}

/**
 * Get bookmarked documents from localStorage
 */
export function getBookmarkedDocuments(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const bookmarks = localStorage.getItem('kb_bookmarks')
    return bookmarks ? new Set(JSON.parse(bookmarks)) : new Set()
  } catch (error) {
    console.error('Failed to load bookmarks:', error)
    return new Set()
  }
}

/**
 * Toggle bookmark status for a document
 */
export function toggleBookmark(documentId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const bookmarks = getBookmarkedDocuments()

    if (bookmarks.has(documentId)) {
      bookmarks.delete(documentId)
    } else {
      bookmarks.add(documentId)
    }

    localStorage.setItem('kb_bookmarks', JSON.stringify([...bookmarks]))
    return bookmarks.has(documentId)
  } catch (error) {
    console.error('Failed to toggle bookmark:', error)
    return false
  }
}

/**
 * Check if document is bookmarked
 */
export function isBookmarked(documentId: string): boolean {
  return getBookmarkedDocuments().has(documentId)
}

/**
 * Get all bookmarked documents with their numbers
 */
export function getBookmarkedDocumentsList(
  categoryGroups: CategoryGroup[]
): NumberedDocument[] {
  const bookmarks = getBookmarkedDocuments()
  const bookmarkedDocs: NumberedDocument[] = []

  categoryGroups.forEach(group => {
    group.documents.forEach(doc => {
      if (bookmarks.has(doc.id)) {
        bookmarkedDocs.push(doc)
      }
    })
  })

  return bookmarkedDocs
}
