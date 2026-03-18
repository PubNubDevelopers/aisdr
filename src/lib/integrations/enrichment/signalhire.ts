import type { EnrichmentProvider, EnrichmentResult } from "./adapter";

export class SignalHireProvider implements EnrichmentProvider {
  name = "signalhire";
  private apiKey: string;
  private baseUrl = "https://www.signalhire.com/api/v1";

  constructor() {
    this.apiKey = process.env.SIGNALHIRE_API_KEY || "";
  }

  async enrichCompany(domain: string): Promise<EnrichmentResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/candidate/search`,
        {
          method: "POST",
          headers: {
            apitoken: this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ company_website: domain }],
          }),
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      const result = data?.items?.[0];
      if (!result) return null;

      return {
        source: "signalhire",
        company: {
          name: result.company_name || domain,
          domain,
        },
        raw: result,
      };
    } catch (error) {
      console.error("SignalHire enrichment error:", error);
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
        `${this.baseUrl}/candidate/search`,
        {
          method: "POST",
          headers: {
            apitoken: this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [
              {
                full_name: `${params.firstName} ${params.lastName}`,
                company_website: params.companyDomain,
              },
            ],
          }),
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      const person = data?.items?.[0];
      if (!person) return null;

      return {
        source: "signalhire",
        contact: {
          firstName: person.first_name || params.firstName,
          lastName: person.last_name || params.lastName,
          email: person.emails?.[0],
          phone: person.phones?.[0],
          title: person.title,
          linkedinUrl: person.linkedin,
        },
        raw: person,
      };
    } catch (error) {
      console.error("SignalHire contact enrichment error:", error);
      return null;
    }
  }
}
