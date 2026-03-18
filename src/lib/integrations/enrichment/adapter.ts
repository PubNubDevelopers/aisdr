export interface EnrichmentResult {
  source: string;
  company?: {
    name: string;
    domain?: string;
    description?: string;
    industry?: string;
    employeeCount?: number;
    fundingStage?: string;
    fundingTotal?: number;
    techStack?: string[];
    headquarters?: string;
  };
  contact?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    title?: string;
    linkedinUrl?: string;
  };
  raw?: Record<string, unknown>;
}

export interface EnrichmentProvider {
  name: string;
  enrichCompany(domain: string): Promise<EnrichmentResult | null>;
  enrichContact(params: {
    firstName: string;
    lastName: string;
    companyDomain: string;
  }): Promise<EnrichmentResult | null>;
  searchCompanies?(
    criteria: Record<string, unknown>,
    limit?: number
  ): Promise<EnrichmentResult[]>;
}

export function mergeEnrichmentResults(results: EnrichmentResult[]): {
  company: NonNullable<EnrichmentResult["company"]>;
  contacts: NonNullable<EnrichmentResult["contact"]>[];
  sources: string[];
} {
  const merged: {
    company: Record<string, unknown>;
    contacts: NonNullable<EnrichmentResult["contact"]>[];
    sources: string[];
  } = {
    company: {},
    contacts: [],
    sources: [],
  };

  for (const result of results) {
    merged.sources.push(result.source);

    if (result.company) {
      // Merge company data — later sources fill in gaps
      for (const [key, value] of Object.entries(result.company)) {
        if (value !== undefined && value !== null && !merged.company[key]) {
          merged.company[key] = value;
        }
      }
      // Merge arrays (like techStack)
      if (result.company.techStack?.length) {
        const existing = (merged.company.techStack as string[]) || [];
        merged.company.techStack = Array.from(
          new Set([...existing, ...result.company.techStack])
        );
      }
    }

    if (result.contact) {
      // Dedup contacts by name
      const existing = merged.contacts.find(
        (c) =>
          c.firstName === result.contact!.firstName &&
          c.lastName === result.contact!.lastName
      );
      if (existing) {
        // Fill in missing fields
        if (!existing.email && result.contact.email) existing.email = result.contact.email;
        if (!existing.phone && result.contact.phone) existing.phone = result.contact.phone;
        if (!existing.linkedinUrl && result.contact.linkedinUrl)
          existing.linkedinUrl = result.contact.linkedinUrl;
      } else {
        merged.contacts.push(result.contact);
      }
    }
  }

  return {
    company: merged.company as NonNullable<EnrichmentResult["company"]>,
    contacts: merged.contacts,
    sources: merged.sources,
  };
}
