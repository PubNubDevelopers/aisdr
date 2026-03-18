"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { UserPlus } from "lucide-react";

export function AddProspectDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    companyName: "",
    companyDomain: "",
  });

  const utils = trpc.useUtils();
  const createProspect = trpc.prospecting.create.useMutation({
    onSuccess: (data) => {
      utils.prospecting.list.invalidate();
      setOpen(false);
      setForm({ firstName: "", lastName: "", email: "", title: "", companyName: "", companyDomain: "" });

      if (data.salesforceDedup.isDuplicate) {
        alert(
          `Note: This prospect may already exist in Salesforce.\n${
            data.salesforceDedup.account ? `Account: ${data.salesforceDedup.account.name}` : ""
          }`
        );
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProspect.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      title: form.title || undefined,
      companyName: form.companyName,
      companyDomain: form.companyDomain || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Prospect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., VP of Engineering"
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="companyDomain">Company Domain</Label>
            <Input
              id="companyDomain"
              value={form.companyDomain}
              onChange={(e) => setForm({ ...form, companyDomain: e.target.value })}
              placeholder="e.g., example.com"
            />
          </div>
          {createProspect.error && (
            <p className="text-sm text-destructive">{createProspect.error.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProspect.isPending}>
              {createProspect.isPending && <LoadingSpinner className="mr-2" />}
              Add Prospect
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
