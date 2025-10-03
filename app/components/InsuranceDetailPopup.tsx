'use client';

/**
 * InsuranceDetailPopup Component
 *
 * Shows comprehensive insurance company details with Susan AI chat
 * Similar to email generator flow - opens after company selection
 */

import { useState, useRef, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  contact_email: string;
  phone?: string;
  phone_instructions?: string;
  email?: string;
  app_name?: string;
  client_login_url?: string;
  guest_login_url?: string;
  portal_notes?: string;
  best_call_times?: string;
  current_delays?: string;
  proven_workarounds?: string;
  alternative_channels?: string;
  social_escalation?: string;
  executive_escalation?: string;
  naic_complaint_index?: number;
  bbb_rating?: string;
  avg_hold_time_minutes?: number;
  responsiveness_score?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface InsuranceDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  repName: string;
  sessionId?: number;
}

export default function InsuranceDetailPopup({
  isOpen,
  onClose,
  company,
  repName,
  sessionId,
}: InsuranceDetailPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && company) {
      // Initialize with Susan's greeting
      const greeting: Message = {
        role: 'assistant',
        content: `Hello! I'm here to help you with **${company.name}**.\n\nI have all their contact information, best call times, and proven strategies for working with them. What would you like to know?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, company]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !company) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create context-rich message for Susan about this insurance company
      const contextMessage = `Context: Rep ${repName} is asking about insurance company "${company.name}".

Company Details:
- Phone: ${company.phone || 'N/A'}
- Email: ${company.contact_email || 'N/A'}
${company.phone_instructions ? `- Phone Shortcut: ${company.phone_instructions}` : ''}
${company.best_call_times ? `- Best Call Times: ${company.best_call_times}` : ''}
${company.app_name ? `- Mobile App: ${company.app_name}` : ''}
${company.client_login_url ? `- Login Portal: ${company.client_login_url}` : ''}
${company.responsiveness_score ? `- Responsiveness Score: ${company.responsiveness_score}/10` : ''}
${company.avg_hold_time_minutes ? `- Avg Hold Time: ${company.avg_hold_time_minutes} minutes` : ''}
${company.current_delays ? `- Current Delays: ${company.current_delays}` : ''}
${company.proven_workarounds ? `- Proven Workarounds: ${company.proven_workarounds}` : ''}
${company.alternative_channels ? `- Alternative Channels: ${company.alternative_channels}` : ''}

Rep's Question: ${input.trim()}

Please provide helpful, specific guidance for working with this insurance company.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.role === 'user' && messages.length === 1 ? contextMessage : m.content,
          })),
          repName,
          sessionId,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex">
        {/* Left Side - Company Details */}
        <div className="w-2/5 bg-gradient-to-b from-indigo-50 to-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                {company.responsiveness_score && (
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    company.responsiveness_score >= 9 ? 'bg-green-100 text-green-800' :
                    company.responsiveness_score >= 7 ? 'bg-blue-100 text-blue-800' :
                    company.responsiveness_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {company.responsiveness_score}/10
                  </div>
                )}
              </div>
              {company.bbb_rating && (
                <div className="text-sm text-gray-600">BBB Rating: <span className="font-semibold">{company.bbb_rating}</span></div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Contact Info</h3>

              {company.phone && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-indigo-600">📞</span>
                    <a href={`tel:${company.phone.replace(/[^0-9]/g, '')}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                      {company.phone}
                    </a>
                  </div>
                  {company.phone_instructions && (
                    <div className="ml-6 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 mt-1">
                      <span className="font-semibold">Shortcut:</span> {company.phone_instructions}
                    </div>
                  )}
                  {company.best_call_times && (
                    <div className="ml-6 text-xs text-green-700 mt-1">
                      ⏰ {company.best_call_times}
                    </div>
                  )}
                  {company.avg_hold_time_minutes && (
                    <div className="ml-6 text-xs text-gray-600 mt-1">
                      ⏱️ Avg hold: {company.avg_hold_time_minutes} min
                    </div>
                  )}
                </div>
              )}

              {company.contact_email && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">✉️</span>
                    <a href={`mailto:${company.contact_email}`} className="text-gray-900 hover:text-indigo-600 text-sm">
                      {company.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {(company.app_name || company.client_login_url) && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  {company.app_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-indigo-600">📱</span>
                      <span className="font-semibold text-gray-900">{company.app_name}</span>
                    </div>
                  )}
                  {company.client_login_url && (
                    <div className="ml-6">
                      <a
                        href={company.client_login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        🔗 Client Login Portal
                      </a>
                    </div>
                  )}
                  {company.guest_login_url && (
                    <div className="ml-6 mt-1">
                      <a
                        href={company.guest_login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        🔗 Guest/Quick Pay
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Intelligence */}
            {(company.current_delays || company.proven_workarounds || company.alternative_channels) && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Intelligence</h3>

                {company.current_delays && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-yellow-800 mb-1">⚠️ Current Delays</div>
                    <div className="text-sm text-yellow-900">{company.current_delays}</div>
                  </div>
                )}

                {company.proven_workarounds && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-green-800 mb-1">💡 Proven Workarounds</div>
                    <div className="text-sm text-green-900">{company.proven_workarounds}</div>
                  </div>
                )}

                {company.alternative_channels && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-800 mb-1">📡 Alternative Channels</div>
                    <div className="text-sm text-blue-900">{company.alternative_channels}</div>
                  </div>
                )}
              </div>
            )}

            {/* Escalation */}
            {(company.social_escalation || company.executive_escalation) && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Escalation</h3>

                {company.social_escalation && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-purple-800 mb-1">🐦 Social Media</div>
                    <div className="text-sm text-purple-900">{company.social_escalation}</div>
                  </div>
                )}

                {company.executive_escalation && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-red-800 mb-1">👔 Executive Contacts</div>
                    <div className="text-sm text-red-900">{company.executive_escalation}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Susan Chat */}
        <div className="w-3/5 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Susan AI Assistant</h3>
                <p className="text-red-100 text-xs">Ask me anything about {company.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0 text-sm">
                          👁️
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-red-100' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm">
                        👁️
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Susan about call times, strategies, escalation..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
