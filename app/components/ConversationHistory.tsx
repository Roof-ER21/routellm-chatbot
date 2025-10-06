/**
 * ConversationHistory Component
 * Dropdown for managing conversation history
 *
 * Features:
 * - View all saved conversations
 * - Load previous conversations
 * - Delete old conversations
 * - New conversation button
 * - LocalStorage persistence
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  preview: string;
}

export interface ConversationHistoryProps {
  onLoadConversation: (id: string) => void;
  onNewConversation: () => void;
  currentConversationId?: string;
  isDarkMode?: boolean;
}

export default function ConversationHistory({
  onLoadConversation,
  onNewConversation,
  currentConversationId,
  isDarkMode = false,
}: ConversationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Load conversation history from localStorage
    loadConversations();
  }, []);

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem('susan21_conversation_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        const conversations = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
        }));
        setConversations(conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversation = (conversation: Conversation) => {
    try {
      const updated = [conversation, ...conversations.filter(c => c.id !== conversation.id)].slice(0, 20); // Keep last 20
      setConversations(updated);
      localStorage.setItem('susan21_conversation_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const deleteConversation = (id: string) => {
    try {
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      localStorage.setItem('susan21_conversation_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleLoad = (id: string) => {
    onLoadConversation(id);
    setIsOpen(false);
  };

  const handleNew = () => {
    onNewConversation();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
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
        title="Conversation History"
      >
        <span className="text-lg">💬</span>
        <span className="hidden sm:inline">History</span>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto
          rounded-xl shadow-2xl border-2
          ${isDarkMode
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-300'
          }
          z-50
        `}>
          {/* Header */}
          <div className={`
            sticky top-0 p-4 border-b-2
            ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
          `}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Conversations
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <button
              onClick={handleNew}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 transition-all"
            >
              + New Conversation
            </button>
          </div>

          {/* Conversation List */}
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No saved conversations yet
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    group relative p-3 mb-2 rounded-lg cursor-pointer
                    transition-all duration-200
                    ${conv.id === currentConversationId
                      ? 'bg-red-100 border-2 border-red-500'
                      : isDarkMode
                      ? 'bg-gray-800 hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => handleLoad(conv.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`
                        font-semibold text-sm mb-1 truncate
                        ${conv.id === currentConversationId
                          ? 'text-red-700'
                          : isDarkMode ? 'text-white' : 'text-gray-900'
                        }
                      `}>
                        {conv.title}
                      </h4>
                      <p className={`
                        text-xs mb-1 truncate
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                      `}>
                        {conv.preview}
                      </p>
                      <div className={`
                        flex items-center gap-2 text-xs
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}
                      `}>
                        <span>{conv.messageCount} messages</span>
                        <span>•</span>
                        <span>{conv.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-lg transition-opacity"
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
