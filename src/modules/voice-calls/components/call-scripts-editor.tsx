'use client';

import * as React from 'react';
import {
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
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CALL_TYPE_CONFIG } from '../config/call-types';
import type { VoiceCallConfig, CallTypeOverride } from '../queries/get-voice-config';

interface CallScriptsEditorProps {
  config: VoiceCallConfig;
  onChange: (config: VoiceCallConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
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

export function CallScriptsEditor({
  config,
  onChange,
  onSave,
  isSaving,
}: CallScriptsEditorProps) {
  const getOverride = (callType: string): CallTypeOverride => {
    return config.callTypeOverrides[callType] || { additionalNotes: '', customScript: null };
  };

  const updateOverride = (callType: string, updates: Partial<CallTypeOverride>) => {
    const current = getOverride(callType);
    onChange({
      ...config,
      callTypeOverrides: {
        ...config.callTypeOverrides,
        [callType]: { ...current, ...updates },
      },
    });
  };

  const resetOverride = (callType: string) => {
    const updated = { ...config.callTypeOverrides };
    delete updated[callType];
    onChange({
      ...config,
      callTypeOverrides: updated,
    });
  };

  const callTypes = Object.entries(CALL_TYPE_CONFIG) as [string, typeof CALL_TYPE_CONFIG[keyof typeof CALL_TYPE_CONFIG]][];

  return (
    <div className="space-y-6 pt-4">
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Call Type Scripts
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Customize Flora&apos;s behavior for each call type. Add notes to the default
            script or replace it entirely with a custom script.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {callTypes.map(([callType, typeConfig]) => {
              const Icon = ICON_MAP[typeConfig.icon] || Phone;
              const override = getOverride(callType);
              const hasCustomScript = override.customScript !== null;
              const hasChanges = override.additionalNotes || override.customScript !== null;

              return (
                <AccordionItem key={callType} value={callType} className="border-neutral-200/60">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-neutral-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            {typeConfig.label}
                          </span>
                          {hasChanges && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700">
                              Customized
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {typeConfig.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pb-2">
                      {/* Default Script (read-only) */}
                      <div>
                        <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Default Script
                        </Label>
                        <div className="mt-1.5 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                          <pre className="text-xs text-neutral-600 font-mono whitespace-pre-wrap leading-relaxed">
                            {typeConfig.floraInstructions}
                          </pre>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div>
                        <Label
                          htmlFor={`notes-${callType}`}
                          className="text-xs font-medium text-neutral-700"
                        >
                          Additional Notes
                        </Label>
                        <Textarea
                          id={`notes-${callType}`}
                          value={override.additionalNotes}
                          onChange={(e) =>
                            updateOverride(callType, { additionalNotes: e.target.value })
                          }
                          placeholder="Add custom instructions for this call type..."
                          rows={3}
                          className="mt-1.5"
                        />
                        <p className="text-xs text-neutral-400 mt-1">
                          These notes will be appended to the default script.
                        </p>
                      </div>

                      {/* Custom Script Toggle */}
                      <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                        <div>
                          <Label
                            htmlFor={`custom-${callType}`}
                            className="text-sm font-medium text-neutral-700 cursor-pointer"
                          >
                            Use Custom Script
                          </Label>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Replace the default script with your own instructions
                          </p>
                        </div>
                        <Switch
                          id={`custom-${callType}`}
                          checked={hasCustomScript}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateOverride(callType, {
                                customScript: typeConfig.floraInstructions,
                              });
                            } else {
                              updateOverride(callType, { customScript: null });
                            }
                          }}
                        />
                      </div>

                      {/* Custom Script Editor */}
                      {hasCustomScript && (
                        <div>
                          <Label
                            htmlFor={`script-${callType}`}
                            className="text-xs font-medium text-neutral-700"
                          >
                            Custom Script
                          </Label>
                          <Textarea
                            id={`script-${callType}`}
                            value={override.customScript || ''}
                            onChange={(e) =>
                              updateOverride(callType, { customScript: e.target.value })
                            }
                            rows={12}
                            className="mt-1.5 font-mono text-sm"
                          />
                          <p className="text-xs text-neutral-400 mt-1">
                            This script completely replaces the default. Use{' '}
                            <code className="px-1 py-0.5 bg-neutral-100 rounded text-[10px]">
                              {'{{org_name}}'}
                            </code>{' '}
                            as a placeholder for your organization name.
                          </p>
                        </div>
                      )}

                      {/* Reset Button */}
                      {hasChanges && (
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetOverride(callType)}
                            className="text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset to Default
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
