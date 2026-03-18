import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";
import { ZoomInfoProvider } from "@/lib/integrations/enrichment/zoominfo";
import { mergeEnrichmentResults } from "@/lib/integrations/enrichment/adapter";
import { scrapeCompanyWebsite } from "@/lib/integrations/web/scraper";
import { fetchCompanyNews } from "@/lib/integrations/web/news";
import { researchCompany, isPerplexityConfigured } from "@/lib/integrations/perplexity/client";

export const enrichProspect = inngest.createFunction(
  { id: "enrich-prospect", retries: 2 },
  { event: "prospect/enrich" },
  async ({ event }) => {
    const { prospectId } = event.data;

    const prospect = await prisma.prospect.findUniqueOrThrow({
      where: { id: prospectId },
      include: { company: true },
    });

    const company = prospect.company;
    const results = [];

    // 1. ZoomInfo enrichment (if configured)
    const zoominfo = new ZoomInfoProvider();
    if (company.domain) {
      const ziResult = await zoominfo.enrichCompany(company.domain);
      if (ziResult) results.push(ziResult);

      const contactResult = await zoominfo.enrichContact({
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        companyDomain: company.domain,
      });
      if (contactResult) results.push(contactResult);
    }

    // 1b. Perplexity enrichment (fallback if ZoomInfo returned nothing)
    if (results.length === 0 && isPerplexityConfigured()) {
      try {
        const pxResult = await researchCompany({
          companyName: company.name,
          companyDomain: company.domain ?? undefined,
        });
        if (pxResult) {
          results.push({
            source: "perplexity",
            company: {
              name: company.name,
              domain: company.domain ?? undefined,
              description: pxResult.description,
              industry: pxResult.industry,
              employeeCount: pxResult.employeeCount,
              fundingStage: pxResult.fundingStage,
              techStack: pxResult.techStack,
            },
          });
        }
      } catch (error) {
        console.error("Perplexity enrichment error:", error);
      }
    }

    // 2. Web scraping
    if (company.domain) {
      const webData = await scrapeCompanyWebsite(company.domain);
      if (webData) {
        results.push({
          source: "web_scrape",
          company: {
            name: company.name,
            description: webData.description,
            techStack: webData.technologies,
          },
        });
      }
    }

    // 3. News
    const news = await fetchCompanyNews(company.name, company.domain ?? undefined);

    // Merge and save results
    if (results.length > 0) {
      const merged = mergeEnrichmentResults(results);

      await prisma.company.update({
        where: { id: company.id },
        data: {
          description: merged.company.description ?? company.description,
          industry: merged.company.industry ?? company.industry,
          employeeCount: merged.company.employeeCount ?? company.employeeCount,
          fundingStage: merged.company.fundingStage ?? company.fundingStage,
          techStack: merged.company.techStack?.length
            ? merged.company.techStack
            : company.techStack,
          enrichmentData: { merged: merged.company, sources: merged.sources },
        },
      });

      // Update prospect contact info if found
      if (merged.contacts.length > 0) {
        const contact = merged.contacts[0];
        await prisma.prospect.update({
          where: { id: prospectId },
          data: {
            email: contact.email ?? prospect.email,
            phone: contact.phone ?? prospect.phone,
            linkedinUrl: contact.linkedinUrl ?? prospect.linkedinUrl,
            enrichmentData: { contact, sources: merged.sources },
          },
        });
      }
    }

    // Save news as signals
    for (const item of news) {
      await prisma.signal.create({
        data: {
          companyId: company.id,
          type: "NEWS",
          source: item.source,
          title: item.title,
          details: { url: item.url, snippet: item.snippet } as Parameters<typeof prisma.signal.create>[0]["data"]["details"],
          strength: 0.5,
        },
      });
    }

    return { enriched: results.length > 0, newsFound: news.length };
  }
);
