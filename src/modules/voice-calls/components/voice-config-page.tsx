'use client';

import * as React from 'react';
import { Building2, Phone, FileText, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AISettings } from '@/modules/settings/queries/get-ai-settings';
import type { VoiceCallConfig } from '../queries/get-voice-config';
import { updateVoiceCallConfig } from '../actions/update-voice-config';
import { OrgKnowledgeEditor } from './org-knowledge-editor';
import { CallBehaviorEditor } from './call-behavior-editor';
import { CallScriptsEditor } from './call-scripts-editor';

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.substring(1, 4);
    const prefix = digits.substring(4, 7);
    const line = digits.substring(7);
    return `+1 (${area}) ${prefix}-${line}`;
  }
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  return phone;
}

interface VoiceConfigPageProps {
  initialSettings: AISettings;
  initialConfig: VoiceCallConfig;
  phoneNumber?: string | null;
}

export function VoiceConfigPage({ initialSettings, initialConfig, phoneNumber }: VoiceConfigPageProps) {
  const [config, setConfig] = React.useState<VoiceCallConfig>(initialConfig);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-dismiss messages
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await updateVoiceCallConfig(config);
      if (result.success) {
        setSuccessMessage('Configuration saved successfully');
      } else {
        setErrorMessage(result.error || 'Failed to save configuration');
      }
    } catch {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Flora's Phone Number */}
      {phoneNumber && (
        <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100 text-green-700">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Flora&apos;s Phone Number</p>
              <p className="text-lg font-semibold text-neutral-900 tracking-wide">
                {formatPhoneNumber(phoneNumber)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-neutral-500 max-w-48 text-right">
              Share this number with your team. Inbound calls are answered by Flora.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(phoneNumber);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status messages */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="call-settings" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call Settings
          </TabsTrigger>
          <TabsTrigger value="call-scripts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Call Scripts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrgKnowledgeEditor
            config={config}
            onChange={setConfig}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="call-settings">
          <CallBehaviorEditor
            config={config}
            onChange={setConfig}
            onSave={handleSave}
            isSaving={isSaving}
            aiSettings={initialSettings}
          />
        </TabsContent>

        <TabsContent value="call-scripts">
          <CallScriptsEditor
            config={config}
            onChange={setConfig}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
