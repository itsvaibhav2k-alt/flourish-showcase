'use client';

import * as React from 'react';
import {
  Phone,
  Loader2,
  ChevronDown,
  Heart,
  UserCheck,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Sprout,
  Megaphone,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { initiateCall } from '../actions/initiate-call';
import { CALL_TYPE_CONFIG } from '../config/call-types';
import type { VoiceCallType } from '../schemas/call.schema';

const ICON_MAP: Record<string, React.ElementType> = {
  Heart,
  UserCheck,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Sprout,
  Megaphone,
  MessageCircle,
  ClipboardList,
  Phone,
};

const CALL_TYPE_ORDER: VoiceCallType[] = [
  'custom',
  'thank_you',
  'donation_ask',
  'reengagement',
  'cultivation',
  'volunteer_recruitment',
  'shift_reminder',
  'event_invitation',
  'campaign_outreach',
  'follow_up',
  'survey',
];

interface CallButtonProps {
  contactId: string;
  contactPhone: string | null;
  contactName: string;
}

export function CallButton({
  contactId,
  contactPhone,
  contactName,
}: CallButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCall = async (callType: VoiceCallType) => {
    if (!contactPhone) return;

    setIsLoading(true);
    try {
      const config = CALL_TYPE_CONFIG[callType];
      const result = await initiateCall(contactId, callType);

      if (result.success) {
        toast.success(`Calling ${contactName}`, {
          description: `${config.label} call — Flora is dialing now.`,
        });
      } else {
        toast.error('Failed to initiate call', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (error) {
      console.error('Call initiation error:', error);
      toast.error('Failed to initiate call', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !contactPhone || isLoading;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="default"
              onClick={() => handleCall('custom')}
              disabled={isDisabled}
              className="rounded-r-none border-r-0"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="mr-2 h-4 w-4 text-primary-600" />
              )}
              {isLoading ? 'Calling...' : 'Call with Flora'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!contactPhone
              ? 'No phone number on file'
              : 'Quick call — general check-in'}
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={isDisabled}
              className="rounded-l-none px-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {CALL_TYPE_ORDER.map((type, index) => {
              const config = CALL_TYPE_CONFIG[type];
              const Icon = ICON_MAP[config.icon] || Phone;
              return (
                <React.Fragment key={type}>
                  {index === 1 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => handleCall(type)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {config.label}
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">
                      {config.description}
                    </span>
                  </DropdownMenuItem>
                </React.Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
