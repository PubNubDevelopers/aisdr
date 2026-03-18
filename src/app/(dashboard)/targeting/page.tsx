"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function TargetingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<{
    name: string;
    description: string;
    industries: string;
    companySize: string;
    titles: string;
    techSignals: string;
    triggers: string;
  } | null>(null);

  const { data: profiles, isLoading } = trpc.targeting.list.useQuery();
  const utils = trpc.useUtils();

  const deleteProfile = trpc.targeting.delete.useMutation({
    onSuccess: () => utils.targeting.list.invalidate(),
  });

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        title="Targeting"
        description="Define your ideal customer profiles"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit" : "Create"} Targeting Profile</DialogTitle>
              </DialogHeader>
              <TargetingProfileForm
                editId={editId}
                initialData={templateData}
                onClose={() => {
                  setDialogOpen(false);
                  setEditId(null);
                  setTemplateData(null);
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6">
        {!profiles?.length ? (
          <EmptyState
            icon={Target}
            title="No targeting profiles"
            description="Create your first ICP profile to define who you're going after."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Profile
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const criteria = profile.criteria as {
                industries?: string[];
                companySize?: string;
                titles?: string[];
                techSignals?: string[];
                triggers?: string[];
              };

              return (
                <Card key={profile.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{profile.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditId(profile.id);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (confirm("Delete this profile?")) {
                              deleteProfile.mutate({ id: profile.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.description && (
                      <p className="mb-3 text-sm text-muted-foreground">{profile.description}</p>
                    )}
                    <div className="space-y-2">
                      {criteria.industries?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Industries</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {criteria.industries.map((i) => (
                              <Badge key={i} variant="secondary">{i}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {criteria.companySize && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Company Size</p>
                          <p className="text-sm">{criteria.companySize}</p>
                        </div>
                      )}
                      {criteria.titles?.length ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Target Titles</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {criteria.titles.map((t) => (
                              <Badge key={t} variant="outline">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pre-built Templates */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Quick Templates</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Card
                key={t.name}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => {
                  setEditId(null);
                  setTemplateData({
                    name: t.name,
                    description: t.description,
                    ...t.criteria,
                  });
                  setDialogOpen(true);
                }}
              >
                <CardContent className="p-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TEMPLATES = [
  {
    name: "Companies Building Chat",
    description: "Mobile/web apps adding in-app messaging features",
    criteria: {
      industries: "SaaS, Mobile Apps, Social, Healthcare, Fintech",
      companySize: "50-1000 employees",
      titles: "CTO, VP Engineering, Director of Product, Head of Mobile",
      techSignals: "React Native, Flutter, WebSocket, Firebase, SendBird",
      triggers: "Hiring mobile engineers, Series A-C funding, Launching new app features",
    },
  },
  {
    name: "Mobile Apps with Real-Time Needs",
    description: "Apps with live features, notifications, or collaboration",
    criteria: {
      industries: "Mobile Apps, Gaming, Marketplace, Delivery, Social",
      companySize: "100-5000 employees",
      titles: "CTO, VP Engineering, Director of Engineering, Head of Platform",
      techSignals: "React Native, iOS, Android, WebSocket, Push Notifications",
      triggers: "App growth, Hiring backend engineers, Real-time feature launches",
    },
  },
  {
    name: "IoT Companies Scaling Messaging",
    description: "Connected device companies needing reliable pub/sub",
    criteria: {
      industries: "IoT, Smart Home, Industrial, Connected Devices, Automotive",
      companySize: "50-500 employees",
      titles: "CTO, VP Engineering, IoT Architect, Head of Platform",
      techSignals: "MQTT, AWS IoT, Azure IoT, Kafka, RabbitMQ",
      triggers: "Device fleet growth, Series B+ funding, Hiring embedded engineers",
    },
  },
];

function TargetingProfileForm({
  editId,
  initialData,
  onClose,
}: {
  editId: string | null;
  initialData?: {
    name: string;
    description: string;
    industries: string;
    companySize: string;
    titles: string;
    techSignals: string;
    triggers: string;
  } | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    industries: initialData?.industries ?? "",
    companySize: initialData?.companySize ?? "",
    titles: initialData?.titles ?? "",
    techSignals: initialData?.techSignals ?? "",
    triggers: initialData?.triggers ?? "",
  });

  const utils = trpc.useUtils();
  const create = trpc.targeting.create.useMutation({
    onSuccess: () => {
      utils.targeting.list.invalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      name: form.name,
      description: form.description || undefined,
      criteria: {
        industries: form.industries.split(",").map((s) => s.trim()).filter(Boolean),
        companySize: form.companySize,
        titles: form.titles.split(",").map((s) => s.trim()).filter(Boolean),
        techSignals: form.techSignals.split(",").map((s) => s.trim()).filter(Boolean),
        triggers: form.triggers.split(",").map((s) => s.trim()).filter(Boolean),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Profile Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Series B Mobile Apps"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of this target profile"
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="industries">Industries (comma-separated)</Label>
        <Input
          id="industries"
          value={form.industries}
          onChange={(e) => setForm({ ...form, industries: e.target.value })}
          placeholder="e.g., Healthcare, Fintech, Gaming"
        />
      </div>
      <div>
        <Label htmlFor="companySize">Company Size</Label>
        <Input
          id="companySize"
          value={form.companySize}
          onChange={(e) => setForm({ ...form, companySize: e.target.value })}
          placeholder="e.g., 50-500 employees"
        />
      </div>
      <div>
        <Label htmlFor="titles">Target Titles (comma-separated)</Label>
        <Input
          id="titles"
          value={form.titles}
          onChange={(e) => setForm({ ...form, titles: e.target.value })}
          placeholder="e.g., CTO, VP Engineering, Director of Product"
        />
      </div>
      <div>
        <Label htmlFor="techSignals">Tech Signals (comma-separated)</Label>
        <Input
          id="techSignals"
          value={form.techSignals}
          onChange={(e) => setForm({ ...form, techSignals: e.target.value })}
          placeholder="e.g., React Native, WebSocket, Firebase"
        />
      </div>
      <div>
        <Label htmlFor="triggers">Trigger Events (comma-separated)</Label>
        <Input
          id="triggers"
          value={form.triggers}
          onChange={(e) => setForm({ ...form, triggers: e.target.value })}
          placeholder="e.g., Series B funding, Hiring mobile engineers"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending && <LoadingSpinner className="mr-2" />}
          {editId ? "Update" : "Create"} Profile
        </Button>
      </div>
    </form>
  );
}
