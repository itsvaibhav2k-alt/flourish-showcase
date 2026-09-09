'use client';

import * as React from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RetellWebClient } from 'retell-client-js-sdk';

type CallStatus = 'connecting' | 'connected' | 'ended' | 'error';

interface WebCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  contactName: string;
  callId: string;
}

export function WebCallDialog({
  open,
  onOpenChange,
  accessToken,
  contactName,
  callId,
}: WebCallDialogProps) {
  const [callStatus, setCallStatus] = React.useState<CallStatus>('connecting');
  const [isMuted, setIsMuted] = React.useState(false);
  const [isAgentTalking, setIsAgentTalking] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const clientRef = React.useRef<RetellWebClient | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!open || !accessToken) return;

    const client = new RetellWebClient();
    clientRef.current = client;

    client.on('call_started', () => {
      setCallStatus('connected');
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    });

    client.on('call_ended', () => {
      setCallStatus('ended');
      if (timerRef.current) clearInterval(timerRef.current);
    });

    client.on('agent_start_talking', () => {
      setIsAgentTalking(true);
    });

    client.on('agent_stop_talking', () => {
      setIsAgentTalking(false);
    });

    client.on('error', (error: unknown) => {
      console.error('Retell call error:', error);
      setCallStatus('error');
      if (timerRef.current) clearInterval(timerRef.current);
    });

    client.startCall({ accessToken }).catch((err: unknown) => {
      console.error('Failed to start call:', err);
      setCallStatus('error');
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.stopCall();
        clientRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, accessToken]);

  const handleHangUp = () => {
    if (clientRef.current) {
      clientRef.current.stopCall();
    }
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleMute = () => {
    if (!clientRef.current) return;
    if (isMuted) {
      clientRef.current.unmute();
    } else {
      clientRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleClose = () => {
    if (callStatus === 'connected' || callStatus === 'connecting') {
      handleHangUp();
    }
    setCallStatus('connecting');
    setDuration(0);
    setIsMuted(false);
    setIsAgentTalking(false);
    onOpenChange(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && `Call with ${contactName}`}
            {callStatus === 'ended' && 'Call Ended'}
            {callStatus === 'error' && 'Call Failed'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Call status indicator */}
          <div className="relative flex items-center justify-center">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                callStatus === 'connected'
                  ? isAgentTalking
                    ? 'bg-primary-100 ring-4 ring-primary-300 ring-opacity-50'
                    : 'bg-primary-50'
                  : callStatus === 'connecting'
                    ? 'bg-amber-50 animate-pulse'
                    : callStatus === 'error'
                      ? 'bg-red-50'
                      : 'bg-gray-100'
              }`}
            >
              <Phone
                className={`h-10 w-10 ${
                  callStatus === 'connected'
                    ? 'text-primary-600'
                    : callStatus === 'connecting'
                      ? 'text-amber-600'
                      : callStatus === 'error'
                        ? 'text-red-600'
                        : 'text-gray-400'
                }`}
              />
            </div>
          </div>

          {/* Flora speaking indicator */}
          {callStatus === 'connected' && (
            <p className="text-sm text-muted-foreground">
              {isAgentTalking ? 'Flora is speaking...' : 'Flora is listening...'}
            </p>
          )}

          {/* Duration */}
          {(callStatus === 'connected' || callStatus === 'ended') && (
            <p className="text-2xl font-mono tabular-nums text-foreground">
              {formatDuration(duration)}
            </p>
          )}

          {callStatus === 'error' && (
            <p className="text-sm text-red-600">
              Failed to connect the call. Please try again.
            </p>
          )}

          {/* Call controls */}
          {callStatus === 'connected' && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5 text-red-600" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleHangUp}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* Close button for ended/error states */}
          {(callStatus === 'ended' || callStatus === 'error') && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
