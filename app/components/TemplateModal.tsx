'use client';

/**
 * TemplateModal Component
 *
 * Modal for template selection and generation
 */

import { useState, useEffect } from 'react';
import { actionHandler } from '@/lib/action-handlers';

interface Template {
  key: string;
  name: string;
  description: string;
  priority: number;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (result: any) => void;
}

export default function TemplateModal({ isOpen, onClose, onGenerated }: TemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    const result = await actionHandler.getTemplates();
    if (result.success) {
      setTemplates(result.data || []);
    } else {
      setError(result.error || 'Failed to load templates');
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');

    const result = await actionHandler.handleTemplateGeneration({
      templateKey: selectedTemplate,
      autoDetect: false,
    });

    setLoading(false);

    if (result.success) {
      onGenerated(result.data);
      onClose();
    } else {
      setError(result.error || 'Generation failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Select Template</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.key}
                onClick={() => setSelectedTemplate(template.key)}
                className={`
                  border-2 rounded-xl p-4 cursor-pointer transition-all
                  ${selectedTemplate === template.key
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300 bg-white'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                  <span className={`
                    ml-3 px-2 py-1 rounded text-xs font-medium
                    ${template.priority === 1 ? 'bg-red-100 text-red-700' :
                      template.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}
                  `}>
                    P{template.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedTemplate || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
