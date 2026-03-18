"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Linkedin,
  Mail,
  Phone,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SEQUENCE_PLAYBOOK } from "@/lib/ai/data/sequence-playbook";

const PHASE_COLORS: Record<string, string> = {
  value: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  proof: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  competitor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  breakup: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  LINKEDIN: Linkedin,
  PHONE: Phone,
};

interface SequenceTimelineProps {
  prospectId: string;
  sequenceId: string;
}

export function SequenceTimeline({ sequenceId }: SequenceTimelineProps) {
  const utils = trpc.useUtils();
  const { data: messages, isLoading } = trpc.compose.getSequence.useQuery({ sequenceId });
  const approveAll = trpc.compose.approveAll.useMutation({
    onSuccess: () => {
      utils.compose.getSequence.invalidate({ sequenceId });
    },
  });
  const updateMessage = trpc.compose.updateMessage.useMutation({
    onSuccess: () => {
      utils.compose.getSequence.invalidate({ sequenceId });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!messages || messages.length === 0) return <p className="text-sm text-muted-foreground">No steps generated.</p>;

  const allApproved = messages.every((m) => m.status === "APPROVED");
  const draftCount = messages.filter((m) => m.status === "DRAFT").length;

  // Group messages by day
  const dayGroups = new Map<number, typeof messages>();
  for (const msg of messages) {
    const day = msg.stepDay ?? 0;
    if (!dayGroups.has(day)) dayGroups.set(day, []);
    dayGroups.get(day)!.push(msg);
  }

  return (
    <div className="space-y-4">
      {/* Header with approve all */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {messages.length} steps &middot; {messages.length - draftCount} approved &middot; {draftCount} drafts
          </p>
        </div>
        {!allApproved && (
          <Button
            size="sm"
            onClick={() => approveAll.mutate({ sequenceId })}
            disabled={approveAll.isPending}
          >
            {approveAll.isPending ? (
              <LoadingSpinner className="mr-2" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Approve All ({draftCount})
          </Button>
        )}
        {allApproved && (
          <Badge variant="success">All Steps Approved</Badge>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-2">
          {Array.from(dayGroups.entries())
            .sort(([a], [b]) => a - b)
            .map(([day, dayMessages]) => (
              <div key={day} className="relative">
                {/* Day marker */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    Day {day}
                  </div>
                </div>

                {/* Steps for this day */}
                <div className="ml-20 space-y-2">
                  {dayMessages
                    .sort((a, b) => (a.sequenceStep ?? 0) - (b.sequenceStep ?? 0))
                    .map((msg) => (
                      <StepCard
                        key={msg.id}
                        message={msg}
                        onUpdate={(data) => updateMessage.mutate({ messageId: msg.id, ...data })}
                        onApprove={() => updateMessage.mutate({ messageId: msg.id, status: "APPROVED" })}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  message,
  onUpdate,
  onApprove,
}: {
  message: {
    id: string;
    channel: string;
    sequenceStep: number | null;
    stepType: string | null;
    isBreakup: boolean;
    subject: string | null;
    content: string;
    status: string;
    variants: unknown;
  };
  onUpdate: (data: { content?: string; subject?: string }) => void;
  onApprove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [editSubject, setEditSubject] = useState(message.subject ?? "");
  const [copied, setCopied] = useState(false);

  const playbookStep = SEQUENCE_PLAYBOOK.find((s) => s.step === message.sequenceStep);
  const phase = playbookStep?.phase ?? "value";
  const ChannelIcon = CHANNEL_ICONS[message.channel] ?? Mail;

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

  // Subject line variants
  const variants = (message.variants as Array<{ subject?: string }>) ?? [];

  return (
    <Card className={message.status === "APPROVED" ? "border-green-200 dark:border-green-800" : ""}>
      <CardContent className="p-3">
        {/* Header row — always visible */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="flex items-center gap-1.5">
              <ChannelIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                Step {message.sequenceStep}
              </span>
            </div>
            <Badge variant="outline" className={`text-xs ${PHASE_COLORS[phase]}`}>
              {phase}
            </Badge>
            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
              {playbookStep?.description}
            </span>
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge
              variant={message.status === "APPROVED" ? "success" : "secondary"}
              className="text-xs"
            >
              {message.status}
            </Badge>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 ml-6 space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                {message.subject !== null && (
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Subject line"
                    className="text-sm"
                  />
                )}
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                {message.subject && (
                  <p className="text-sm">
                    <span className="font-medium">Subject:</span> {message.subject}
                  </p>
                )}
                {/* Subject variants */}
                {variants.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Variants:</span>
                    {variants.map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {v.subject}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm prose prose-sm dark:prose-invert max-w-none">
                  {message.content}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="mr-1.5 h-3 w-3" />
                    Edit
                  </Button>
                  {message.status !== "APPROVED" && (
                    <Button size="sm" onClick={onApprove}>
                      <Check className="mr-1.5 h-3 w-3" />
                      Approve
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
