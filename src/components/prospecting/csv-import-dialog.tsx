"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Upload } from "lucide-react";

interface CsvRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyName: string;
  companyDomain?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const firstNameIdx = headers.findIndex((h) => h.includes("first"));
  const lastNameIdx = headers.findIndex((h) => h.includes("last"));
  const emailIdx = headers.findIndex((h) => h.includes("email"));
  const phoneIdx = headers.findIndex((h) => h.includes("phone"));
  const titleIdx = headers.findIndex((h) => h.includes("title") || h.includes("role"));
  const companyIdx = headers.findIndex((h) => h.includes("company") && !h.includes("domain"));
  const domainIdx = headers.findIndex((h) => h.includes("domain") || h.includes("website"));

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    return {
      firstName: cols[firstNameIdx] || "",
      lastName: cols[lastNameIdx] || "",
      email: cols[emailIdx] || undefined,
      phone: phoneIdx >= 0 ? cols[phoneIdx] || undefined : undefined,
      title: titleIdx >= 0 ? cols[titleIdx] || undefined : undefined,
      companyName: cols[companyIdx] || "",
      companyDomain: domainIdx >= 0 ? cols[domainIdx] || undefined : undefined,
    };
  }).filter((r) => r.firstName && r.lastName && r.companyName);
}

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<Array<{ success: boolean; name: string; error?: string }>>([]);

  const utils = trpc.useUtils();
  const bulkCreate = trpc.prospecting.bulkCreate.useMutation({
    onSuccess: (data) => {
      setResults(data);
      utils.prospecting.list.invalidate();
    },
  });

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setParsed(rows);
      setResults([]);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = () => {
    bulkCreate.mutate({ prospects: parsed });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Prospects from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSV should have columns: First Name, Last Name, Email, Title, Company Name, Company Domain
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />

          {parsed.length > 0 && results.length === 0 && (
            <>
              <p className="text-sm font-medium">
                Found {parsed.length} prospects to import
              </p>
              <div className="max-h-48 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-1.5 text-left">Name</th>
                      <th className="px-3 py-1.5 text-left">Title</th>
                      <th className="px-3 py-1.5 text-left">Company</th>
                      <th className="px-3 py-1.5 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5">{row.firstName} {row.lastName}</td>
                        <td className="px-3 py-1.5">{row.title || "—"}</td>
                        <td className="px-3 py-1.5">{row.companyName}</td>
                        <td className="px-3 py-1.5">{row.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 10 && (
                  <p className="px-3 py-1.5 text-xs text-muted-foreground">
                    ...and {parsed.length - 10} more
                  </p>
                )}
              </div>
              <Button onClick={handleImport} disabled={bulkCreate.isPending}>
                {bulkCreate.isPending && <LoadingSpinner className="mr-2" />}
                Import {parsed.length} Prospects
              </Button>
            </>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Imported: {results.filter((r) => r.success).length} / {results.length}
              </p>
              {results.filter((r) => !r.success).map((r, i) => (
                <p key={i} className="text-sm text-destructive">
                  Failed: {r.name} — {r.error}
                </p>
              ))}
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
