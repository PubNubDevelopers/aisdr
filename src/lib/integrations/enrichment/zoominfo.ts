import type { EnrichmentProvider, EnrichmentResult } from "./adapter";

// ZoomInfo API client — requires API credentials
// https://api.zoominfo.com/
export class ZoomInfoProvider implements EnrichmentProvider {
  name = "zoominfo";
  private apiKey: string;
  private baseUrl = "https://api.zoominfo.com";

  constructor() {
    this.apiKey = process.env.ZOOMINFO_CLIENT_ID || "";
  }

  async enrichCompany(domain: string): Promise<EnrichmentResult | null> {
    if (!this.apiKey) {
      console.warn("ZoomInfo not configured — skipping enrichment");
      return null;
    }

    try {
      // In production, this would call the ZoomInfo Company Enrich API
      // POST /enrich/company
      // For now, return structure for integration testing
      const response = await fetch(`${this.baseUrl}/enrich/company`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchCompanyInput: [{ companyWebsite: domain }],
          outputFields: [
            "id", "name", "website", "description", "industry",
            "employeeCount", "revenue", "fundingInfo", "techStack",
            "headquarters",
          ],
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const company = data?.result?.data?.[0];
      if (!company) return null;

      return {
        source: "zoominfo",
        company: {
          name: company.name,
          domain: company.website,
          description: company.description,
          industry: company.industry,
          employeeCount: company.employeeCount,
          fundingStage: company.fundingInfo?.lastFundingRound,
          fundingTotal: company.fundingInfo?.totalFunding,
          techStack: company.techStack || [],
          headquarters: company.headquarters?.city
            ? `${company.headquarters.city}, ${company.headquarters.state}`
            : undefined,
        },
        raw: company,
      };
    } catch (error) {
      console.error("ZoomInfo enrichment error:", error);
      return null;
    }
  }

  async enrichContact(params: {
    firstName: string;
    lastName: string;
    companyDomain: string;
  }): Promise<EnrichmentResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${this.baseUrl}/enrich/contact`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchPersonInput: [
            {
              firstName: params.firstName,
              lastName: params.lastName,
              companyWebsite: params.companyDomain,
            },
          ],
          outputFields: [
            "firstName", "lastName", "email", "phone", "jobTitle",
            "linkedinUrl",
          ],
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const contact = data?.result?.data?.[0];
      if (!contact) return null;

      return {
        source: "zoominfo",
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          title: contact.jobTitle,
          linkedinUrl: contact.linkedinUrl,
        },
        raw: contact,
      };
    } catch (error) {
      console.error("ZoomInfo contact enrichment error:", error);
      return null;
    }
  }

  async searchCompanies(
    criteria: {
      industries?: string[];
      companySize?: string;
      techSignals?: string[];
      titles?: string[];
    },
    limit = 25
  ): Promise<EnrichmentResult[]> {
    if (!this.apiKey) return [];

    try {
      // Build ZoomInfo company search payload
      const filters: Record<string, unknown> = {};

      if (criteria.industries?.length) {
        filters.industryKeywords = criteria.industries;
      }
      if (criteria.companySize) {
        const match = criteria.companySize.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
          filters.employeeCount = {
            min: parseInt(match[1], 10),
            max: parseInt(match[2], 10),
          };
        }
      }
      if (criteria.techSignals?.length) {
        filters.techAttributes = criteria.techSignals;
      }

      const response = await fetch(`${this.baseUrl}/search/company`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...filters,
          rpp: limit,
          outputFields: [
            "id", "name", "website", "description", "industry",
            "employeeCount", "revenue", "fundingInfo", "techStack",
            "headquarters",
          ],
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const companies = data?.result?.data || [];

      return companies.map(
        (company: Record<string, unknown>): EnrichmentResult => ({
          source: "zoominfo",
          company: {
            name: company.name as string,
            domain: company.website as string,
            description: company.description as string,
            industry: company.industry as string,
            employeeCount: company.employeeCount as number,
            fundingStage: (company.fundingInfo as Record<string, string>)?.lastFundingRound,
            techStack: (company.techStack as string[]) || [],
            headquarters: (company.headquarters as Record<string, string>)?.city
              ? `${(company.headquarters as Record<string, string>).city}, ${(company.headquarters as Record<string, string>).state}`
              : undefined,
          },
          raw: company,
        })
      );
    } catch (error) {
      console.error("ZoomInfo search error:", error);
      return [];
    }
  }

  async searchContacts(
    criteria: {
      titles?: string[];
      companyDomains?: string[];
    },
    limit = 25
  ): Promise<EnrichmentResult[]> {
    if (!this.apiKey) return [];

    try {
      const filters: Record<string, unknown> = {};

      if (criteria.titles?.length) {
        filters.jobTitleKeywords = criteria.titles;
      }
      if (criteria.companyDomains?.length) {
        filters.companyWebsite = criteria.companyDomains;
      }

      const response = await fetch(`${this.baseUrl}/search/contact`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...filters,
          rpp: limit,
          outputFields: [
            "firstName", "lastName", "email", "phone", "jobTitle",
            "linkedinUrl", "companyName", "companyWebsite",
          ],
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const contacts = data?.result?.data || [];

      return contacts.map(
        (contact: Record<string, unknown>): EnrichmentResult => ({
          source: "zoominfo",
          contact: {
            firstName: contact.firstName as string,
            lastName: contact.lastName as string,
            email: contact.email as string,
            phone: contact.phone as string,
            title: contact.jobTitle as string,
            linkedinUrl: contact.linkedinUrl as string,
          },
          company: {
            name: contact.companyName as string,
            domain: contact.companyWebsite as string,
          },
          raw: contact,
        })
      );
    } catch (error) {
      console.error("ZoomInfo contact search error:", error);
      return [];
    }
  }
}
