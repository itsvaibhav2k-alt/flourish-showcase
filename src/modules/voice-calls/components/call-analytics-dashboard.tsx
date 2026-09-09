'use client';

import * as React from 'react';
import { Phone, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VoiceCallRecord } from '../schemas/call.schema';

interface CallAnalyticsDashboardProps {
  calls: VoiceCallRecord[];
}

const outcomeLabels: Record<string, string> = {
  connected: 'Connected',
  voicemail_left: 'Voicemail',
  no_answer: 'No Answer',
  busy: 'Busy',
  wrong_number: 'Wrong Number',
  callback_requested: 'Callback',
  declined: 'Declined',
  completed_positive: 'Positive',
  completed_neutral: 'Neutral',
  completed_negative: 'Negative',
};

const outcomeBadgeStyles: Record<string, string> = {
  connected: 'bg-green-50 text-green-700 border-green-200',
  completed_positive: 'bg-green-50 text-green-700 border-green-200',
  completed_neutral: 'bg-blue-50 text-blue-700 border-blue-200',
  completed_negative: 'bg-red-50 text-red-700 border-red-200',
  voicemail_left: 'bg-amber-50 text-amber-700 border-amber-200',
  no_answer: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  busy: 'bg-neutral-50 text-neutral-600 border-neutral-200',
};

const callTypeLabels: Record<string, string> = {
  thank_you: 'Thank You',
  reengagement: 'Re-engagement',
  shift_reminder: 'Shift Reminder',
  cultivation: 'Cultivation',
  campaign_outreach: 'Campaign',
  custom: 'Custom',
};

export function CallAnalyticsDashboard({ calls }: CallAnalyticsDashboardProps) {
  // Filter to this month's calls
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCalls = calls.filter(
    (c) => new Date(c.created_at) >= monthStart,
  );

  // Calculate stats
  const totalCalls = thisMonthCalls.length;
  const totalCost = thisMonthCalls.reduce(
    (sum, c) => sum + (c.estimated_cost || 0),
    0,
  );
  const completedCalls = thisMonthCalls.filter(
    (c) => c.status === 'completed',
  );
  const avgDuration =
    completedCalls.length > 0
      ? completedCalls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) /
        completedCalls.length
      : 0;

  // Outcome distribution
  const outcomeCounts: Record<string, number> = {};
  for (const call of thisMonthCalls) {
    const outcome = call.outcome || 'unknown';
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
  }

  // Call type breakdown
  const typeCounts: Record<string, number> = {};
  for (const call of thisMonthCalls) {
    typeCounts[call.call_type] = (typeCounts[call.call_type] || 0) + 1;
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="shadow-sm border-neutral-200/60 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Calls This Month
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {totalCalls}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center">
                <Phone className="h-4 w-4 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200/60 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Total Cost
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200/60 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Avg Duration
                </p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {formatDuration(avgDuration)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Distribution & Call Type Breakdown */}
      <div className="grid gap-4 grid-cols-2">
        <Card className="shadow-sm border-neutral-200/60 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-neutral-500" />
              Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {Object.keys(outcomeCounts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(outcomeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([outcome, count]) => (
                    <div
                      key={outcome}
                      className="flex items-center justify-between"
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs ${outcomeBadgeStyles[outcome] || 'bg-neutral-50 text-neutral-600 border-neutral-200'}`}
                      >
                        {outcomeLabels[outcome] || outcome}
                      </Badge>
                      <span className="text-sm font-medium text-neutral-700">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                No outcome data yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200/60 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-neutral-500" />
              Call Types
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {Object.keys(typeCounts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(typeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-neutral-600">
                        {callTypeLabels[type] || type}
                      </span>
                      <span className="text-sm font-medium text-neutral-700">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-4">
                No call data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
