'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, X, Paperclip, Mic, CornerDownLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processQuery } from '@/modules/ask-flora/actions/process-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/ui/chat-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const QUICK_ACTIONS = [
  'Show lapsed donors',
  'How many donors do we have?',
  'Who are our top donors?',
  'What can you help me with?',
] as const;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  executionTime?: number;
}

export function AskFloraInput() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isProcessing) return;

    const userQuery = query.trim();
    setQuery('');
    setIsExpanded(true);

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      type: 'user',
      content: userQuery,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await processQuery(userQuery);

      if (response.success && response.result?.data) {
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          type: 'assistant',
          content: response.result.data.summary || 'Here are your results.',
          timestamp: new Date(),
          data: response.result.data,
          executionTime: response.result.executionTime,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: Math.random().toString(36).substring(7),
          type: 'assistant',
          content: response.error || 'I encountered an issue processing your request. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(7),
        type: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: string) => {
    setQuery(action);
    // Trigger submit after state update
    setTimeout(() => {
      const form = inputRef.current?.closest('form');
      form?.requestSubmit();
    }, 0);
  };

  const clearChat = () => {
    setMessages([]);
    setIsExpanded(false);
    setQuery('');
  };

  return (
    <div className="rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-sm relative">
      {/* Settings gear icon */}
      <Link
        href="/flora/settings"
        className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors z-10"
      >
        <Settings className="h-4 w-4" />
      </Link>

      {/* Chat Messages Area */}
      <AnimatePresence>
        {isExpanded && messages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-neutral-100"
          >
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {message.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-neutral-900 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  )}

                  {message.type === 'assistant' && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="relative w-8 h-8">
                          <Image
                            src="/flora-waving.png"
                            alt="Flora"
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                          <div className="absolute -top-0.5 -right-0.5">
                            <Sparkles className="h-2.5 w-2.5 text-neutral-400" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Card className="bg-neutral-50 border-neutral-200">
                          <CardContent className="p-3">
                            <div className="prose prose-sm max-w-none text-neutral-700">
                              {message.content.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                  {line}
                                </p>
                              ))}
                            </div>

                            {/* Show data table for list results */}
                            {message.data?.rows && message.data.rows.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-neutral-200">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b">
                                        {Object.keys(message.data.rows[0])
                                          .filter(k => !k.includes('id') && !k.includes('organization'))
                                          .slice(0, 4)
                                          .map((key) => (
                                            <th key={key} className="text-left py-1 px-2 font-medium text-neutral-600 capitalize">
                                              {key.replace(/_/g, ' ')}
                                            </th>
                                          ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {message.data.rows.slice(0, 5).map((row: any, idx: number) => (
                                        <tr key={idx} className="border-b border-neutral-100">
                                          {Object.entries(row)
                                            .filter(([k]) => !k.includes('id') && !k.includes('organization'))
                                            .slice(0, 4)
                                            .map(([key, value]: [string, any]) => (
                                              <td key={key} className="py-1 px-2 text-neutral-700">
                                                {key.includes('giving') || key.includes('amount')
                                                  ? `$${Number(value || 0).toLocaleString()}`
                                                  : key.includes('date') && value
                                                    ? new Date(value).toLocaleDateString()
                                                    : String(value || '-')}
                                              </td>
                                            ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {message.data.rows.length > 5 && (
                                    <p className="text-xs text-neutral-500 mt-2">
                                      Showing 5 of {message.data.rows.length} results
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Show aggregates */}
                            {message.data?.aggregates && (
                              <div className="mt-3 pt-3 border-t border-neutral-200 flex gap-4">
                                {Object.entries(message.data.aggregates).map(([key, value]: [string, any]) => (
                                  <div key={key} className="text-center">
                                    <p className="text-2xl font-bold text-neutral-900">
                                      {key.includes('amount') || key.includes('total')
                                        ? `$${Number(value).toLocaleString()}`
                                        : Number(value).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-neutral-500 capitalize">
                                      {key.replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        {message.executionTime && (
                          <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600">
                            {message.executionTime}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0">
                    <div className="relative w-8 h-8">
                      <Image
                        src="/flora-waving.png"
                        alt="Flora"
                        width={32}
                        height={32}
                        className="rounded-full object-cover animate-pulse"
                      />
                    </div>
                  </div>
                  <Card className="bg-neutral-50 border-neutral-200">
                    <CardContent className="p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-neutral-600 animate-spin" />
                      <span className="text-sm text-neutral-600">Thinking...</span>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Clear Chat Button */}
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 flex justify-end">
              <button
                onClick={clearChat}
                className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-xl border border-neutral-200 bg-white focus-within:ring-2 focus-within:ring-neutral-400 focus-within:border-transparent p-1 transition-all mx-auto max-w-2xl"
        >
          <ChatInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask Flora anything..."
            disabled={isProcessing}
            className="min-h-12 resize-none rounded-lg bg-white border-0 p-3 shadow-none focus-visible:ring-0 text-base"
          />
          <div className="flex items-center p-3 pt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" type="button" className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100">
                    <Paperclip className="size-4" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach files - Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" type="button" className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100">
                    <Mic className="size-4" />
                    <span className="sr-only">Use Microphone</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voice input - Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">Flora AI</span>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!query.trim() || isProcessing}
                className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Send</span>
                    <CornerDownLeft className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Action Chips - only show when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleQuickAction(action)}
                disabled={isProcessing}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full",
                  "bg-transparent border border-neutral-200",
                  "text-neutral-600",
                  "hover:bg-neutral-50 hover:border-neutral-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors",
                  "cursor-pointer"
                )}
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
