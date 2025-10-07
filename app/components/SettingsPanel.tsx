/**
 * SettingsPanel Component
 * User preferences and configuration
 *
 * Features:
 * - Theme toggle
 * - Default modes configuration
 * - Voice settings toggle
 * - Conversation history management
 * - Clear conversation history
 * - Export/import settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getConversations, deleteConversation as deleteConv, getConversation } from '@/lib/simple-auth';

export interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  preview: string;
  date?: number;
  messages?: any[];
}

export interface SettingsPanelProps {
  isDarkMode: boolean;
  educationMode: boolean;
  voiceEnabled: boolean;
  onThemeChange: (isDark: boolean) => void;
  onEducationChange: (enabled: boolean) => void;
  onVoiceEnabledChange: (enabled: boolean) => void;
  onLoadConversation?: (messages: any[], conversationId: string) => void;
  onNewConversation?: () => void;
  currentConversationId?: string;
  // New props for Export and Email
  messages?: any[];
  repName?: string;
  sessionId?: string | null;
  onExport?: () => void;
  onEmailGenerate?: () => void;
}

export default function SettingsPanel({
  isDarkMode,
  educationMode,
  voiceEnabled,
  onThemeChange,
  onEducationChange,
  onVoiceEnabledChange,
  onLoadConversation,
  onNewConversation,
  currentConversationId,
  messages,
  repName,
  sessionId,
  onExport,
  onEmailGenerate,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = () => {
    try {
      const convs = getConversations();

      // Filter conversations to only show those from last 60 days
      const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
      const recentConvs = convs.filter(conv => conv.date >= sixtyDaysAgo);

      const formatted = recentConvs.map(conv => ({
        id: conv.id,
        title: conv.title,
        timestamp: new Date(conv.date),
        messageCount: conv.messages.length,
        preview: conv.preview,
        date: conv.date,
        messages: conv.messages
      }));
      setConversations(formatted);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteConv(id);
      loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleLoad = (id: string) => {
    try {
      const conv = getConversation(id);
      if (conv && conv.messages && onLoadConversation) {
        onLoadConversation(conv.messages, id);
        setShowHistory(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleNew = () => {
    if (onNewConversation) {
      onNewConversation();
      setShowHistory(false);
      setIsOpen(false);
    }
  };

  // Group conversations by date
  const groupConversationsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      thisWeek: [] as Conversation[],
      older: [] as Conversation[]
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.timestamp);
      const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

      if (convDay.getTime() === today.getTime()) {
        groups.today.push(conv);
      } else if (convDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv);
      } else if (convDay >= thisWeek) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversationsByDate();

  return (
    <div className="relative">
      {/* Settings Button */}
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
        title="Settings"
      >
        <span className="text-lg">⚙️</span>
        <span className="hidden sm:inline">Settings</span>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-2 w-80
          rounded-xl shadow-2xl border-2 overflow-hidden
          ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}
          z-50
        `}>
          {/* Header */}
          <div className={`
            p-4 border-b-2
            ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          `}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="p-4 space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Dark Mode
                </h4>
                <p className="text-xs text-gray-500">Switch between light and dark themes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => onThemeChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Default Education Mode */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Education Mode
                </h4>
                <p className="text-xs text-gray-500">Teaching style by default</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={educationMode}
                  onChange={(e) => onEducationChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Divider */}
            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Export & Email Actions - Only show when messages exist */}
            {messages && messages.length > 0 && (
              <>
                {/* Export Conversation */}
                {onExport && (
                  <button
                    onClick={() => { onExport(); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <span className="text-lg">📥</span>
                    <div className="text-left flex-1">
                      <h4 className={`font-semibold text-sm`}>
                        Export Conversation
                      </h4>
                      <p className="text-xs text-gray-500">Download chat as PDF or text</p>
                    </div>
                  </button>
                )}

                {/* Email Generator */}
                {onEmailGenerate && (
                  <button
                    onClick={() => { onEmailGenerate(); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <span className="text-lg">✉️</span>
                    <div className="text-left flex-1">
                      <h4 className={`font-semibold text-sm`}>
                        Generate Email
                      </h4>
                      <p className="text-xs text-gray-500">Create professional emails</p>
                    </div>
                  </button>
                )}

                {/* Divider */}
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
              </>
            )}

            {/* Divider */}
            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Conversation History Section */}
            {onLoadConversation && onNewConversation && (
              <>
                <div>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <div className="text-left">
                        <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Conversation History
                        </h4>
                        <p className="text-xs text-gray-500">
                          {conversations.length} saved {conversations.length === 1 ? 'conversation' : 'conversations'}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">{showHistory ? '▲' : '▼'}</span>
                  </button>

                  {/* History Dropdown */}
                  {showHistory && (
                    <div className={`mt-2 max-h-64 overflow-y-auto rounded-lg border ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {/* New Conversation Button */}
                      <div className="p-2 sticky top-0 bg-inherit border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
                        <button
                          onClick={handleNew}
                          className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:from-red-700 hover:to-red-800 transition-all"
                        >
                          + New Conversation
                        </button>
                      </div>

                      {/* Conversation List */}
                      <div className="p-2">
                        {conversations.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              No saved conversations yet
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Today */}
                            {groupedConversations.today.length > 0 && (
                              <div className="mb-3">
                                <h4 className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  Today
                                </h4>
                                {groupedConversations.today.map((conv) => (
                                  <ConversationItem
                                    key={conv.id}
                                    conv={conv}
                                    currentConversationId={currentConversationId}
                                    isDarkMode={isDarkMode}
                                    onLoad={handleLoad}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Yesterday */}
                            {groupedConversations.yesterday.length > 0 && (
                              <div className="mb-3">
                                <h4 className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  Yesterday
                                </h4>
                                {groupedConversations.yesterday.map((conv) => (
                                  <ConversationItem
                                    key={conv.id}
                                    conv={conv}
                                    currentConversationId={currentConversationId}
                                    isDarkMode={isDarkMode}
                                    onLoad={handleLoad}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </div>
                            )}

                            {/* This Week */}
                            {groupedConversations.thisWeek.length > 0 && (
                              <div className="mb-3">
                                <h4 className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  This Week
                                </h4>
                                {groupedConversations.thisWeek.map((conv) => (
                                  <ConversationItem
                                    key={conv.id}
                                    conv={conv}
                                    currentConversationId={currentConversationId}
                                    isDarkMode={isDarkMode}
                                    onLoad={handleLoad}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Older */}
                            {groupedConversations.older.length > 0 && (
                              <div className="mb-3">
                                <h4 className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  Older
                                </h4>
                                {groupedConversations.older.map((conv) => (
                                  <ConversationItem
                                    key={conv.id}
                                    conv={conv}
                                    currentConversationId={currentConversationId}
                                    isDarkMode={isDarkMode}
                                    onLoad={handleLoad}
                                    onDelete={handleDelete}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
              </>
            )}


            {/* Version Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Susan 21 v1.0.0
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Powered by You
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Conversation Item Component
function ConversationItem({
  conv,
  currentConversationId,
  isDarkMode,
  onLoad,
  onDelete
}: {
  conv: Conversation;
  currentConversationId?: string;
  isDarkMode: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`
        group relative p-2 mb-2 rounded-lg cursor-pointer
        transition-all duration-200
        ${conv.id === currentConversationId
          ? 'bg-amber-100 border-2 border-amber-500'
          : isDarkMode
          ? 'bg-gray-800 hover:bg-gray-700'
          : 'bg-gray-50 hover:bg-gray-100'
        }
      `}
      onClick={() => onLoad(conv.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`
            font-semibold text-xs mb-1 truncate
            ${conv.id === currentConversationId
              ? 'text-amber-700'
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
            <span>{conv.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conv.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm transition-opacity"
          title="Delete conversation"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
