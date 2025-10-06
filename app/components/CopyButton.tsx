/**
 * CopyButton Component
 * Allows users to copy message content to clipboard
 *
 * Features:
 * - One-click copy to clipboard
 * - Visual feedback on success
 * - Compact and unobtrusive design
 * - Works for both user and assistant messages
 */

'use client';

import React, { useState } from 'react';

export interface CopyButtonProps {
  text: string;
  variant?: 'light' | 'dark';
}

export default function CopyButton({ text, variant = 'light' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        group relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        transition-all duration-200
        ${variant === 'dark'
          ? 'text-red-100 hover:text-white hover:bg-red-700/30'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }
      `}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <span className="text-sm">
        {copied ? '✓' : '📋'}
      </span>
      <span className="hidden sm:inline">
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  );
}
