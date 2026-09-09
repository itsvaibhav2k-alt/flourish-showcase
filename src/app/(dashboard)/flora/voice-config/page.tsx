import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserRole, getCurrentOrganizationId } from '@/lib/auth/organization';
import { createClient } from '@/lib/supabase/server';
import { getAISettings } from '@/modules/settings/queries/get-ai-settings';
import { getVoiceCallConfig } from '@/modules/voice-calls/queries/get-voice-config';
import { FloraBreadcrumb } from '@/modules/flora/components';
import { VoiceConfigPage } from '@/modules/voice-calls/components/voice-config-page';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Voice Configuration | Flora',
  description: 'Customize what Flora knows and says during voice calls',
};

async function getFloraPhoneNumber(): Promise<string | null> {
  try {
    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) return null;
    const supabase = await createClient();
    const { data } = await supabase
      .from('organizations')
      .select('retell_phone_number')
      .eq('id', organizationId)
      .single();
    return data?.retell_phone_number || null;
  } catch {
    return null;
  }
}

export default async function VoiceConfigPageRoute() {
  const userRole = await getCurrentUserRole();

  if (userRole !== 'admin') {
    redirect('/flora');
  }

  const [aiSettings, voiceConfig, phoneNumber] = await Promise.all([
    getAISettings().catch(() => null),
    getVoiceCallConfig().catch(() => null),
    getFloraPhoneNumber(),
  ]);

  if (!aiSettings || !voiceConfig) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Unable to load voice configuration</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<VoiceConfigLoading />}>
      <div className="space-y-6">
        <FloraBreadcrumb currentPage="Voice Configuration" />

        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Voice Configuration
          </h2>
          <p className="text-neutral-500 mt-1">
            Customize what Flora knows and says during calls
          </p>
        </div>

        <VoiceConfigPage
          initialSettings={aiSettings}
          initialConfig={voiceConfig}
          phoneNumber={phoneNumber}
        />
      </div>
    </Suspense>
  );
}

function VoiceConfigLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-32 bg-neutral-200 rounded" />
      <div className="space-y-2">
        <div className="h-7 w-56 bg-neutral-200 rounded" />
        <div className="h-5 w-80 bg-neutral-100 rounded" />
      </div>
      <div className="h-10 w-full bg-neutral-100 rounded-md" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-neutral-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
