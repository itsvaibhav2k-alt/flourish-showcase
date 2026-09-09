'use client';

import * as React from 'react';
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { VoiceCallRecord } from '../schemas/call.schema';
import { CallTranscriptViewer } from './call-transcript-viewer';
import { getCallTranscript } from '../queries/get-call-transcript';
import type { CallTranscriptRecord } from '../schemas/call.schema';

interface CallHistoryPanelProps {
  calls: VoiceCallRecord[];
}

const callTypeBadgeStyles: Record<string, string> = {
  thank_you: 'bg-rose-50 text-rose-700 border-rose-200',
  reengagement: 'bg-amber-50 text-amber-700 border-amber-200',
  shift_reminder: 'bg-violet-50 text-violet-700 border-violet-200',
  cultivation: 'bg-blue-50 text-blue-700 border-blue-200',
  campaign_outreach: 'bg-teal-50 text-teal-700 border-teal-200',
  custom: 'bg-neutral-50 text-neutral-700 border-neutral-200',
};

const callTypeLabels: Record<string, string> = {
  thank_you: 'Thank You',
  reengagement: 'Re-engagement',
  shift_reminder: 'Shift Reminder',
  cultivation: 'Cultivation',
  campaign_outreach: 'Campaign',
  custom: 'Custom',
};

const sentimentColors: Record<string, string> = {
  very_positive: 'bg-green-500',
  positive: 'bg-green-400',
  neutral: 'bg-neutral-400',
  negative: 'bg-amber-500',
  very_negative: 'bg-red-500',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <Phone className="h-4 w-4 text-green-600" />;
    case 'no_answer':
    case 'busy':
      return <PhoneMissed className="h-4 w-4 text-amber-500" />;
    case 'failed':
    case 'cancelled':
      return <PhoneOff className="h-4 w-4 text-red-500" />;
    case 'scheduled':
    case 'queued':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Phone className="h-4 w-4 text-neutral-400" />;
  }
}

function CallHistoryItem({ call }: { call: VoiceCallRecord }) {
  const [expanded, setExpanded] = React.useState(false);
  const [transcript, setTranscript] = React.useState<CallTranscriptRecord | null>(null);
  const [loadingTranscript, setLoadingTranscript] = React.useState(false);

  const handleExpand = async () => {
    if (!expanded && !transcript && call.status === 'completed') {
      setLoadingTranscript(true);
      try {
        const data = await getCallTranscript(call.id);
        setTranscript(data);
      } catch (error) {
        console.error('Failed to load transcript:', error);
      } finally {
        setLoadingTranscript(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div className="border border-neutral-100 rounded-lg bg-neutral-50/50">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white border border-neutral-100 flex items-center justify-center">
            {getStatusIcon(call.status)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs ${callTypeBadgeStyles[call.call_type] || callTypeBadgeStyles.custom}`}
              >
                {callTypeLabels[call.call_type] || call.call_type}
              </Badge>
              {call.outcome && (
                <span className="text-xs text-neutral-500 capitalize">
                  {call.outcome.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-neutral-500">
                {formatTimestamp(call.created_at)}
              </span>
              {call.duration_seconds != null && call.duration_seconds > 0 && (
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(call.duration_seconds)}
                </span>
              )}
              {call.sentiment && (
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${sentimentColors[call.sentiment] || sentimentColors.neutral}`}
                  />
                  <span className="text-xs text-neutral-500 capitalize">
                    {call.sentiment.replace(/_/g, ' ')}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {call.status === 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-8 text-xs text-neutral-500"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Transcript
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 ml-1" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            )}
          </Button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 p-3">
          {loadingTranscript ? (
            <p className="text-sm text-neutral-500 text-center py-4">
              Loading transcript...
            </p>
          ) : transcript ? (
            <CallTranscriptViewer transcript={transcript} />
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">
              No transcript available
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CallHistoryPanel({ calls }: CallHistoryPanelProps) {
  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-3">
          <Phone className="h-6 w-6 text-primary-400" />
        </div>
        <p className="text-sm text-neutral-500">No calls recorded yet</p>
        <p className="text-xs text-neutral-400 mt-1">
          Use the &quot;Call with Flora&quot; button to start a conversation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <CallHistoryItem key={call.id} call={call} />
      ))}
    </div>
  );
}
