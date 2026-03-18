import type { Prospect, Company, ResearchBrief, Message, SequenceEnrollment, Signal } from "@prisma/client";

export type ProspectWithCompany = Prospect & {
  company: Company;
};

export type ProspectFull = Prospect & {
  company: Company & { signals: Signal[] };
  researchBrief: ResearchBrief | null;
  messages: Message[];
  sequenceEnrollments: SequenceEnrollment[];
};

export type ProspectListItem = Prospect & {
  company: Company;
  researchBrief: { id: string; updatedAt: Date } | null;
};
