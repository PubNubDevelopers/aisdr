import { inngest } from "@/lib/inngest";
import { generateResearchBrief } from "@/lib/ai/workflows/generate-brief";

export const generateBriefJob = inngest.createFunction(
  { id: "generate-brief", retries: 1 },
  { event: "research/generate-brief" },
  async ({ event }) => {
    const { prospectId } = event.data;
    const brief = await generateResearchBrief(prospectId);
    return { success: true, prospectId, angle: brief.recommendedAngle };
  }
);
