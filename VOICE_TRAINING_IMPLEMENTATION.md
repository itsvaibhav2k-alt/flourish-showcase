# Voice Training Feature Implementation

This document describes the implementation of the voice training feature for the Flourish nonprofit CRM.

## Overview

The voice training feature allows organizations to upload sample emails so that the AI can learn their unique writing style and generate emails that match their voice.

## Components Implemented

### 1. Database Schema (`supabase/migrations/002_add_voice_profile_fields.sql`)

Added the following columns to the `organizations` table:
- `voice_formality` - Level of formality (casual, moderate, formal)
- `voice_warmth` - Warmth score from 1-10
- `voice_signature_phrases` - Array of commonly used phrases
- `voice_greeting_style` - Description of greeting style
- `voice_closing_style` - Description of closing style
- `voice_tone_characteristics` - Array of tone descriptors
- `voice_trained_at` - Timestamp when voice was last trained
- `voice_trained_by` - User ID who trained the voice
- `updated_at` - General update timestamp

The `voice_samples` and `voice_summary` columns already existed in the schema.

### 2. Voice Samples Queries (`src/modules/communications/queries/get-voice-samples.ts`)

Created queries to:
- `getVoiceSamples()` - Retrieve all voice samples for the current organization
- `getVoiceSummary()` - Get the current voice profile summary
- `hasTrainedVoice()` - Check if organization has a trained voice
- `getVoiceSamplesCount()` - Get count of voice samples

### 3. Voice Samples Actions (`src/modules/communications/actions/manage-voice-samples.ts`)

Created server actions to:
- `addVoiceSample(content, source)` - Add a new voice sample (max 15 samples, min 50 chars)
- `removeVoiceSample(sampleId)` - Remove a voice sample

Both actions enforce:
- Admin-only access
- Organization membership verification
- Input validation

### 4. Voice Training Action (`src/modules/communications/actions/train-voice.ts`)

Updated the existing `trainVoice()` action to:
- Retrieve voice samples from the organization (instead of requiring them as parameters)
- Validate minimum 5 samples are present
- Parse JSON-stored samples
- Call Claude AI to analyze the samples
- Store the voice profile in all the new database columns
- Revalidate the communications pages

### 5. Voice Training Page (`src/app/(dashboard)/communications/voice/page.tsx`)

Wired up the UI with real server actions:
- `handleAddSample` - Calls `addVoiceSample` action
- `handleRemoveSample` - Calls `removeVoiceSample` action
- `handleTrainVoice` - Calls `trainVoice` action and redirects on success
- Displays current voice profile summary
- Shows all voice samples with ability to add/remove

### 6. AI Email Generation Integration

The AI email generation already uses voice profiles:
- `getVoiceProfile(organizationId)` - Retrieves voice profile from database
- All email generation prompts (thank-you, re-engagement, volunteer) use `getVoiceInstructions(voiceProfile)` to inject voice profile into the system prompt
- The prompts include formality level, warmth score, tone characteristics, greeting/closing styles, and signature phrases

## User Flow

1. **Navigate to Voice Training**
   - Go to `/communications/voice`

2. **Add Voice Samples**
   - Paste email content (minimum 50 characters)
   - Optionally specify source (e.g., "Newsletter 2024-01")
   - Or upload a text file (.txt, .eml)
   - Can add up to 15 samples total

3. **Train Voice Profile**
   - Once 5+ samples are added, the "Train Voice" button becomes enabled
   - Click "Train Voice" to analyze samples with Claude AI
   - The AI extracts:
     - Overall voice summary (3-5 sentences)
     - Formality level (casual, moderate, formal)
     - Warmth score (1-10)
     - Signature phrases (specific language patterns)
     - Greeting style
     - Closing style
     - Tone characteristics

4. **Use Trained Voice**
   - All AI-generated emails will now use the trained voice profile
   - Voice profile is automatically included in email generation prompts
   - The AI matches the organization's tone, formality, and language patterns

## Permissions

- Only organization **admins** can:
  - Add voice samples
  - Remove voice samples
  - Train voice profile
  - Clear voice profile

## Technical Details

### Voice Sample Storage

Voice samples are stored in the `organizations.voice_samples` column as a PostgreSQL text array. Each sample is a JSON string with the format:
```json
{
  "content": "email text...",
  "source": "Newsletter 2024-01",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Voice Profile Structure

The voice profile is stored across multiple columns for efficient querying and type safety:
```typescript
{
  voiceSummary: string
  formality: 'casual' | 'moderate' | 'formal'
  warmth: number // 1-10
  signaturePhrases: string[]
  greetingStyle: string
  closingStyle: string
  toneCharacteristics: string[]
  trainedAt: string
}
```

### AI Integration

The voice analysis uses:
- Model: Claude 3.5 Sonnet (for accuracy)
- Temperature: 0.5 (for consistency)
- Max tokens: 2048
- Prompt caching: Enabled for cost efficiency

The voice profile is then injected into all email generation prompts using the `getVoiceInstructions()` helper function.

## Files Modified/Created

### Created
- `supabase/migrations/002_add_voice_profile_fields.sql`
- `src/modules/communications/queries/get-voice-samples.ts`
- `src/modules/communications/actions/manage-voice-samples.ts`

### Modified
- `src/modules/communications/actions/train-voice.ts` - Updated to use organization's stored samples
- `src/app/(dashboard)/communications/voice/page.tsx` - Wired up with real actions
- `src/modules/communications/actions/index.ts` - Exported new actions

### Already Integrated (No Changes Needed)
- `src/lib/ai/prompts/voice-analysis.ts` - Voice analysis prompt
- `src/lib/ai/claude.ts` - `analyzeVoiceSamples()` function
- `src/lib/ai/prompts/thank-you.ts` - Uses voice profile
- `src/lib/ai/prompts/reengagement.ts` - Uses voice profile
- `src/lib/ai/prompts/volunteer.ts` - Uses voice profile
- `src/modules/communications/actions/generate-draft.ts` - Requires voice profile

## Testing

To test the feature:

1. Start the local Supabase instance:
   ```bash
   npx supabase start
   ```

2. Run the database migration:
   ```bash
   npx supabase db reset
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Navigate to `/communications/voice` and add sample emails

5. Train the voice profile with 5+ samples

6. Generate an AI email and verify it matches the trained voice

## Future Enhancements

Potential improvements:
- Allow viewing full voice profile details (formality, warmth, etc.)
- Voice profile versioning (track changes over time)
- A/B testing different voice profiles
- Voice profile templates for different email types
- Bulk sample upload (CSV, multiple files)
- Sample email recommendations based on organization type
- Voice profile sharing across similar organizations
