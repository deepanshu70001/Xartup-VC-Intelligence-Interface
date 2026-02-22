import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Building2, CheckCircle2, SendHorizontal, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Primitives';
import { useApp } from '../context/AppContext';
import { buildApiUrl, getAuthHeaders, parseApiResponse } from '../lib/api';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

interface ScoutChatResponse {
  reply: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'Rank my top 10 companies by thesis fit and explain why.',
  'Which 5 companies should I prioritize for outreach this week?',
  'Create a 3-step diligence checklist for frontier AI infra startups.',
];

function normalizeAssistantText(text: string) {
  return text
    .replace(/\s+(\d+\.\s+\*\*)/g, '\n$1')
    .replace(/\s+(\d+\.\s+)/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export default function ScoutAssistantPage() {
  const { companies, thesis } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => companies.slice(0, 5).map((c) => c.id));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'I am Scout. Ask me to rank pipeline companies, spot thesis matches, or generate diligence plans.',
      createdAt: Date.now(),
    },
  ]);

  const selectedCompanies = useMemo(() => {
    return companies.filter((c) => selectedIds.includes(c.id)).slice(0, 10);
  }, [companies, selectedIds]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const toggleCompany = (companyId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId);
      }
      if (prev.length >= 10) {
        toast.info('You can select up to 10 context companies.');
        return prev;
      }
      return [...prev, companyId];
    });
  };

  const askScout = async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? input).trim();
    if (!prompt) return;
    if (selectedCompanies.length === 0) {
      toast.error('Select at least one context company.');
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!rawPrompt) setInput('');
    setIsSending(true);

    try {
      const response = await fetch(buildApiUrl('/api/chat'), {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          message: prompt,
          thesis,
          companies: selectedCompanies.map((c) => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            stage: c.stage,
            location: c.location,
            employee_count: c.employee_count,
            total_funding: c.total_funding || 'Unknown',
            tags: c.tags,
            description: c.description,
            enrichment: c.enrichment
              ? {
                  summary: c.enrichment.summary,
                  keywords: c.enrichment.keywords,
                  derived_signals: c.enrichment.derived_signals,
                }
              : null,
          })),
        }),
      });

      const data = await parseApiResponse<ScoutChatResponse & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error || 'Scout request failed');
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to talk to Scout');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Bot className="text-indigo-600 dark:text-indigo-400" size={28} />
            Scout Assistant
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-lg">
            Thesis-aware copilot for sourcing, ranking, and diligence.
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          {selectedCompanies.length} companies in context
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="space-y-2 mb-4">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => askScout(prompt)}
                className="block w-full sm:w-fit text-left px-3 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Sparkles size={14} className="inline mr-2 text-neutral-500" />
                {prompt}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-4 flex flex-col h-[clamp(360px,58vh,620px)]">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col justify-end">
              {messages.length <= 1 && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-300">
                  Tip: ask for ranked shortlists, thesis-fit explanations, or a diligence plan tailored to your selected context companies.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'ml-auto bg-indigo-600 text-white'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-100'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-2 whitespace-pre-wrap break-words">
                      {normalizeAssistantText(message.content)
                        .split('\n')
                        .map((line, idx) => (
                          <p key={idx}>{renderInlineBold(line)}</p>
                        ))}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="max-w-[92%] rounded-xl px-4 py-3 text-sm bg-neutral-900 border border-neutral-800 text-neutral-300">
                  Scout is thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void askScout();
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Scout to rank, compare, or draft a diligence plan..."
                className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <Button type="submit" disabled={isSending || !input.trim()}>
                <SendHorizontal size={16} className="mr-2" />
                Send
              </Button>
            </form>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm xl:sticky xl:top-20 h-fit">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Context Companies</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 mb-4">
            Select the companies Scout should use for analysis.
          </p>

          {companies.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-sm text-neutral-500 dark:text-neutral-400">
              Add companies first, then return here to run thesis-aware chat analysis.
            </div>
          )}

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {companies.map((company) => {
              const selected = selectedIds.includes(company.id);
              return (
                <button
                  key={company.id}
                  onClick={() => toggleCompany(company.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400/60'
                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <div className="font-semibold text-neutral-900 dark:text-white flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                    <Building2 size={16} className="text-neutral-500" />
                    <span className="truncate">{company.name}</span>
                    </span>
                    {selected && <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0" />}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {company.industry} - {company.stage} - {company.location}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
