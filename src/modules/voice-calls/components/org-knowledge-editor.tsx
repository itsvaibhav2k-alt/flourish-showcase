'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { VoiceCallConfig, ProgramEntry } from '../queries/get-voice-config';

interface OrgKnowledgeEditorProps {
  config: VoiceCallConfig;
  onChange: (config: VoiceCallConfig) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function OrgKnowledgeEditor({
  config,
  onChange,
  onSave,
  isSaving,
}: OrgKnowledgeEditorProps) {
  const [newImpactFact, setNewImpactFact] = React.useState('');
  const [newTopic, setNewTopic] = React.useState('');

  const updateOrgKnowledge = (
    field: keyof VoiceCallConfig['orgKnowledge'],
    value: string | ProgramEntry[] | string[],
  ) => {
    onChange({
      ...config,
      orgKnowledge: {
        ...config.orgKnowledge,
        [field]: value,
      },
    });
  };

  // Programs
  const addProgram = () => {
    updateOrgKnowledge('programs', [
      ...config.orgKnowledge.programs,
      { name: '', description: '' },
    ]);
  };

  const updateProgram = (index: number, field: keyof ProgramEntry, value: string) => {
    const updated = [...config.orgKnowledge.programs];
    updated[index] = { ...updated[index], [field]: value };
    updateOrgKnowledge('programs', updated);
  };

  const removeProgram = (index: number) => {
    updateOrgKnowledge(
      'programs',
      config.orgKnowledge.programs.filter((_, i) => i !== index),
    );
  };

  // Impact Facts
  const addImpactFact = () => {
    const trimmed = newImpactFact.trim();
    if (!trimmed) return;
    updateOrgKnowledge('impactFacts', [...config.orgKnowledge.impactFacts, trimmed]);
    setNewImpactFact('');
  };

  const removeImpactFact = (index: number) => {
    updateOrgKnowledge(
      'impactFacts',
      config.orgKnowledge.impactFacts.filter((_, i) => i !== index),
    );
  };

  // Topics to Avoid
  const addTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    updateOrgKnowledge('topicsToAvoid', [...config.orgKnowledge.topicsToAvoid, trimmed]);
    setNewTopic('');
  };

  const removeTopic = (index: number) => {
    updateOrgKnowledge(
      'topicsToAvoid',
      config.orgKnowledge.topicsToAvoid.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Mission Statement */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Mission Statement
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Flora will reference your mission during calls to connect with supporters.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.orgKnowledge.mission}
            onChange={(e) => updateOrgKnowledge('mission', e.target.value)}
            placeholder="What is your organization's mission? Flora will reference this during calls..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Organization Description */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Organization Description
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Help Flora understand what your organization does and who you serve.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.orgKnowledge.description}
            onChange={(e) => updateOrgKnowledge('description', e.target.value)}
            placeholder="Describe what your organization does, who you serve..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Programs & Services */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Programs & Services
          </CardTitle>
          <p className="text-sm text-neutral-500">
            List your key programs so Flora can speak about them knowledgeably.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.orgKnowledge.programs.map((program, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  value={program.name}
                  onChange={(e) => updateProgram(index, 'name', e.target.value)}
                  placeholder="Program name"
                />
                <Input
                  value={program.description}
                  onChange={(e) => updateProgram(index, 'description', e.target.value)}
                  placeholder="Brief description of this program"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeProgram(index)}
                className="h-9 w-9 text-neutral-400 hover:text-red-500 flex-shrink-0 mt-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addProgram}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Program
          </Button>
        </CardContent>
      </Card>

      {/* Key Impact Facts */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Key Impact Facts
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Specific facts and stats Flora can share to demonstrate impact.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.orgKnowledge.impactFacts.map((fact, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                {fact}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeImpactFact(index)}
                className="h-9 w-9 text-neutral-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newImpactFact}
              onChange={(e) => setNewImpactFact(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImpactFact();
                }
              }}
              placeholder="e.g., Last year we served 50,000 meals"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addImpactFact}
              disabled={!newImpactFact.trim()}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Topics to Avoid */}
      <Card className="shadow-card border-neutral-200/60 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Topics to Avoid
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Sensitive topics Flora should not bring up during conversations.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.orgKnowledge.topicsToAvoid.map((topic, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-sm text-neutral-700">
                {topic}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTopic(index)}
                className="h-9 w-9 text-neutral-400 hover:text-red-500 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTopic();
                }
              }}
              placeholder="e.g., Ongoing litigation, staff changes"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addTopic}
              disabled={!newTopic.trim()}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
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
