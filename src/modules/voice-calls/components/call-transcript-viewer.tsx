'use client';

import * as React from 'react';
import { Bot, User, Tag, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CallTranscriptRecord } from '../schemas/call.schema';

interface CallTranscriptViewerProps {
  transcript: CallTranscriptRecord;
}

function formatTime(timestamp: number): string {
  const mins = Math.floor(timestamp / 60);
  const secs = Math.floor(timestamp % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CallTranscriptViewer({ transcript }: CallTranscriptViewerProps) {
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {(transcript.summary || transcript.key_topics.length > 0 || transcript.action_items.length > 0) && (
        <Card className="border-neutral-100 bg-white shadow-sm">
          <CardContent className="p-3 space-y-3">
            {transcript.summary && (
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                  Summary
                </p>
                <p className="text-sm text-neutral-700">{transcript.summary}</p>
              </div>
            )}

            {transcript.key_topics.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Key Topics
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {transcript.key_topics.map((topic, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {transcript.action_items.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" />
                  Action Items
                </p>
                <ul className="space-y-1">
                  {transcript.action_items.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs text-neutral-600 flex items-start gap-1.5"
                    >
                      <span className="text-primary-500 mt-0.5">-</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transcript Messages */}
      <div className="space-y-2">
        {transcript.transcript.map((turn, i) => {
          const isAgent = turn.role === 'agent';
          return (
            <div
              key={i}
              className={`flex gap-2 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5 text-primary-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isAgent
                    ? 'bg-primary-50 border border-primary-100'
                    : 'bg-neutral-100 border border-neutral-200'
                }`}
              >
                <p className="text-sm text-neutral-800">{turn.content}</p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {formatTime(turn.timestamp)}
                </p>
              </div>
              {!isAgent && (
                <div className="h-6 w-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-3.5 w-3.5 text-neutral-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
