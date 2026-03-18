import {
  createOutreachProspect,
  findOutreachProspectByEmail,
  addProspectToSequence,
  createPersonalizedEmail,
  isOutreachConfigured,
} from "./client";
import { prisma } from "@/lib/db";

export async function pushProspectToOutreach(params: {
  prospectId: string;
  sequenceId: number;
  mailboxId?: number;
}): Promise<{ success: boolean; outreachProspectId?: number; sequenceStateId?: number; error?: string }> {
  if (!isOutreachConfigured()) {
    return { success: false, error: "Outreach not configured" };
  }

  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: params.prospectId },
    include: { company: true, messages: { where: { status: "APPROVED" } } },
  });

  try {
    // 1. Find or create prospect in Outreach
    let outreachProspectId: number;

    if (prospect.outreachId) {
      outreachProspectId = parseInt(prospect.outreachId, 10);
    } else if (prospect.email) {
      const existing = await findOutreachProspectByEmail(prospect.email);
      if (existing) {
        outreachProspectId = existing.id;
      } else {
        const created = await createOutreachProspect({
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          email: prospect.email,
          phone: prospect.phone ?? undefined,
          title: prospect.title ?? undefined,
          company: prospect.company.name,
          linkedinUrl: prospect.linkedinUrl ?? undefined,
          tags: prospect.tags,
        });
        outreachProspectId = created.id;
      }
    } else {
      const created = await createOutreachProspect({
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        title: prospect.title ?? undefined,
        company: prospect.company.name,
      });
      outreachProspectId = created.id;
    }

    // 2. Save Outreach ID on our prospect
    await prisma.prospect.update({
      where: { id: params.prospectId },
      data: { outreachId: String(outreachProspectId) },
    });

    // 3. Add to sequence
    const sequenceState = await addProspectToSequence({
      prospectId: outreachProspectId,
      sequenceId: params.sequenceId,
      mailboxId: params.mailboxId,
    });

    // 4. Create personalized email steps from approved messages
    const emailMessages = prospect.messages.filter((m) => m.channel === "EMAIL");
    for (const msg of emailMessages) {
      if (msg.sequenceStep) {
        await createPersonalizedEmail({
          sequenceStateId: sequenceState.id,
          stepNumber: msg.sequenceStep,
          subject: msg.subject || "",
          body: msg.content,
        });
      }
    }

    // 5. Create sequence enrollment record
    await prisma.sequenceEnrollment.create({
      data: {
        prospectId: params.prospectId,
        sequenceName: `Sequence #${params.sequenceId}`,
        outreachSequenceId: String(params.sequenceId),
        status: "ACTIVE",
      },
    });

    // 6. Update prospect status
    await prisma.prospect.update({
      where: { id: params.prospectId },
      data: { status: "IN_SEQUENCE" },
    });

    return {
      success: true,
      outreachProspectId,
      sequenceStateId: sequenceState.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error pushing to Outreach",
    };
  }
}

export async function bulkPushToOutreach(params: {
  prospectIds: string[];
  sequenceId: number;
  mailboxId?: number;
}): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const prospectId of params.prospectIds) {
    const result = await pushProspectToOutreach({
      prospectId,
      sequenceId: params.sequenceId,
      mailboxId: params.mailboxId,
    });

    if (result.success) {
      succeeded++;
    } else {
      failed++;
      errors.push(`${prospectId}: ${result.error}`);
    }
  }

  return { succeeded, failed, errors };
}
