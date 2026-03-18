import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function PageLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}
