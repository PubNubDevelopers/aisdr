import { prisma } from "@/lib/db";

export async function checkSalesforceDedup(params: {
  email?: string;
  companyDomain?: string;
  companyName?: string;
}): Promise<{
  existsInSalesforce: boolean;
  matchedAccount?: { id: string; name: string; owner: string };
  matchedContact?: { id: string; name: string; email: string };
}> {
  const result: {
    existsInSalesforce: boolean;
    matchedAccount?: { id: string; name: string; owner: string };
    matchedContact?: { id: string; name: string; email: string };
  } = { existsInSalesforce: false };

  // Check if prospect already exists in our DB with a Salesforce ID
  if (params.email) {
    const existing = await prisma.prospect.findFirst({
      where: {
        email: params.email,
        salesforceId: { not: null },
      },
      include: { company: true },
    });
    if (existing) {
      result.existsInSalesforce = true;
      result.matchedContact = {
        id: existing.salesforceId!,
        name: `${existing.firstName} ${existing.lastName}`,
        email: existing.email!,
      };
    }
  }

  if (params.companyDomain) {
    const existing = await prisma.company.findFirst({
      where: {
        domain: params.companyDomain,
        salesforceId: { not: null },
      },
    });
    if (existing) {
      result.existsInSalesforce = true;
      result.matchedAccount = {
        id: existing.salesforceId!,
        name: existing.name,
        owner: "See Salesforce",
      };
    }
  }

  return result;
}
