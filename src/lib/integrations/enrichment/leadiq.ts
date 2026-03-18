import type { EnrichmentProvider, EnrichmentResult } from "./adapter";

export class LeadIQProvider implements EnrichmentProvider {
  name = "leadiq";
  private apiKey: string;
  private baseUrl = "https://api.leadiq.com/graphql";

  constructor() {
    this.apiKey = process.env.LEADIQ_API_KEY || "";
  }

  async enrichCompany(domain: string): Promise<EnrichmentResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query SearchPeople($input: SearchPeopleInput!) {
            searchPeople(input: $input) {
              results {
                currentPositions {
                  companyName
                  companyId
                }
              }
            }
          }`,
          variables: {
            input: {
              limit: 1,
              companyCriteria: { domain },
            },
          },
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const company = data?.data?.searchPeople?.results?.[0]?.currentPositions?.[0];
      if (!company) return null;

      return {
        source: "leadiq",
        company: {
          name: company.companyName,
          domain,
        },
        raw: data,
      };
    } catch (error) {
      console.error("LeadIQ enrichment error:", error);
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
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query SearchPeople($input: SearchPeopleInput!) {
            searchPeople(input: $input) {
              results {
                firstName
                lastName
                emails { value type }
                phones { value type }
                linkedInUrl
                currentPositions { title companyName }
              }
            }
          }`,
          variables: {
            input: {
              limit: 1,
              fullName: `${params.firstName} ${params.lastName}`,
              companyCriteria: { domain: params.companyDomain },
            },
          },
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const person = data?.data?.searchPeople?.results?.[0];
      if (!person) return null;

      return {
        source: "leadiq",
        contact: {
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.emails?.[0]?.value,
          phone: person.phones?.[0]?.value,
          title: person.currentPositions?.[0]?.title,
          linkedinUrl: person.linkedInUrl,
        },
        raw: person,
      };
    } catch (error) {
      console.error("LeadIQ contact enrichment error:", error);
      return null;
    }
  }
}
