'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { FloraBreadcrumb } from '@/modules/flora/components'
import { SuggestedQueries } from './suggested-queries'
import { QueryResults } from './query-results'
import { processQuery } from '../actions/process-query'
import { Send, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { QueryResultData } from '@/lib/ai/query-parser'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  result?: QueryResultData
  executionTime?: number
  timestamp: Date
}

export function AskFloraPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmitQuery = async (query: string) => {
    if (!query.trim() || isProcessing) return

    const userMessageId = Math.random().toString(36).substring(7)

    // Add user message
    const userMessage: Message = {
      id: userMessageId,
      type: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)

    try {
      // Process the query
      const response = await processQuery(query)

      if (!response.success || !response.result) {
        // Add error message
        const errorMessage: Message = {
          id: Math.random().toString(36).substring(7),
          type: 'error',
          content: response.error || 'Failed to process query',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        return
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        type: 'assistant',
        content: response.result.data?.summary || 'Query completed successfully',
        result: response.result.data,
        executionTime: response.result.executionTime,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing query:', error)
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(7),
        type: 'error',
        content: 'An unexpected error occurred. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      inputRef.current?.focus()
    }
  }

  const handleSelectSuggestedQuery = (query: string) => {
    setInputValue(query)
    inputRef.current?.focus()
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <FloraBreadcrumb currentPage="Ask Flora" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Ask Flora</h1>
            <p className="text-neutral-600 mt-1">
              Query your nonprofit data using natural language
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <SuggestedQueries onSelectQuery={handleSelectSuggestedQuery} />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {message.type === 'user' && (
                    <div className="flex justify-end">
                      <Card className="max-w-2xl bg-primary-600">
                        <CardContent className="p-4">
                          <p className="text-white">{message.content}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {message.type === 'assistant' && (
                    <div className="space-y-3">
                      {message.result && (
                        <QueryResults
                          result={message.result}
                          executionTime={message.executionTime}
                        />
                      )}
                    </div>
                  )}

                  {message.type === 'error' && (
                    <div className="flex justify-start">
                      <Card className="max-w-2xl border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-900 mb-1">
                                Error
                              </p>
                              <p className="text-sm text-red-700">{message.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-start">
                  <Card className="max-w-2xl bg-neutral-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                        <p className="text-neutral-600">Processing your query...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-200 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmitQuery(inputValue)
          }}
          className="relative"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your donors, volunteers, or giving data..."
            disabled={isProcessing}
            className="pr-12 h-12 text-base"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isProcessing}
            className="absolute right-1 top-1 h-10 w-10"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Examples hint */}
        {messages.length > 0 && (
          <div className="mt-3 text-xs text-neutral-500 text-center">
            Try asking: &quot;Show me lapsed donors&quot; or &quot;How much did we raise last month?&quot;
          </div>
        )}
      </div>
    </div>
  )
}
