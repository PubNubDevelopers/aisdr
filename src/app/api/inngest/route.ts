import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { enrichProspect } from "@/server/jobs/enrich-prospect";
import { generateBriefJob } from "@/server/jobs/generate-brief";
import { syncSalesforce } from "@/server/jobs/sync-salesforce";
import { detectSignals, batchDetectSignals } from "@/server/jobs/detect-signals";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [enrichProspect, generateBriefJob, syncSalesforce, detectSignals, batchDetectSignals],
});
