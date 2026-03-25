"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Edit3, RefreshCw, Mail, Linkedin, Phone, ListOrdered, Layers } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SequenceTimeline } from "./sequence-timeline";
import type { EmailVariant } from "@/types/message";

interface MessageEditorProps {
  prospectId: string;
  prospectName: string;
  hasResearchBrief: boolean;
}

export function MessageEditor({ prospectId, prospectName, hasResearchBrief }: MessageEditorProps) {
  const sequences = trpc.compose.listSequences.useQuery({ prospectId });
  const hasSequence = sequences.data && sequences.data.length > 0;
  const latestSequenceId = hasSequence ? sequences.data![0].sequenceId : null;

  const [mode, setMode] = useState<"sequence" | "single">(
    hasSequence ? "sequence" : "sequence"
  );
  // Update mode when data loads
  const effectiveMode = mode;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Compose Outreach</h2>
        <p className="text-sm text-muted-foreground">for {prospectName}</p>
      </div>

      {!hasResearchBrief && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          Generate a research brief first to get personalized outreach.
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setMode("sequence")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            effectiveMode === "sequence"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
          12-Step Sequence
        </button>
        <button
          onClick={() => setMode("single")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            effectiveMode === "single"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Single Messages
        </button>
      </div>

      {effectiveMode === "sequence" ? (
        <SequenceMode
          prospectId={prospectId}
          hasResearchBrief={hasResearchBrief}
          latestSequenceId={latestSequenceId}
        />
      ) : (
        <SingleMode
          prospectId={prospectId}
          hasResearchBrief={hasResearchBrief}
        />
      )}
    </div>
  );
}

// ── Sequence Mode ───────────────────────────────────────────────

function SequenceMode({
  prospectId,
  hasResearchBrief,
  latestSequenceId,
}: {
  prospectId: string;
  hasResearchBrief: boolean;
  latestSequenceId: string | null;
}) {
  const utils = trpc.useUtils();
  const [generating, setGenerating] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const prepareSequence = trpc.compose.prepareSequence.useMutation();
  const generateBatch = trpc.compose.generateBatch.useMutation();

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setCurrentBatch(0);

    try {
      // Step 1: Prepare context (fast, no AI call)
      const ctx = await prepareSequence.mutateAsync({ prospectId });

      const batchSummaries: string[] = [];

      // Step 2: Generate 3 batches sequentially
      for (const batchNum of [1, 2, 3] as const) {
        setCurrentBatch(batchNum);
        const result = await generateBatch.mutateAsync({
          batchNumber: batchNum,
          sequenceId: ctx.sequenceId,
          prospectId,
          prospectName: ctx.prospectName,
          prospectTitle: ctx.prospectTitle,
          companyName: ctx.companyName,
          briefData: ctx.briefData,
          contentSection: ctx.contentSection,
          systemPrompt: ctx.systemPrompt,
          stepInstructions: ctx.stepInstructions,
          previousBatchSummaries: batchSummaries,
          gongInsights: ctx.gongInsights,
        });
        batchSummaries.push(result.batchSummary);

        // Refresh timeline after each batch so steps appear progressively
        utils.compose.getSequence.invalidate({ sequenceId: ctx.sequenceId });
      }

      // Done — refresh sequence list
      utils.compose.listSequences.invalidate({ prospectId });
      utils.prospecting.get.invalidate({ id: prospectId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate sequence");
    } finally {
      setGenerating(false);
      setCurrentBatch(0);
    }
  };

  if (latestSequenceId) {
    return <SequenceTimeline prospectId={prospectId} sequenceId={latestSequenceId} />;
  }

  const batchLabels = ["", "Value phase (Steps 1-4)", "Proof phase (Steps 5-8)", "Breakup phase (Steps 9-12)"];

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <ListOrdered className="mb-3 h-10 w-10 text-muted-foreground" />
      <h3 className="mb-1 text-lg font-semibold">Generate 12-Step Sequence</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">
        AI will create a complete outreach sequence following the playbook: 4 emails, 4 LinkedIn touches, 3 call scripts — spread across 22 days with escalating messaging.
      </p>
      <Button
        size="lg"
        onClick={handleGenerate}
        disabled={generating || !hasResearchBrief}
      >
        {generating ? (
          <>
            <LoadingSpinner className="mr-2" />
            Generating...
          </>
        ) : (
          <>
            <ListOrdered className="mr-2 h-4 w-4" />
            Generate 12-Step Sequence
          </>
        )}
      </Button>
      {generating && currentBatch > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Batch {currentBatch} of 3</span>
            <span>{batchLabels[currentBatch]}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((currentBatch - 1) / 3) * 100 + 10}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Each batch takes ~10 seconds...
          </p>
        </div>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// ── Single Message Mode (existing behavior) ─────────────────────

function SingleMode({
  prospectId,
  hasResearchBrief,
}: {
  prospectId: string;
  hasResearchBrief: boolean;
}) {
  const [activeChannel, setActiveChannel] = useState("EMAIL");

  const messages = trpc.compose.listMessages.useQuery({ prospectId });
  const generate = trpc.compose.generate.useMutation({
    onSuccess: () => messages.refetch(),
  });
  const updateMessage = trpc.compose.updateMessage.useMutation({
    onSuccess: () => messages.refetch(),
  });

  const handleGenerate = (channel: "EMAIL" | "LINKEDIN" | "PHONE") => {
    generate.mutate({ prospectId, channel });
  };

  const channelMessages = messages.data?.filter((m) => m.channel === activeChannel && !m.sequenceId) || [];

  return (
    <Tabs value={activeChannel} onValueChange={setActiveChannel}>
      <TabsList>
        <TabsTrigger value="EMAIL">
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Email
        </TabsTrigger>
        <TabsTrigger value="LINKEDIN">
          <Linkedin className="mr-1.5 h-3.5 w-3.5" />
          LinkedIn
        </TabsTrigger>
        <TabsTrigger value="PHONE">
          <Phone className="mr-1.5 h-3.5 w-3.5" />
          Phone
        </TabsTrigger>
      </TabsList>

      {(["EMAIL", "LINKEDIN", "PHONE"] as const).map((channel) => (
        <TabsContent key={channel} value={channel}>
          <div className="space-y-4">
            <Button
              onClick={() => handleGenerate(channel)}
              disabled={generate.isPending || !hasResearchBrief}
            >
              {generate.isPending && generate.variables?.channel === channel ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate {channel === "EMAIL" ? "Email" : channel === "LINKEDIN" ? "LinkedIn" : "Call Script"}
            </Button>

            {channelMessages.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                onUpdate={(data) =>
                  updateMessage.mutate({ messageId: msg.id, ...data })
                }
                onApprove={() =>
                  updateMessage.mutate({ messageId: msg.id, status: "APPROVED" })
                }
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function MessageCard({
  message,
  onUpdate,
  onApprove,
}: {
  message: {
    id: string;
    channel: string;
    subject: string | null;
    content: string;
    status: string;
    variants: unknown;
    createdAt: Date;
  };
  onUpdate: (data: { content?: string; subject?: string }) => void;
  onApprove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [editSubject, setEditSubject] = useState(message.subject || "");
  const [copied, setCopied] = useState(false);
  const [activeVariant, setActiveVariant] = useState(0);

  const variants = (message.variants as EmailVariant[] | null) || [];

  const handleCopy = () => {
    const text = message.subject
      ? `Subject: ${message.subject}\n\n${message.content}`
      : message.content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdate({
      content: editContent,
      subject: editSubject || undefined,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {message.channel === "EMAIL" ? "Email" : message.channel === "LINKEDIN" ? "LinkedIn" : "Call Script"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={message.status === "APPROVED" ? "success" : "secondary"}>
              {message.status}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Variant Picker for emails */}
        {message.channel === "EMAIL" && variants.length > 0 && !isEditing && (
          <div className="mb-3 flex gap-1">
            <button
              className={`rounded px-2 py-0.5 text-xs ${activeVariant === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              onClick={() => setActiveVariant(0)}
            >
              Primary
            </button>
            {variants.map((_, i) => (
              <button
                key={i}
                className={`rounded px-2 py-0.5 text-xs ${activeVariant === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => setActiveVariant(i + 1)}
              >
                Variant {i + 1}
              </button>
            ))}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            {message.subject !== null && (
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Subject line"
              />
            )}
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {message.subject && activeVariant === 0 && (
              <p className="text-sm">
                <span className="font-medium">Subject:</span> {message.subject}
              </p>
            )}
            {activeVariant > 0 && variants[activeVariant - 1] && (
              <>
                {(variants[activeVariant - 1] as EmailVariant).subject && (
                  <p className="text-sm">
                    <span className="font-medium">Subject:</span>{" "}
                    {(variants[activeVariant - 1] as EmailVariant).subject}
                  </p>
                )}
              </>
            )}
            <div className="whitespace-pre-wrap text-sm">
              {activeVariant === 0
                ? message.content
                : (variants[activeVariant - 1] as EmailVariant)?.content || message.content}
            </div>
          </div>
        )}

        {message.status !== "APPROVED" && !isEditing && (
          <div className="mt-3">
            <Button size="sm" onClick={onApprove} variant="default">
              <Check className="mr-1.5 h-3 w-3" />
              Approve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
