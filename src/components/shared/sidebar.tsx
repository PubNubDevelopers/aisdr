"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { trpc } from "@/lib/trpc/client";
import {
  Target,
  Search,
  FileText,
  PenTool,
  Play,
  BarChart3,
  Settings,
  Zap,
  ShieldCheck,
  Plug,
} from "lucide-react";

const workflowSteps = [
  { name: "Targeting", href: "/targeting", icon: Target, step: 1, description: "Define your ICP" },
  { name: "Prospecting", href: "/prospecting", icon: Search, step: 2, description: "Find prospects" },
  { name: "Research", href: "/research", icon: FileText, step: 3, description: "AI research briefs" },
  { name: "Compose", href: "/compose", icon: PenTool, step: 4, description: "Draft outreach" },
  { name: "Sequences", href: "/sequences", icon: Play, step: 5, description: "Launch sequences" },
  { name: "Tracking", href: "/tracking", icon: BarChart3, step: 6, description: "Track engagement" },
];

const bottomNav = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: settings } = trpc.settings.get.useQuery();
  const safeMode = settings?.safeMode ?? true;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Zap className="mr-2 h-5 w-5 text-primary" />
        <span className="text-lg font-bold">AI SDR</span>
        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          beta
        </span>
      </div>

      {/* Safe Mode Indicator */}
      <Link
        href="/settings"
        className={cn(
          "mx-3 mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
          safeMode
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-900"
            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900"
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Safe Mode: {safeMode ? "ON" : "OFF"}
      </Link>

      {/* Workflow Steps */}
      <nav className="flex-1 space-y-1 p-3">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workflow
        </p>
        {workflowSteps.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item.step}
              </div>
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t p-3">
        {bottomNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
