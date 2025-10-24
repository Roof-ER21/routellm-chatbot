/**
 * Intelligence Display Components for Email Generator
 * Shows document analysis, template recommendations, and argument suggestions
 * ENHANCED: Complete library visibility with search, filters, and mobile-responsive design
 */

import React, { useState, useMemo } from 'react'
import type { DocumentAnalysisResult } from '@/lib/document-analyzer'
import type { TemplateRecommendation, EmailTemplate } from '@/lib/template-service'
import type { Argument, ArgumentCategory } from '@/lib/argument-library'
import { ARGUMENT_CATEGORIES } from '@/lib/argument-library'

interface TemplateRecommendationDisplayProps {
  recommendation: TemplateRecommendation
  onUseTemplate: () => void
  onChangeTemplate: () => void
}

export function TemplateRecommendationDisplay({
  recommendation,
  onUseTemplate,
  onChangeTemplate
}: TemplateRecommendationDisplayProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📋</span>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Recommended Template
            </h3>
          </div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            {recommendation.template.template_name}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
            {recommendation.reasoning}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded font-semibold">
              Confidence: {recommendation.confidence}%
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
              Tone: {recommendation.template.tone}
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
              Audience: {recommendation.template.audience}
            </span>
          </div>
        </div>
        <div className="ml-4 flex flex-col gap-2">
          <button
            onClick={onUseTemplate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded shadow transition-colors"
          >
            Use Template
          </button>
          <button
            onClick={onChangeTemplate}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded transition-colors"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  )
}

interface DocumentAnalysisDisplayProps {
  analysis: DocumentAnalysisResult
}

export function DocumentAnalysisDisplay({ analysis }: DocumentAnalysisDisplayProps) {
  const [showAllCodes, setShowAllCodes] = useState(false)

  return (
    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-2xl">🔍</span>
        <h3 className="font-semibold text-green-900 dark:text-green-100">
          Document Analysis
        </h3>
        <span className="ml-auto px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 text-xs font-semibold rounded">
          {analysis.confidence}% confidence
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-green-800 dark:text-green-200 mb-3">
        <strong>{analysis.documentType}</strong> - {analysis.summary}
      </p>

      {/* Extracted Data */}
      {analysis.extractedData && Object.keys(analysis.extractedData).length > 0 && (
        <div className="mb-3 p-3 bg-green-100 dark:bg-green-800/30 rounded">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            Extracted Information:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {analysis.extractedData.claimNumber && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-semibold">Claim #: </span>
                <span className="text-green-900 dark:text-green-100">{analysis.extractedData.claimNumber}</span>
              </div>
            )}
            {analysis.extractedData.policyNumber && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-semibold">Policy #: </span>
                <span className="text-green-900 dark:text-green-100">{analysis.extractedData.policyNumber}</span>
              </div>
            )}
            {analysis.extractedData.propertyAddress && (
              <div className="sm:col-span-2">
                <span className="text-green-700 dark:text-green-300 font-semibold">Property: </span>
                <span className="text-green-900 dark:text-green-100">{analysis.extractedData.propertyAddress}</span>
              </div>
            )}
            {analysis.extractedData.estimateAmount && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-semibold">Estimate: </span>
                <span className="text-green-900 dark:text-green-100">${analysis.extractedData.estimateAmount.toLocaleString()}</span>
              </div>
            )}
            {analysis.extractedData.dateOfLoss && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-semibold">Date of Loss: </span>
                <span className="text-green-900 dark:text-green-100">{analysis.extractedData.dateOfLoss}</span>
              </div>
            )}
            {analysis.extractedData.roofingMaterial && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-semibold">Material: </span>
                <span className="text-green-900 dark:text-green-100">{analysis.extractedData.roofingMaterial}</span>
              </div>
            )}
            {analysis.extractedData.measurements?.squares && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-semibold">Squares: </span>
                <span className="text-green-900 dark:text-green-100">{analysis.extractedData.measurements.squares}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Identified Issues */}
      {analysis.identifiedIssues.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            Issues Found ({analysis.identifiedIssues.length}):
          </h4>
          <ul className="space-y-2">
            {analysis.identifiedIssues.map((issue, idx) => (
              <li key={idx} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                    issue.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                    issue.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' :
                    'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="text-green-900 dark:text-green-100 font-semibold flex-1">{issue.description}</span>
                </div>
                {issue.affectedItems && issue.affectedItems.length > 0 && (
                  <div className="text-[10px] text-green-700 dark:text-green-300 ml-2">
                    Affects: {issue.affectedItems.join(', ')}
                  </div>
                )}
                {issue.suggestedArguments && issue.suggestedArguments.length > 0 && (
                  <div className="mt-1 ml-2 flex flex-wrap gap-1">
                    {issue.suggestedArguments.map((arg, argIdx) => (
                      <span key={argIdx} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 text-[9px] rounded">
                        {arg}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Code References */}
      {analysis.codeReferences.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
              Applicable Building Codes ({analysis.codeReferences.length}):
            </h4>
            {analysis.codeReferences.length > 3 && (
              <button
                onClick={() => setShowAllCodes(!showAllCodes)}
                className="text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                {showAllCodes ? 'Show Less' : 'Show All'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(showAllCodes ? analysis.codeReferences : analysis.codeReferences.slice(0, 3)).map((code, idx) => (
              <div
                key={idx}
                className="p-2 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-green-900 dark:text-green-100">
                    {code.code} {code.section}
                  </span>
                  {code.successRate && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      code.successRate >= 90 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' :
                      code.successRate >= 80 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                      'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                    }`}>
                      {code.successRate}% success
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-green-700 dark:text-green-300 mb-1">
                  {code.description}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  Applicability: {code.applicability}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            Recommendations ({analysis.recommendations.length}):
          </h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-green-700 dark:text-green-300 flex items-start gap-1">
                <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface ArgumentSelectorProps {
  arguments: Argument[]
  selectedIds: string[]
  onToggleArgument: (id: string) => void
}

export function ArgumentSelector({
  arguments: args,
  selectedIds,
  onToggleArgument
}: ArgumentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<ArgumentCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'successRate' | 'usageCount' | 'title'>('successRate')
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [expandedView, setExpandedView] = useState(false)

  // Filter and sort arguments
  const filteredAndSortedArgs = useMemo(() => {
    let filtered = args

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(arg =>
        arg.title.toLowerCase().includes(query) ||
        arg.description.toLowerCase().includes(query) ||
        arg.fullText.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(arg => arg.category === filterCategory)
    }

    // Apply selection filter
    if (showOnlySelected) {
      filtered = filtered.filter(arg => selectedIds.includes(arg.id))
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'successRate':
          return b.successRate - a.successRate
        case 'usageCount':
          return b.usageCount - a.usageCount
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return sorted
  }, [args, searchQuery, filterCategory, sortBy, showOnlySelected, selectedIds])

  return (
    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-2xl">💡</span>
        <h3 className="font-semibold text-purple-900 dark:text-purple-100">
          Argument Library
        </h3>
        <span className="ml-auto px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
          {selectedIds.length} selected
        </span>
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="px-2 py-1 bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 text-purple-900 dark:text-purple-100 text-xs rounded transition-colors"
        >
          {expandedView ? 'Collapse' : 'Expand All'}
        </button>
      </div>

      {/* Statistics Bar */}
      <div className="mb-3 p-2 bg-purple-100 dark:bg-purple-800/30 rounded flex gap-4 text-xs flex-wrap">
        <div>
          <span className="text-purple-600 dark:text-purple-300 font-semibold">Total: </span>
          <span className="text-purple-900 dark:text-purple-100">{args.length} arguments</span>
        </div>
        <div>
          <span className="text-purple-600 dark:text-purple-300 font-semibold">Showing: </span>
          <span className="text-purple-900 dark:text-purple-100">{filteredAndSortedArgs.length}</span>
        </div>
        <div>
          <span className="text-purple-600 dark:text-purple-300 font-semibold">Avg Success: </span>
          <span className="text-purple-900 dark:text-purple-100">
            {args.length > 0 ? Math.round(args.reduce((sum, a) => sum + a.successRate, 0) / args.length) : 0}%
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-3 space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search arguments by title, description, or content..."
            className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ArgumentCategory | 'all')}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-xs text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Categories</option>
            {ARGUMENT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-xs text-gray-900 dark:text-gray-100"
          >
            <option value="successRate">Success Rate</option>
            <option value="usageCount">Usage Count</option>
            <option value="title">Alphabetical</option>
          </select>

          <label className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlySelected}
              onChange={(e) => setShowOnlySelected(e.target.checked)}
              className="rounded"
            />
            Selected only
          </label>

          {(searchQuery || filterCategory !== 'all' || showOnlySelected) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterCategory('all')
                setShowOnlySelected(false)
              }}
              className="px-2 py-1 bg-purple-200 dark:bg-purple-800 hover:bg-purple-300 dark:hover:bg-purple-700 text-purple-900 dark:text-purple-100 text-xs rounded transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Arguments List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredAndSortedArgs.length === 0 ? (
          <div className="text-center py-8 text-purple-600 dark:text-purple-400 text-sm">
            No arguments match your filters. Try adjusting your search or filters.
          </div>
        ) : (
          filteredAndSortedArgs.map((argument) => (
            <ArgumentCard
              key={argument.id}
              argument={argument}
              isSelected={selectedIds.includes(argument.id)}
              onToggle={() => onToggleArgument(argument.id)}
              expanded={expandedView}
            />
          ))
        )}
      </div>

      {/* Quick Select Actions */}
      <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700 flex gap-2 flex-wrap">
        <button
          onClick={() => {
            const highSuccess = args.filter(a => a.successRate >= 85).map(a => a.id)
            highSuccess.forEach(id => {
              if (!selectedIds.includes(id)) onToggleArgument(id)
            })
          }}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
        >
          Select High Success (85%+)
        </button>
        <button
          onClick={() => {
            args.forEach(arg => {
              if (selectedIds.includes(arg.id)) onToggleArgument(arg.id)
            })
          }}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  )
}

// Argument Card Component
function ArgumentCard({
  argument,
  isSelected,
  onToggle,
  expanded
}: {
  argument: Argument
  isSelected: boolean
  onToggle: () => void
  expanded: boolean
}) {
  const [showFullText, setShowFullText] = useState(false)

  return (
    <label
      className={`flex items-start gap-3 p-3 rounded border-2 cursor-pointer transition-all ${
        isSelected
          ? 'bg-purple-100 dark:bg-purple-800/40 border-purple-500 dark:border-purple-500'
          : 'bg-white dark:bg-gray-800 border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600'
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        {/* Title and Badges */}
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex-1">
            {argument.title}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            argument.successRate >= 90 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' :
            argument.successRate >= 80 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
            'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
          }`}>
            {argument.successRate}% success
          </span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded">
            Used {argument.usageCount}x
          </span>
        </div>

        {/* Category Badge */}
        <div className="mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-[10px] rounded">
            {ARGUMENT_CATEGORIES.find(c => c.value === argument.category)?.label || argument.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
          {argument.description}
        </p>

        {/* Expandable Full Text */}
        {(expanded || showFullText) && (
          <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
            <strong className="block mb-1">Full Argument Text:</strong>
            {argument.fullText}
          </div>
        )}

        {!expanded && (
          <button
            onClick={(e) => {
              e.preventDefault()
              setShowFullText(!showFullText)
            }}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline mb-2"
          >
            {showFullText ? 'Hide' : 'Show'} full text
          </button>
        )}

        {/* State Specific Tags */}
        {argument.stateSpecific && argument.stateSpecific.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {argument.stateSpecific.map((state, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-[9px] rounded font-semibold"
              >
                {state}
              </span>
            ))}
          </div>
        )}

        {/* Applicable Scenarios */}
        {argument.applicableScenarios && argument.applicableScenarios.length > 0 && (
          <div className="text-[10px] text-purple-600 dark:text-purple-400">
            <strong>Scenarios: </strong>
            {argument.applicableScenarios.slice(0, 3).join(', ')}
            {argument.applicableScenarios.length > 3 && '...'}
          </div>
        )}
      </div>
    </label>
  )
}

interface TemplateSelectorModalProps {
  templates: EmailTemplate[]
  currentTemplate: EmailTemplate | null
  onSelect: (template: EmailTemplate) => void
  onClose: () => void
}

export function TemplateSelectorModal({
  templates,
  currentTemplate,
  onSelect,
  onClose
}: TemplateSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAudience, setFilterAudience] = useState<'all' | 'Insurance Adjuster' | 'Homeowner'>('all')

  const filteredTemplates = useMemo(() => {
    let filtered = templates

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.template_name.toLowerCase().includes(query) ||
        t.purpose.toLowerCase().includes(query) ||
        t.audience.toLowerCase().includes(query)
      )
    }

    if (filterAudience !== 'all') {
      filtered = filtered.filter(t => t.audience.includes(filterAudience))
    }

    return filtered
  }, [templates, searchQuery, filterAudience])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Email Template Library
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {templates.length} professional templates • Choose the best fit for your situation
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 min-w-[200px] px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value as typeof filterAudience)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Audiences</option>
              <option value="Insurance Adjuster">Insurance Adjusters</option>
              <option value="Homeowner">Homeowners</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No templates match your search. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.template_name}
                  onClick={() => {
                    onSelect(template)
                    onClose()
                  }}
                  className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                    currentTemplate?.template_name === template.template_name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  {/* Title and Status */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight pr-2">
                      {template.template_name}
                    </h3>
                    {currentTemplate?.template_name === template.template_name && (
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold whitespace-nowrap">
                        ✓ Selected
                      </span>
                    )}
                  </div>

                  {/* Purpose */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.purpose}
                  </p>

                  {/* Success Indicators */}
                  {template.success_indicators && template.success_indicators.approval_rate && (
                    <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                        <span className={`font-bold ${
                          (template.success_indicators.approval_rate || 0) >= 90 ? 'text-green-600 dark:text-green-400' :
                          (template.success_indicators.approval_rate || 0) >= 80 ? 'text-blue-600 dark:text-blue-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {template.success_indicators.approval_rate}%
                        </span>
                      </div>
                      {template.success_indicators.usage_count && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Used:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                            {template.success_indicators.usage_count}x
                          </span>
                        </div>
                      )}
                      {template.success_indicators.avg_response_time && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                            {template.success_indicators.avg_response_time}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-[10px] font-medium">
                      {template.audience}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded text-[10px]">
                      {template.tone}
                    </span>
                    {template.arguments_used && template.arguments_used.length > 0 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-[10px]">
                        {template.arguments_used.length} arguments
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AnalyzingIndicator() {
  return (
    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-yellow-600 dark:text-yellow-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div>
          <p className="font-semibold text-yellow-900 dark:text-yellow-100">Analyzing document...</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">Extracting intelligence and recommending templates</p>
        </div>
      </div>
    </div>
  )
}
