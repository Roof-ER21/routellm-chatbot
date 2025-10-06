'use client';

/**
 * InsuranceDetailPopup Component
 *
 * Shows comprehensive insurance company details with Susan AI chat and insurance knowledge base
 * Tabbed interface: Company Info | Insurance Knowledge | Susan Chat
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
  const [activeTab, setActiveTab] = useState<'company' | 'knowledge' | 'susan'>('company');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && company) {
      // Initialize with Susan's greeting
      const greeting: Message = {
        role: 'assistant',
        content: `Hello! I'm here to help you with **${company.name}**.\n\nI have all their contact information, insurance knowledge, and proven strategies. What would you like to know?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
      setActiveTab('company');
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
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

  const knowledgeBase = [
    {
      category: "Building Codes - Double Layer",
      items: [
        {
          title: "Virginia R908.3",
          content: "Roof replacement shall include removal of ALL existing layers down to deck. Exception: Ice barrier membranes may remain."
        },
        {
          title: "Maryland R908.3",
          content: "Roof replacement shall include removal of ALL existing layers down to deck. Double-layer roofs CANNOT be partially replaced."
        },
        {
          title: "Pennsylvania R908.3",
          content: "Roof replacement shall include removal of existing layers down to the roof deck. No exceptions for partial replacement."
        },
        {
          title: "IRC Section 1511.3.1.1",
          content: "Roof recover PROHIBITED when 2+ layers exist. Only legal option is FULL REPLACEMENT with complete tear-off."
        }
      ]
    },
    {
      category: "GAF Manufacturer Requirements",
      items: [
        {
          title: "Creased Shingles",
          content: "GAF confirms creased shingles lose sealant and can't be repaired. Creasing causes sealant strip failure - replacement required."
        },
        {
          title: "Granule Loss",
          content: "Granule loss exposes asphalt mat and accelerates failure. Constitutes functional damage requiring replacement, not cosmetic."
        },
        {
          title: "Wind Lift",
          content: "Wind lift breaks sealant and weakens shingle bond. Reduces resistance to future storms - replacement required."
        },
        {
          title: "Discontinued Shingles",
          content: "Full slope replacement required if shingles discontinued. Repairs with mismatched shingles not permitted per GAF."
        },
        {
          title: "Ridge Caps",
          content: "Ridge caps must be replaced when removed. Reusing voids warranty and fails manufacturer standards."
        },
        {
          title: "Underlayment",
          content: "New underlayment required during reroofing. Reusing voids warranty and leaves roof noncompliant."
        }
      ]
    },
    {
      category: "Maryland Insurance Law",
      items: [
        {
          title: "Matching Requirements (Bulletin 97-1)",
          content: "Insurers must address mismatch through: moving siding, replacing sides, full replacement, or value adjustment."
        },
        {
          title: "Unfair Practices § 27-303",
          content: "Violations: Misrepresenting facts, arbitrary claim refusal, failing to explain denials. Penalties up to $2,500 per violation."
        },
        {
          title: "Bulletin 18-23",
          content: "Mismatch exclusions may apply to roofing. Some insurers offer optional mismatch coverage at additional cost."
        }
      ]
    },
    {
      category: "Common Rebuttals",
      items: [
        {
          title: '"We only pay for damaged shingles"',
          content: "Per R908.3 (VA/MD/PA), roof replacement requires removal of ALL layers to deck. Partial replacement violates code."
        },
        {
          title: '"Double layer can be repaired"',
          content: "IRC 1511.3.1.1: Roof recover PROHIBITED when 2+ layers exist. Code requires complete tear-off."
        },
        {
          title: '"Granule loss is cosmetic"',
          content: "Per GAF: Granule loss exposes asphalt mat, accelerates aging, constitutes functional damage."
        },
        {
          title: '"Discontinued shingles don\'t matter"',
          content: "Per GAF slope requirements: Full slope replacement required. Mixing products voids warranty."
        },
        {
          title: '"Manufacturer guidelines are optional"',
          content: "Manufacturer requirements are enforceable warranty conditions. Ignoring them voids warranty."
        }
      ]
    },
    {
      category: "Quick Reference",
      items: [
        {
          title: "Roof Recover Definition",
          content: "IRC 1511.4: Installing additional covering OVER existing WITHOUT removal. This is NOT replacement."
        },
        {
          title: "Low Slope Code",
          content: "VA R905.2.2: Asphalt shingles only on slopes 2/12 or greater. If 1/12 or less: Flat/Rubber/TPO required."
        },
        {
          title: "Flashing Requirements",
          content: "R703.4: Corrosion-resistant flashing required. Must extend to exterior wall finish surface."
        }
      ]
    }
  ];

  const filteredKnowledge = knowledgeSearch
    ? knowledgeBase.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
          item.content.toLowerCase().includes(knowledgeSearch.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : knowledgeBase;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header with Tabs */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{company.name}</h2>
              {company.responsiveness_score && (
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    company.responsiveness_score >= 9 ? 'bg-green-100 text-green-800' :
                    company.responsiveness_score >= 7 ? 'bg-blue-100 text-blue-800' :
                    company.responsiveness_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {company.responsiveness_score}/10
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'company'
                  ? 'bg-white text-indigo-700'
                  : 'bg-indigo-500 text-white hover:bg-indigo-400'
              }`}
            >
              📋 Company Info
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'knowledge'
                  ? 'bg-white text-indigo-700'
                  : 'bg-indigo-500 text-white hover:bg-indigo-400'
              }`}
            >
              📚 Insurance Knowledge
            </button>
            <button
              onClick={() => setActiveTab('susan')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'susan'
                  ? 'bg-white text-indigo-700'
                  : 'bg-indigo-500 text-white hover:bg-indigo-400'
              }`}
            >
              👁️ Ask Susan
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-800">Contact Information</h3>

                {/* App Name & Website FIRST */}
                {(company.app_name || company.client_login_url) && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    {company.app_name && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📱</span>
                        <span className="text-xl font-bold text-gray-900">{company.app_name}</span>
                      </div>
                    )}
                    <div className="ml-11 space-y-2">
                      {company.client_login_url && (
                        <a
                          href={company.client_login_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 font-medium underline text-base"
                        >
                          🔗 {company.client_login_url.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      )}
                      {company.guest_login_url && (
                        <a
                          href={company.guest_login_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 underline"
                        >
                          🔗 Guest/Quick Pay Portal
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Email SECOND */}
                {company.contact_email && (
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✉️</span>
                      <a href={`mailto:${company.contact_email}`} className="text-lg text-gray-900 hover:text-indigo-600 font-medium">
                        {company.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Phone THIRD */}
                {company.phone && (
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📞</span>
                      <a href={`tel:${company.phone.replace(/[^0-9]/g, '')}`} className="text-xl font-bold text-gray-900 hover:text-indigo-600">
                        {company.phone}
                      </a>
                    </div>
                    {company.phone_instructions && (
                      <div className="ml-8 bg-blue-50 px-3 py-2 rounded border border-blue-200 mt-2">
                        <span className="font-semibold text-blue-700">Shortcut:</span>
                        <span className="ml-2 text-gray-700">{company.phone_instructions}</span>
                      </div>
                    )}
                    {company.best_call_times && (
                      <div className="ml-8 mt-2 text-green-700 font-medium">
                        ⏰ {company.best_call_times}
                      </div>
                    )}
                    {company.avg_hold_time_minutes && (
                      <div className="ml-8 mt-1 text-gray-600">
                        ⏱️ Avg hold: {company.avg_hold_time_minutes} min
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Intelligence */}
              {(company.current_delays || company.proven_workarounds || company.alternative_channels) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">Intelligence & Workarounds</h3>

                  {company.current_delays && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                      <div className="font-bold text-yellow-800 mb-2">⚠️ Current Delays</div>
                      <div className="text-gray-800">{company.current_delays}</div>
                    </div>
                  )}

                  {company.proven_workarounds && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="font-bold text-green-800 mb-2">💡 Proven Workarounds</div>
                      <div className="text-gray-800">{company.proven_workarounds}</div>
                    </div>
                  )}

                  {company.alternative_channels && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                      <div className="font-bold text-blue-800 mb-2">📡 Alternative Channels</div>
                      <div className="text-gray-800">{company.alternative_channels}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Escalation */}
              {(company.social_escalation || company.executive_escalation) && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">Escalation Options</h3>

                  {company.social_escalation && (
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                      <div className="font-bold text-purple-800 mb-2">🐦 Social Media Escalation</div>
                      <div className="text-gray-800">{company.social_escalation}</div>
                    </div>
                  )}

                  {company.executive_escalation && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="font-bold text-red-800 mb-2">👔 Executive Contacts</div>
                      <div className="text-gray-800">{company.executive_escalation}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Insurance Knowledge Tab */}
          {activeTab === 'knowledge' && (
            <div className="p-6">
              <div className="mb-6">
                <input
                  type="text"
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  placeholder="Search insurance codes, GAF requirements, rebuttals..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-6">
                {filteredKnowledge.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-indigo-600">▶</span>
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition-all">
                          <div className="font-semibold text-gray-900 mb-2">{item.title}</div>
                          <div className="text-gray-700 text-sm">{item.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredKnowledge.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🔍</div>
                    <p>No knowledge found matching "{knowledgeSearch}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Susan Chat Tab */}
          {activeTab === 'susan' && (
            <div className="flex flex-col h-full">
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
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center flex-shrink-0 text-sm">
                              👁️
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-indigo-100' : 'text-gray-500'}`}>
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
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-sm">
                            👁️
                          </div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                    placeholder="Ask Susan about codes, strategies, escalation..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md"
                  >
                    {isLoading ? '...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
