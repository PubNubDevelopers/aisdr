import type { EnrichmentProvider, EnrichmentResult } from "./adapter";
import { mergeEnrichmentResults } from "./adapter";
import { ZoomInfoProvider } from "./zoominfo";
import { LeadIQProvider } from "./leadiq";
import { LushaProvider } from "./lusha";
import { SignalHireProvider } from "./signalhire";

const providers: EnrichmentProvider[] = [
  new ZoomInfoProvider(),
  new LeadIQProvider(),
  new LushaProvider(),
  new SignalHireProvider(),
];

function getActiveProviders(): EnrichmentProvider[] {
  // Return providers that have API keys configured
  const envMap: Record<string, string | undefined> = {
    zoominfo: process.env.ZOOMINFO_CLIENT_ID,
    leadiq: process.env.LEADIQ_API_KEY,
    lusha: process.env.LUSHA_API_KEY,
    signalhire: process.env.SIGNALHIRE_API_KEY,
  };

  return providers.filter((p) => envMap[p.name]);
}

export async function enrichCompanyFromAll(domain: string) {
  const active = getActiveProviders();
  if (active.length === 0) return null;

  const results = await Promise.allSettled(
    active.map((p) => p.enrichCompany(domain))
  );

  const successful = results
    .filter(
      (r): r is PromiseFulfilledResult<EnrichmentResult | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);

  if (successful.length === 0) return null;
  return mergeEnrichmentResults(successful);
}

export async function enrichContactFromAll(params: {
  firstName: string;
  lastName: string;
  companyDomain: string;
}) {
  const active = getActiveProviders();
  if (active.length === 0) return null;

  const results = await Promise.allSettled(
    active.map((p) => p.enrichContact(params))
  );

  const successful = results
    .filter(
      (r): r is PromiseFulfilledResult<EnrichmentResult | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);

  if (successful.length === 0) return null;
  return mergeEnrichmentResults(successful);
}

export async function searchCompaniesFromZoomInfo(
  criteria: {
    industries?: string[];
    companySize?: string;
    techSignals?: string[];
    titles?: string[];
  },
  limit = 25
): Promise<EnrichmentResult[]> {
  const zi = new ZoomInfoProvider();
  return zi.searchCompanies(criteria, limit);
}
