/**
 * ExportButton Component
 * Button to export conversation in multiple formats
 *
 * Features:
 * - Export as JSON, Text, or Markdown
 * - Download or copy to clipboard
 * - Dropdown menu with options
 */

'use client';

import React, { useState } from 'react';
import { downloadConversation, copyToClipboard } from '@/lib/export-conversation';

export interface ExportButtonProps {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  repName?: string;
  isDarkMode?: boolean;
}

export default function ExportButton({ messages, repName, isDarkMode = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = (format: 'json' | 'txt' | 'md') => {
    downloadConversation(messages, {
      format,
      includeTimestamps: true,
      repName,
    });
    setIsOpen(false);
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(messages, 'txt');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
          transition-all duration-200
          ${isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }
        `}
        title="Export conversation"
      >
        <span className="text-lg">{copied ? '✓' : '📥'}</span>
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Export'}</span>
      </button>

      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-2 w-48
          rounded-lg shadow-2xl border-2 overflow-hidden
          ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}
          z-50
        `}>
          <div className="p-2">
            <button
              onClick={() => handleDownload('txt')}
              className={`
                w-full px-3 py-2 rounded-md text-left text-sm font-medium
                transition-all
                ${isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              📄 Download as Text
            </button>
            <button
              onClick={() => handleDownload('md')}
              className={`
                w-full px-3 py-2 rounded-md text-left text-sm font-medium
                transition-all
                ${isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              📝 Download as Markdown
            </button>
            <button
              onClick={() => handleDownload('json')}
              className={`
                w-full px-3 py-2 rounded-md text-left text-sm font-medium
                transition-all
                ${isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              🗂️ Download as JSON
            </button>
            <div className={`my-1 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            <button
              onClick={handleCopy}
              className={`
                w-full px-3 py-2 rounded-md text-left text-sm font-medium
                transition-all
                ${isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
