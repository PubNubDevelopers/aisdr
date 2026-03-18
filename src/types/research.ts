export interface CompanySnapshot {
  whatTheyDo: string;
  size: string;
  funding: string;
  growth: string;
}

export interface PersonalizationHook {
  hook: string;
  source: string;
  relevance: string;
}

export interface KeyPerson {
  name: string;
  title: string;
  background: string;
}

export interface ResearchBriefData {
  companySnapshot: CompanySnapshot;
  realtimeRelevance: string;
  keyPeople: KeyPerson[];
  personalizationHooks: PersonalizationHook[];
  competitiveIntel: string;
  recommendedAngle: string;
}
