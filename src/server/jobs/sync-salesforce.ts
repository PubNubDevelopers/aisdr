import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/db";
import { findAccountByDomain, findContactByEmail } from "@/lib/integrations/salesforce/queries";

export const syncSalesforce = inngest.createFunction(
  { id: "sync-salesforce", retries: 2 },
  { event: "salesforce/sync" },
  async ({ event }) => {
    const { companyId } = event.data;

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      include: { prospects: true },
    });

    // Check if company exists in Salesforce
    if (company.domain) {
      const sfAccount = await findAccountByDomain(company.domain);
      if (sfAccount) {
        await prisma.company.update({
          where: { id: company.id },
          data: {
            salesforceId: sfAccount.Id,
            industry: sfAccount.Industry || company.industry,
            employeeCount: sfAccount.NumberOfEmployees || company.employeeCount,
          },
        });
      }
    }

    // Check prospects against SF contacts
    for (const prospect of company.prospects) {
      if (prospect.email) {
        const sfContact = await findContactByEmail(prospect.email);
        if (sfContact) {
          await prisma.prospect.update({
            where: { id: prospect.id },
            data: { salesforceId: sfContact.Id },
          });
        }
      }
    }

    return { synced: true, companyId };
  }
);
