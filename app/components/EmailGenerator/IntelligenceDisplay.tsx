/**
 * Intelligence Display Components for Email Generator
 * Shows document analysis, template recommendations, and argument suggestions
 */

import React from 'react'
import type { DocumentAnalysisResult } from '@/lib/document-analyzer'
import type { TemplateRecommendation, EmailTemplate } from '@/lib/template-service'
import type { Argument } from '@/lib/argument-library'

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
  return (
    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
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

      {/* Identified Issues */}
      {analysis.identifiedIssues.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            Issues Found:
          </h4>
          <ul className="space-y-1.5">
            {analysis.identifiedIssues.map((issue, idx) => (
              <li key={idx} className="text-xs flex items-start gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${
                  issue.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' :
                  issue.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' :
                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'
                }`}>
                  {issue.severity}
                </span>
                <span className="text-green-700 dark:text-green-300">{issue.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Code References */}
      {analysis.codeReferences.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            Applicable Building Codes:
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.codeReferences.map((code, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 text-xs rounded cursor-help"
                title={code.description}
              >
                {code.code} {code.section}
                {code.successRate && (
                  <span className="ml-1 font-bold">({code.successRate}%)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
            Recommendations:
          </h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-green-700 dark:text-green-300">
                • {rec}
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
  return (
    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">💡</span>
        <h3 className="font-semibold text-purple-900 dark:text-purple-100">
          Suggested Arguments
        </h3>
        <span className="ml-auto text-xs text-purple-700 dark:text-purple-300">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {args.map((argument) => (
          <label
            key={argument.id}
            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border-2 border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(argument.id)}
              onChange={() => onToggleArgument(argument.id)}
              className="mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  {argument.title}
                </span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 text-[10px] font-bold rounded">
                  {argument.successRate}% success
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded">
                  Used {argument.usageCount}x
                </span>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-[10px] rounded">
                  {argument.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                {argument.description}
              </p>
              {argument.stateSpecific && argument.stateSpecific.length > 0 && (
                <div className="flex gap-1 mt-1">
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
            </div>
          </label>
        ))}
      </div>
    </div>
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
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Select Email Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid gap-4">
            {templates.map((template) => (
              <button
                key={template.template_name}
                onClick={() => {
                  onSelect(template)
                  onClose()
                }}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  currentTemplate?.template_name === template.template_name
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {template.template_name}
                  </h3>
                  {currentTemplate?.template_name === template.template_name && (
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                      ✓ Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.purpose}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {template.audience}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {template.tone}
                  </span>
                  {template.success_indicators && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded font-semibold">
                      {template.success_indicators.approval_rate}% success
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
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
