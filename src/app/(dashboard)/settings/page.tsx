"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading, LoadingSpinner } from "@/components/shared/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { COMPOSE_SEQUENCE_SYSTEM, COMPOSE_SYSTEM } from "@/lib/ai/prompts/compose";
import { RESEARCH_BRIEF_SYSTEM } from "@/lib/ai/prompts/research";
import { SEQUENCE_PLAYBOOK } from "@/lib/ai/data/sequence-playbook";

export default function SettingsPage() {
  const { data, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const toggle = trpc.settings.toggleSafeMode.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
    },
  });

  if (isLoading) return <PageLoading />;
  if (!data) return null;

  const safeMode = data.safeMode;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Team settings, safety controls, and AI prompt customization"
      />

      <div className="p-6 space-y-6">
        {/* Safe Mode Card */}
        <Card className={safeMode ? "border-green-300 dark:border-green-800" : "border-red-300 dark:border-red-800"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {safeMode ? (
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900">
                    <ShieldOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-base">Safe Mode</CardTitle>
                  <CardDescription>
                    Block all writes to external systems
                  </CardDescription>
                </div>
              </div>
              <Badge variant={safeMode ? "success" : "destructive" as "default"}>
                {safeMode ? "ON" : "OFF"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When Safe Mode is on, the app will <strong>not</strong> write to any external system.
              You can still research prospects, generate briefs, compose messages, and work locally —
              but nothing will be pushed to Salesforce, Outreach, or any other connected service.
            </p>

            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium mb-2">Blocked when Safe Mode is ON:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Sync prospect to Salesforce (create Account/Contact)</li>
                <li>- Log activity in Salesforce (create Task)</li>
                <li>- Push prospect to Outreach sequence</li>
                <li>- Bulk push to Outreach</li>
              </ul>
            </div>

            {!safeMode && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  Safe Mode is OFF. The app can write to Salesforce and Outreach.
                  Turn Safe Mode on if you want to prevent any external writes.
                </p>
              </div>
            )}

            <Button
              onClick={() => toggle.mutate({ enabled: !safeMode })}
              disabled={toggle.isPending}
              variant={safeMode ? "destructive" : "default"}
            >
              {safeMode ? (
                <>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Turn Off Safe Mode
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Turn On Safe Mode
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Prompts Card */}
        <PromptEditor />
      </div>
    </div>
  );
}

// ── AI Prompt Editor ────────────────────────────────────────────

function PromptEditor() {
  const utils = trpc.useUtils();
  const { data: overrides, isLoading } = trpc.settings.getPromptOverrides.useQuery();

  const updateOverrides = trpc.settings.updatePromptOverrides.useMutation({
    onSuccess: () => {
      utils.settings.getPromptOverrides.invalidate();
    },
  });
  const resetOverrides = trpc.settings.resetPromptOverrides.useMutation({
    onSuccess: () => {
      utils.settings.getPromptOverrides.invalidate();
    },
  });

  // Local state for editing
  const [researchPrompt, setResearchPrompt] = useState("");
  const [sequencePrompt, setSequencePrompt] = useState("");
  const [singlePrompt, setSinglePrompt] = useState("");
  const [stepOverrides, setStepOverrides] = useState<Record<string, string>>({});
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // Initialize from server data
  useEffect(() => {
    if (overrides) {
      setResearchPrompt(overrides.researchSystemPrompt ?? "");
      setSequencePrompt(overrides.sequenceSystemPrompt ?? "");
      setSinglePrompt(overrides.singleSystemPrompt ?? "");
      setStepOverrides(overrides.stepInstructions ?? {});
      setDirty(false);
    }
  }, [overrides]);

  const handleSave = () => {
    updateOverrides.mutate({
      researchSystemPrompt: researchPrompt || undefined,
      sequenceSystemPrompt: sequencePrompt || undefined,
      singleSystemPrompt: singlePrompt || undefined,
      stepInstructions: Object.keys(stepOverrides).length > 0 ? stepOverrides : undefined,
    });
    setDirty(false);
  };

  const handleReset = () => {
    if (confirm("Reset all prompts to defaults? Custom prompts will be deleted.")) {
      resetOverrides.mutate();
      setResearchPrompt("");
      setSequencePrompt("");
      setSinglePrompt("");
      setStepOverrides({});
      setDirty(false);
    }
  };

  const updateStepInstruction = (step: number, value: string) => {
    setStepOverrides((prev) => {
      const next = { ...prev };
      if (value.trim()) {
        next[String(step)] = value;
      } else {
        delete next[String(step)];
      }
      return next;
    });
    setDirty(true);
  };

  const hasOverrides = researchPrompt || sequencePrompt || singlePrompt || Object.keys(stepOverrides).length > 0;

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">AI Prompts</CardTitle>
              <CardDescription>
                Customize the instructions Claude uses when generating outreach copy
              </CardDescription>
            </div>
          </div>
          {hasOverrides && (
            <Badge variant="outline" className="text-purple-600">Customized</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Edit the system prompts and per-step instructions below. Leave a field empty to use the built-in default.
          Changes apply to all future generations.
        </p>

        {/* Research Brief System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Research Brief Prompt
            </label>
            {researchPrompt && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setResearchPrompt(""); setDirty(true); }}
              >
                Clear (use default)
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Instructions for generating prospect research briefs. Controls what the AI focuses on, how it evaluates PubNub relevance, and what personalization hooks it looks for.
          </p>
          <Textarea
            value={researchPrompt}
            onChange={(e) => { setResearchPrompt(e.target.value); setDirty(true); }}
            placeholder={RESEARCH_BRIEF_SYSTEM.slice(0, 300) + "..."}
            rows={8}
            className="font-mono text-xs"
          />
          {!researchPrompt && (
            <button
              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
              onClick={() => { setResearchPrompt(RESEARCH_BRIEF_SYSTEM); setDirty(true); }}
            >
              Load default to edit
            </button>
          )}
        </div>

        {/* Sequence System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Sequence System Prompt
            </label>
            {sequencePrompt && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setSequencePrompt(""); setDirty(true); }}
              >
                Clear (use default)
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Master instructions for 12-step sequence generation. Controls tone, word limits, hyperlink rules, and messaging philosophy.
          </p>
          <Textarea
            value={sequencePrompt}
            onChange={(e) => { setSequencePrompt(e.target.value); setDirty(true); }}
            placeholder={COMPOSE_SEQUENCE_SYSTEM.slice(0, 300) + "..."}
            rows={8}
            className="font-mono text-xs"
          />
          {!sequencePrompt && (
            <button
              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
              onClick={() => { setSequencePrompt(COMPOSE_SEQUENCE_SYSTEM); setDirty(true); }}
            >
              Load default to edit
            </button>
          )}
        </div>

        {/* Single Message System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Single Message System Prompt
            </label>
            {singlePrompt && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setSinglePrompt(""); setDirty(true); }}
              >
                Clear (use default)
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Instructions for individual email/LinkedIn/call script generation (non-sequence mode).
          </p>
          <Textarea
            value={singlePrompt}
            onChange={(e) => { setSinglePrompt(e.target.value); setDirty(true); }}
            placeholder={COMPOSE_SYSTEM.slice(0, 200) + "..."}
            rows={5}
            className="font-mono text-xs"
          />
          {!singlePrompt && (
            <button
              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
              onClick={() => { setSinglePrompt(COMPOSE_SYSTEM); setDirty(true); }}
            >
              Load default to edit
            </button>
          )}
        </div>

        {/* Per-Step Instructions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Per-Step Instructions</label>
          <p className="text-xs text-muted-foreground">
            Override the AI instructions for individual sequence steps. Click a step to expand and edit.
          </p>

          <div className="space-y-1">
            {SEQUENCE_PLAYBOOK.map((step) => {
              const isExpanded = expandedStep === step.step;
              const hasOverride = !!stepOverrides[String(step.step)];
              const channelLabel = step.channel === "EMAIL" ? "Email" : step.channel === "LINKEDIN" ? "LinkedIn" : "Call";

              return (
                <div key={step.step} className="rounded-lg border">
                  <button
                    className="flex w-full items-center gap-2 p-2.5 text-left text-sm hover:bg-muted/50"
                    onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium">Step {step.step}</span>
                    <span className="text-muted-foreground">Day {step.day}</span>
                    <Badge variant="outline" className="text-xs">{channelLabel}</Badge>
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {step.description}
                    </span>
                    {hasOverride && (
                      <Badge variant="outline" className="text-xs text-purple-600">Custom</Badge>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t px-3 py-3 space-y-2">
                      <div className="rounded bg-muted/50 p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Default instructions:</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {step.aiInstructions}
                        </p>
                      </div>
                      <Textarea
                        value={stepOverrides[String(step.step)] ?? ""}
                        onChange={(e) => updateStepInstruction(step.step, e.target.value)}
                        placeholder="Leave empty to use default above"
                        rows={5}
                        className="font-mono text-xs"
                      />
                      {hasOverride && (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => updateStepInstruction(step.step, "")}
                        >
                          Clear (use default)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Button
            onClick={handleSave}
            disabled={!dirty || updateOverrides.isPending}
          >
            {updateOverrides.isPending ? (
              <LoadingSpinner className="mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Prompts
          </Button>

          {hasOverrides && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={resetOverrides.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All to Defaults
            </Button>
          )}

          {dirty && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
