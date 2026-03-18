"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading, LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Building2, Zap, ArrowRight, Mail, Linkedin, Phone } from "lucide-react";
import { SEQUENCE_PLAYBOOK } from "@/lib/ai/data/sequence-playbook";

const statusColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
  ACTIVE: "default",
  PAUSED: "warning",
  COMPLETED: "success",
  REPLIED: "success",
  BOUNCED: "secondary",
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  EMAIL: Mail,
  LINKEDIN: Linkedin,
  PHONE: Phone,
};

const PHASE_DOT: Record<string, string> = {
  value: "bg-green-500",
  proof: "bg-blue-500",
  competitor: "bg-orange-500",
  breakup: "bg-red-500",
};

export default function SequencesPage() {
  const { data: enrollments, isLoading } = trpc.sequences.list.useQuery();
  const { data: outreachStatus } = trpc.sequences.outreachStatus.useQuery();

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        title="Sequences"
        description="Manage outreach sequences and enrollment"
        action={<LaunchSequenceDialog />}
      />

      <div className="p-6 space-y-6">
        {/* Playbook Overview */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 font-medium">12-Step Playbook</p>
            <div className="flex flex-wrap gap-1">
              {SEQUENCE_PLAYBOOK.map((step) => {
                const Icon = CHANNEL_ICONS[step.channel] ?? Mail;
                return (
                  <div
                    key={step.step}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    title={`Day ${step.day}: ${step.description}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${PHASE_DOT[step.phase]}`} />
                    <span className="text-muted-foreground">D{step.day}</span>
                    <Icon className="h-3 w-3" />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Value</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Proof</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> Competitor</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Breakup</span>
            </div>
          </CardContent>
        </Card>

        {/* Outreach Connection Status */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Outreach Integration</p>
                <p className="text-sm text-muted-foreground">
                  {outreachStatus?.configured
                    ? "Connected — sequences will push to Outreach"
                    : "Not connected — sequences tracked locally only"}
                </p>
              </div>
            </div>
            <Badge variant={outreachStatus?.configured ? "success" : "secondary"}>
              {outreachStatus?.configured ? "Connected" : "Local Only"}
            </Badge>
          </CardContent>
        </Card>

        {/* Enrollments */}
        {!enrollments?.length ? (
          <EmptyState
            icon={Play}
            title="No active sequences"
            description="After composing a 12-step sequence, launch prospects into sequences from here."
            action={<LaunchSequenceDialog />}
          />
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {enrollment.prospect.firstName} {enrollment.prospect.lastName}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {enrollment.prospect.company.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.sequenceName} — Step {enrollment.currentStep} of {enrollment.totalSteps}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[enrollment.status] || "secondary"}>
                        {enrollment.status}
                      </Badge>
                      {enrollment.outreachSequenceId && (
                        <Badge variant="outline">Outreach</Badge>
                      )}
                    </div>
                  </div>

                  {/* Mini timeline showing progress */}
                  <div className="mt-3 flex gap-0.5">
                    {SEQUENCE_PLAYBOOK.map((step) => {
                      const isCompleted = step.step < enrollment.currentStep;
                      const isCurrent = step.step === enrollment.currentStep;
                      return (
                        <div
                          key={step.step}
                          className={`h-1.5 flex-1 rounded-full ${
                            isCompleted
                              ? "bg-green-500"
                              : isCurrent
                              ? "bg-primary"
                              : "bg-muted"
                          }`}
                          title={`Step ${step.step}: Day ${step.day} — ${step.description}`}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LaunchSequenceDialog() {
  const [open, setOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState("");

  const prospects = trpc.prospecting.list.useQuery({
    status: "OUTREACH_DRAFTED",
  });
  const { data: outreachStatus } = trpc.sequences.outreachStatus.useQuery();
  const outreachSequences = trpc.sequences.listOutreachSequences.useQuery(undefined, {
    enabled: !!outreachStatus?.configured,
  });
  const [selectedSequence, setSelectedSequence] = useState("");

  const utils = trpc.useUtils();

  const enrollLocal = trpc.sequences.enroll.useMutation({
    onSuccess: () => {
      utils.sequences.list.invalidate();
      setOpen(false);
    },
  });

  const pushToOutreach = trpc.sequences.pushToOutreach.useMutation({
    onSuccess: (data) => {
      utils.sequences.list.invalidate();
      if (data.success) {
        setOpen(false);
      } else {
        alert(`Push failed: ${data.error}`);
      }
    },
  });

  const prospectOptions = (prospects.data?.prospects || []).map((p) => ({
    value: p.id,
    label: `${p.firstName} ${p.lastName} — ${p.company.name}`,
  }));

  const sequenceOptions = outreachStatus?.configured
    ? (outreachSequences.data || []).map((s) => ({
        value: String(s.id),
        label: `${s.name} (${s.stepCount} steps)`,
      }))
    : [
        { value: "12-step-playbook", label: "12-Step Playbook (4 Email + 4 LinkedIn + 3 Call)" },
      ];

  const handleLaunch = () => {
    if (!selectedProspect) return;

    if (outreachStatus?.configured && selectedSequence) {
      pushToOutreach.mutate({
        prospectId: selectedProspect,
        outreachSequenceId: parseInt(selectedSequence, 10),
      });
    } else {
      enrollLocal.mutate({
        prospectId: selectedProspect,
        sequenceName: "12-Step Playbook",
      });
    }
  };

  const isPending = enrollLocal.isPending || pushToOutreach.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Launch Sequence
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Launch Sequence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Prospect</p>
            <Select
              options={[{ value: "", label: "Select prospect..." }, ...prospectOptions]}
              value={selectedProspect}
              onChange={(e) => setSelectedProspect(e.target.value)}
            />
            {prospectOptions.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No prospects with drafted outreach. Generate a sequence first.
              </p>
            )}
          </div>

          {outreachStatus?.configured && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Outreach Sequence</p>
              <Select
                options={[{ value: "", label: "Select sequence..." }, ...sequenceOptions]}
                value={selectedSequence}
                onChange={(e) => setSelectedSequence(e.target.value)}
              />
            </div>
          )}

          {!outreachStatus?.configured && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">12-Step Playbook</p>
              <p className="text-xs text-muted-foreground">
                4 emails, 4 LinkedIn touches, 3 call scripts over 22 days
              </p>
              <div className="mt-2 flex gap-0.5">
                {SEQUENCE_PLAYBOOK.map((step) => {
                  const Icon = CHANNEL_ICONS[step.channel] ?? Mail;
                  return (
                    <div
                      key={step.step}
                      className="flex items-center justify-center rounded border p-1"
                      title={`Day ${step.day}: ${step.description}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleLaunch}
            disabled={!selectedProspect || isPending}
          >
            {isPending ? (
              <LoadingSpinner className="mr-2" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            {outreachStatus?.configured ? "Push to Outreach" : "Enroll in 12-Step Playbook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
