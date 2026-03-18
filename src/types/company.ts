import type { Company, Signal } from "@prisma/client";

export type CompanyWithSignals = Company & {
  signals: Signal[];
};
