import { generateStructured } from "@/lib/ai/client";
import { SCORING_SYSTEM, SCORING_SCHEMA, buildScoringPrompt } from "@/lib/ai/prompts/scoring";
import { prisma } from "@/lib/db";
import {
  searchCompanies as perplexitySearchCompanies,
  searchContacts as perplexitySearchContacts,
  isPerplexityConfigured,
} from "@/lib/integrations/perplexity/client";
import { checkDuplicateInSalesforce } from "@/lib/integrations/salesforce/sync";

export interface DiscoveredProspect {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  companyName: string;
  companyDomain?: string;
  companyDescription?: string;
  industry?: string;
  employeeCount?: number;
  fundingStage?: string;
  techStack?: string[];
  score?: number;
  scoreExplanation?: string;
  salesforceDedup: { isDuplicate: boolean; account?: { id: string; name: string; owner: string } };
  source: string;
}

export async function discoverProspects(params: {
  profileId: string;
  userId: string;
  limit?: number;
}): Promise<DiscoveredProspect[]> {
  const { profileId, limit = 15 } = params;

  // 1. Load targeting profile
  const profile = await prisma.targetingProfile.findUniqueOrThrow({
    where: { id: profileId },
  });

  const criteria = profile.criteria as {
    industries?: string[];
    companySize?: string;
    titles?: string[];
    techSignals?: string[];
    triggers?: string[];
  };

  if (!isPerplexityConfigured()) {
    throw new Error("Perplexity API key not configured. Add PERPLEXITY_API_KEY to your environment.");
  }

  // 2. Search for companies matching criteria via Perplexity
  const companies = await perplexitySearchCompanies({
    ...criteria,
    limit,
  });

  if (companies.length === 0) {
    return [];
  }

  // 3. For each company, find contacts matching title criteria
  const discovered: DiscoveredProspect[] = [];

  // Run contact searches in parallel (batches of 5 to avoid rate limits)
  const batchSize = 5;
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);

    const contactResults = await Promise.all(
      batch.map(async (company) => {
        const contacts = await perplexitySearchContacts({
          companyName: company.name,
          companyDomain: company.domain,
          titles: criteria.titles,
          limit: 3,
        });
        return { company, contacts };
      })
    );

    for (const { company, contacts } of contactResults) {
      // If no contacts found, create a placeholder entry for the company
      if (contacts.length === 0) {
        const dedup = await checkDuplicateInSalesforce({
          domain: company.domain,
        });

        discovered.push({
          firstName: "Unknown",
          lastName: "Contact",
          companyName: company.name,
          companyDomain: company.domain,
          companyDescription: company.description,
          industry: company.industry,
          employeeCount: company.employeeCount,
          fundingStage: company.fundingStage,
          techStack: company.techStack,
          salesforceDedup: dedup,
          source: "perplexity",
        });
        continue;
      }

      for (const contact of contacts) {
        // Skip if we already have this prospect in our DB
        if (contact.email) {
          const existing = await prisma.prospect.findFirst({
            where: { email: contact.email },
          });
          if (existing) continue;
        }

        const dedup = await checkDuplicateInSalesforce({
          email: contact.email,
          domain: company.domain,
        });

        discovered.push({
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          title: contact.title,
          linkedinUrl: contact.linkedinUrl,
          companyName: company.name,
          companyDomain: company.domain,
          companyDescription: company.description,
          industry: company.industry,
          employeeCount: company.employeeCount,
          fundingStage: company.fundingStage,
          techStack: company.techStack,
          salesforceDedup: dedup,
          source: "perplexity",
        });
      }
    }
  }

  // 4. AI score and rank all discovered prospects
  const scored = await Promise.all(
    discovered.map(async (prospect) => {
      try {
        const prompt = buildScoringPrompt({
          prospectName: `${prospect.firstName} ${prospect.lastName}`,
          prospectTitle: prospect.title,
          companyName: prospect.companyName,
          companyDescription: prospect.companyDescription,
          industry: prospect.industry,
          employeeCount: prospect.employeeCount,
          fundingStage: prospect.fundingStage,
          techStack: prospect.techStack,
        });

        const result = await generateStructured<{
          score: number;
          explanation: string;
        }>({
          system: SCORING_SYSTEM,
          prompt,
          schema: SCORING_SCHEMA,
        });

        return {
          ...prospect,
          score: result.score,
          scoreExplanation: result.explanation,
        };
      } catch {
        return prospect;
      }
    })
  );

  // 5. Sort by score descending
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return scored;
}

export async function importDiscoveredProspects(params: {
  prospects: DiscoveredProspect[];
  userId: string;
}): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const p of params.prospects) {
    try {
      // Find or create company
      let company;
      if (p.companyDomain) {
        company = await prisma.company.upsert({
          where: { domain: p.companyDomain },
          create: {
            name: p.companyName,
            domain: p.companyDomain,
            description: p.companyDescription,
            industry: p.industry,
            employeeCount: p.employeeCount,
            fundingStage: p.fundingStage,
            techStack: p.techStack || [],
          },
          update: {
            description: p.companyDescription || undefined,
            industry: p.industry || undefined,
            employeeCount: p.employeeCount || undefined,
          },
        });
      } else {
        company = await prisma.company.create({
          data: {
            name: p.companyName,
            description: p.companyDescription,
            industry: p.industry,
            employeeCount: p.employeeCount,
            techStack: p.techStack || [],
          },
        });
      }

      await prisma.prospect.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          title: p.title,
          linkedinUrl: p.linkedinUrl,
          companyId: company.id,
          ownerId: params.userId,
          score: p.score,
          scoreExplanation: p.scoreExplanation,
        },
      });

      imported++;
    } catch {
      skipped++;
    }
  }

  return { imported, skipped };
}
