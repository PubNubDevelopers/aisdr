import type { EnrichmentProvider, EnrichmentResult } from "./adapter";

export class LushaProvider implements EnrichmentProvider {
  name = "lusha";
  private apiKey: string;
  private baseUrl = "https://api.lusha.com";

  constructor() {
    this.apiKey = process.env.LUSHA_API_KEY || "";
  }

  async enrichCompany(domain: string): Promise<EnrichmentResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/company?domain=${encodeURIComponent(domain)}`,
        {
          headers: { api_key: this.apiKey },
        }
      );

      if (!response.ok) return null;
      const data = await response.json();

      return {
        source: "lusha",
        company: {
          name: data.companyName,
          domain: data.website,
          description: data.description,
          industry: data.industry,
          employeeCount: data.employeesRange
            ? parseInt(data.employeesRange.split("-")[0], 10)
            : undefined,
          headquarters: data.location,
        },
        raw: data,
      };
    } catch (error) {
      console.error("Lusha company enrichment error:", error);
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
      const response = await fetch(
        `${this.baseUrl}/person?firstName=${encodeURIComponent(params.firstName)}&lastName=${encodeURIComponent(params.lastName)}&company=${encodeURIComponent(params.companyDomain)}`,
        {
          headers: { api_key: this.apiKey },
        }
      );

      if (!response.ok) return null;
      const data = await response.json();

      return {
        source: "lusha",
        contact: {
          firstName: data.firstName || params.firstName,
          lastName: data.lastName || params.lastName,
          email: data.emailAddresses?.[0]?.email,
          phone: data.phoneNumbers?.[0]?.internationalNumber,
          title: data.jobTitle,
          linkedinUrl: data.socialNetworks?.find(
            (s: { type: string; url: string }) => s.type === "linkedin"
          )?.url,
        },
        raw: data,
      };
    } catch (error) {
      console.error("Lusha contact enrichment error:", error);
      return null;
    }
  }
}
