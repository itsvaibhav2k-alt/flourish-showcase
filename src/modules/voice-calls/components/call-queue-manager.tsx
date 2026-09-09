'use client';

import * as React from 'react';
import {
  Play,
  Pause,
  XCircle,
  Phone,
  PhoneOff,
  PhoneMissed,
  Voicemail,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CALL_TYPE_CONFIG } from '../config/call-types';
import type { VoiceCallType } from '../schemas/call.schema';
import {
  startCallQueue,
  pauseCallQueue,
  cancelCallQueue,
} from '../actions/manage-call-queue';

interface CallQueue {
  id: string;
  name: string;
  call_type: string;
  status: string;
  total_contacts: number;
  calls_completed: number;
  calls_connected: number;
  current_index: number;
  stop_condition: { type?: string; value?: number } | null;
  max_retries: number;
  created_at: string;
}

interface CallQueueManagerProps {
  queues: CallQueue[];
  onRefresh?: () => void;
}

const statusBadgeStyles: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function getOutcomeCounts(queue: CallQueue) {
  const { calls_completed, calls_connected, total_contacts } = queue;
  const notConnected = calls_completed - calls_connected;
  const remaining = total_contacts - calls_completed;

  return { connected: calls_connected, notConnected, remaining };
}

export function CallQueueManager({ queues, onRefresh }: CallQueueManagerProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  async function handleStart(queueId: string) {
    setLoadingAction(`start-${queueId}`);
    try {
      await startCallQueue(queueId);
      onRefresh?.();
    } finally {
      setLoadingAction(null);
    }
  }

  async function handlePause(queueId: string) {
    setLoadingAction(`pause-${queueId}`);
    try {
      await pauseCallQueue(queueId);
      onRefresh?.();
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCancel(queueId: string) {
    setLoadingAction(`cancel-${queueId}`);
    try {
      await cancelCallQueue(queueId);
      onRefresh?.();
    } finally {
      setLoadingAction(null);
    }
  }

  if (!queues.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-neutral-500">
          <Phone className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
          <p>No call queues yet.</p>
          <p className="text-sm">Create a queue to start making calls with Flora.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {queues.map((queue) => {
        const config = CALL_TYPE_CONFIG[queue.call_type as VoiceCallType];
        const counts = getOutcomeCounts(queue);
        const progressPercent = queue.total_contacts > 0
          ? Math.round((queue.calls_completed / queue.total_contacts) * 100)
          : 0;

        return (
          <Card key={queue.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{queue.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className={statusBadgeStyles[queue.status] ?? ''}
                  >
                    {queue.status === 'in_progress' && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    {statusLabels[queue.status] ?? queue.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {(queue.status === 'pending' || queue.status === 'paused') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStart(queue.id)}
                      disabled={loadingAction !== null}
                    >
                      {loadingAction === `start-${queue.id}` ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="mr-1 h-3.5 w-3.5" />
                      )}
                      Start
                    </Button>
                  )}
                  {queue.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(queue.id)}
                      disabled={loadingAction !== null}
                    >
                      {loadingAction === `pause-${queue.id}` ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pause className="mr-1 h-3.5 w-3.5" />
                      )}
                      Pause
                    </Button>
                  )}
                  {(queue.status === 'pending' || queue.status === 'in_progress' || queue.status === 'paused') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleCancel(queue.id)}
                      disabled={loadingAction !== null}
                    >
                      {loadingAction === `cancel-${queue.id}` ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                      )}
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>{config?.label ?? queue.call_type}</span>
                <span>-</span>
                <span>{queue.total_contacts} contacts</span>
                {queue.stop_condition?.type === 'count' && (
                  <>
                    <span>-</span>
                    <span>Stop after {queue.stop_condition.value} connections</span>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Progress</span>
                  <span className="font-medium">
                    {queue.calls_completed} / {queue.total_contacts} ({progressPercent}%)
                  </span>
                </div>
                <Progress value={queue.calls_completed} max={queue.total_contacts} />
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{counts.connected} connected</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <PhoneMissed className="h-3.5 w-3.5" />
                  <span>{counts.notConnected} not reached</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{counts.remaining} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
