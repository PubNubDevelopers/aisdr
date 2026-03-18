"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { ProspectCard } from "@/components/prospecting/prospect-card";
import { AddProspectDialog } from "@/components/prospecting/add-prospect-dialog";
import { CsvImportDialog } from "@/components/prospecting/csv-import-dialog";
import { DiscoverDialog } from "@/components/prospecting/discover-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Users, Search } from "lucide-react";
import type { ProspectWithCompany } from "@/types/prospect";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "RESEARCHED", label: "Researched" },
  { value: "OUTREACH_DRAFTED", label: "Drafted" },
  { value: "IN_SEQUENCE", label: "In Sequence" },
  { value: "ENGAGED", label: "Engaged" },
  { value: "MEETING_BOOKED", label: "Meeting Booked" },
];

export default function ProspectingPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = trpc.prospecting.list.useQuery({
    search: search || undefined,
    status: (status || undefined) as undefined,
  });

  return (
    <div>
      <PageHeader
        title="Prospects"
        description="Manage your prospect pipeline"
        action={
          <div className="flex gap-2">
            <DiscoverDialog />
            <CsvImportDialog />
            <AddProspectDialog />
          </div>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Prospect List */}
        {isLoading ? (
          <PageLoading />
        ) : data?.prospects.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No prospects yet"
            description="Add your first prospect to get started with AI-powered research and outreach."
            action={<AddProspectDialog />}
          />
        ) : (
          <div className="space-y-3">
            {data?.prospects.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect as ProspectWithCompany}
                signals={prospect.company.signals?.map((s) => ({
                  id: s.id,
                  type: s.type,
                  title: s.title,
                  source: s.source,
                  strength: s.strength,
                  detectedAt: new Date(s.detectedAt),
                }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
