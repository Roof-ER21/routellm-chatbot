'use client'

import { useState, useEffect } from 'react'

interface Template {
  key: string
  name: string
  description: string
  priority: number
}

interface TemplateInfo {
  name: string
  description: string
  variables: string[]
  requiredData: string[]
  keywords: string[]
}

interface GeneratedDocument {
  document: string
  template: string
  templateKey: string
  variables: Record<string, string>
  missingVariables: string[]
  validation: {
    isValid: boolean
    score: number
    issues: string[]
    warnings: string[]
    suggestions: string[]
  }
  readyToSend: boolean
  suggestedEdits: string[]
}

export default function TemplateSelector() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  // Load template info when selection changes
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateInfo(selectedTemplate)
    }
  }, [selectedTemplate])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
      setError('Failed to load templates')
    }
  }

  const loadTemplateInfo = async (templateKey: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey })
      })
      const data = await response.json()
      if (data.success) {
        setTemplateInfo(data.template)
        // Initialize variables with empty strings
        const initialVars: Record<string, string> = {}
        data.template.variables.forEach((v: string) => {
          initialVars[v] = ''
        })
        setVariables(initialVars)
      }
    } catch (err) {
      console.error('Failed to load template info:', err)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setGeneratedDoc(null)

    try {
      const body = mode === 'auto'
        ? { input }
        : { templateKey: selectedTemplate, variables }

      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedDoc(data)
      } else {
        setError(data.error || 'Failed to generate document')
      }
    } catch (err) {
      setError('Failed to generate document')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }))
  }

  const copyToClipboard = () => {
    if (generatedDoc?.document) {
      navigator.clipboard.writeText(generatedDoc.document)
      alert('Document copied to clipboard!')
    }
  }

  const downloadDocument = () => {
    if (generatedDoc?.document) {
      const blob = new Blob([generatedDoc.document], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedDoc.templateKey}_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Insurance Document Templates</h1>
        <p className="text-gray-600">
          Generate professional insurance documents powered by AI
        </p>
      </div>

      {/* Mode Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setMode('auto')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Auto-Select Template
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manual Template & Variables
          </button>
        </div>

        {mode === 'auto' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your situation
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="E.g., I need to appeal a partial denial for my property at 123 Main St..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={!input || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Document'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            {templateInfo && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-medium text-gray-900">Template Variables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templateInfo.variables.slice(0, 10).map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm text-gray-600 mb-1">
                        {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={variables[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
                </div>
                {templateInfo.variables.length > 10 && (
                  <p className="text-sm text-gray-500">
                    + {templateInfo.variables.length - 10} more variables (will be auto-filled by AI)
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedTemplate || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Document'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Generated Document */}
      {generatedDoc && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Generated Document</h2>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={downloadDocument}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Download
              </button>
            </div>
          </div>

          {/* Validation Status */}
          <div className={`p-4 rounded-lg ${
            generatedDoc.readyToSend
              ? 'bg-green-50 border border-green-200'
              : generatedDoc.validation.isValid
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                {generatedDoc.readyToSend ? '✓ Ready to Send' : generatedDoc.validation.isValid ? '⚠ Needs Review' : '✗ Needs Revision'}
              </h3>
              <span className="text-sm font-medium">
                Score: {generatedDoc.validation.score}/100
              </span>
            </div>

            {generatedDoc.validation.issues.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700">Issues:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {generatedDoc.validation.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {generatedDoc.validation.warnings.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-yellow-700">Warnings:</p>
                <ul className="text-sm text-yellow-600 list-disc list-inside">
                  {generatedDoc.validation.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {generatedDoc.suggestedEdits.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-blue-700">Suggestions:</p>
                <ul className="text-sm text-blue-600 list-disc list-inside">
                  {generatedDoc.suggestedEdits.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {generatedDoc.document}
            </pre>
          </div>

          {/* Missing Variables */}
          {generatedDoc.missingVariables.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Missing Variables (AI will auto-fill these):
              </p>
              <div className="flex flex-wrap gap-2">
                {generatedDoc.missingVariables.map((variable) => (
                  <span
                    key={variable}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {variable.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.key}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => {
                setMode('manual')
                setSelectedTemplate(template.key)
              }}
            >
              <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  template.priority === 1
                    ? 'bg-red-100 text-red-700'
                    : template.priority === 2
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  Priority {template.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
