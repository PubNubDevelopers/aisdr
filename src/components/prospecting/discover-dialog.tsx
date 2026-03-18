"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Sparkles, AlertTriangle, Building2, Check } from "lucide-react";

interface DiscoveredProspect {
  firstName: string;
  lastName: string;
  email?: string;
  title?: string;
  companyName: string;
  companyDomain?: string;
  companyDescription?: string;
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  techStack?: string[];
  score?: number;
  scoreExplanation?: string;
  salesforceDedup: { isDuplicate: boolean };
}

export function DiscoverDialog() {
  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [discovered, setDiscovered] = useState<DiscoveredProspect[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const profiles = trpc.targeting.list.useQuery();
  const utils = trpc.useUtils();

  const discover = trpc.prospecting.discover.useMutation({
    onSuccess: (data) => {
      setDiscovered(data);
      setSelected(new Set(data.map((_, i) => i)));
    },
  });

  const importProspects = trpc.prospecting.importDiscovered.useMutation({
    onSuccess: (data) => {
      utils.prospecting.list.invalidate();
      alert(`Imported ${data.imported} prospects (${data.skipped} skipped)`);
      setOpen(false);
      setDiscovered([]);
      setSelected(new Set());
    },
  });

  const toggleSelect = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === discovered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(discovered.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const toImport = discovered.filter((_, i) => selected.has(i));
    importProspects.mutate({ prospects: toImport });
  };

  const profileOptions = (profiles.data || []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Discovery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>AI Prospect Discovery</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Selection */}
          <div className="flex gap-3">
            <Select
              options={[{ value: "", label: "Select a targeting profile..." }, ...profileOptions]}
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => discover.mutate({ profileId })}
              disabled={!profileId || discover.isPending}
            >
              {discover.isPending ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {discover.isPending ? "Searching..." : "Discover"}
            </Button>
          </div>

          {discover.isPending && (
            <div className="py-8 text-center">
              <LoadingSpinner className="mx-auto h-8 w-8" />
              <p className="mt-3 text-sm text-muted-foreground">
                Searching enrichment sources and AI-scoring results...
              </p>
            </div>
          )}

          {/* Results */}
          {discovered.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Found {discovered.length} prospects
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {selected.size === discovered.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={selected.size === 0 || importProspects.isPending}
                  >
                    {importProspects.isPending && <LoadingSpinner className="mr-2" />}
                    Import {selected.size} Selected
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-auto">
                {discovered.map((prospect, idx) => (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-colors ${
                      selected.has(idx)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSelect(idx)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                            selected.has(idx)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground"
                          }`}>
                            {selected.has(idx) && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="font-medium">
                              {prospect.firstName} {prospect.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {prospect.title && `${prospect.title} at `}
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {prospect.companyName}
                              </span>
                            </p>
                            {prospect.scoreExplanation && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {prospect.scoreExplanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {prospect.salesforceDedup.isDuplicate && (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              In SF
                            </Badge>
                          )}
                          {prospect.score != null && (
                            <Badge
                              variant={
                                prospect.score >= 70
                                  ? "success"
                                  : prospect.score >= 40
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {Math.round(prospect.score)}
                            </Badge>
                          )}
                          {prospect.industry && (
                            <Badge variant="outline">{prospect.industry}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
