/**
 * ConversationHistory Component
 * Dropdown for managing conversation history with auth integration
 *
 * Features:
 * - View all saved conversations
 * - Load previous conversations
 * - Delete old conversations
 * - New conversation button
 * - Per-user conversation storage
 * - Grouped by date (Today, Yesterday, This Week, Older)
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

export interface ConversationHistoryProps {
  onLoadConversation: (messages: any[], conversationId: string) => void;
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
    // Load conversation history from auth system
    loadConversations();
  }, []);

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
      loadConversations(); // Reload to update UI
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleLoad = (id: string) => {
    try {
      const conv = getConversation(id);
      if (conv && conv.messages) {
        onLoadConversation(conv.messages, id);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleNew = () => {
    onNewConversation();
    setIsOpen(false);
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

          {/* Conversation List - Grouped by Date */}
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No saved conversations yet
                </p>
              </div>
            ) : (
              <>
                {/* Today */}
                {groupedConversations.today.length > 0 && (
                  <div className="mb-4">
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
                  <div className="mb-4">
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
                  <div className="mb-4">
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
                  <div className="mb-4">
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
        group relative p-3 mb-2 rounded-lg cursor-pointer
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
            font-semibold text-sm mb-1 truncate
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
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-lg transition-opacity"
          title="Delete conversation"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
