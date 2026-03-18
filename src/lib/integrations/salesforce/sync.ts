import { getSalesforceConnection } from "./client";
import { findAccountByDomain, findContactByEmail } from "./queries";
import { prisma } from "@/lib/db";

function isSalesforceConfigured(): boolean {
  return !!(process.env.SALESFORCE_USERNAME && process.env.SALESFORCE_CLIENT_ID);
}

export async function checkDuplicateInSalesforce(params: {
  email?: string;
  domain?: string;
}): Promise<{
  isDuplicate: boolean;
  account?: { id: string; name: string; owner: string };
  contact?: { id: string; name: string; email: string };
}> {
  try {
    const result: {
      isDuplicate: boolean;
      account?: { id: string; name: string; owner: string };
      contact?: { id: string; name: string; email: string };
    } = { isDuplicate: false };

    if (params.domain) {
      const account = await findAccountByDomain(params.domain);
      if (account) {
        result.isDuplicate = true;
        result.account = {
          id: account.Id,
          name: account.Name,
          owner: account.Owner?.Name || "Unknown",
        };
      }
    }

    if (params.email) {
      const contact = await findContactByEmail(params.email);
      if (contact) {
        result.isDuplicate = true;
        result.contact = {
          id: contact.Id,
          name: `${contact.FirstName} ${contact.LastName}`,
          email: contact.Email,
        };
      }
    }

    return result;
  } catch {
    // If Salesforce is not configured, skip dedup
    console.warn("Salesforce dedup check skipped — not configured");
    return { isDuplicate: false };
  }
}

export async function syncCompanyFromSalesforce(salesforceAccountId: string) {
  const conn = await getSalesforceConnection();
  const account = await conn.sobject("Account").retrieve(salesforceAccountId) as Record<string, unknown>;

  return prisma.company.upsert({
    where: { salesforceId: salesforceAccountId },
    create: {
      name: account.Name as string,
      domain: account.Website as string | undefined,
      industry: account.Industry as string | undefined,
      employeeCount: account.NumberOfEmployees as number | undefined,
      salesforceId: salesforceAccountId,
    },
    update: {
      name: account.Name as string,
      domain: account.Website as string | undefined,
      industry: account.Industry as string | undefined,
      employeeCount: account.NumberOfEmployees as number | undefined,
    },
  });
}

// --- Write operations ---

export async function createSalesforceAccount(params: {
  name: string;
  website?: string;
  industry?: string;
  numberOfEmployees?: number;
  description?: string;
}): Promise<string> {
  if (!isSalesforceConfigured()) throw new Error("Salesforce not configured");

  const conn = await getSalesforceConnection();
  const result = await conn.sobject("Account").create({
    Name: params.name,
    Website: params.website,
    Industry: params.industry,
    NumberOfEmployees: params.numberOfEmployees,
    Description: params.description,
  });

  if (!result.success) {
    throw new Error(`Failed to create Salesforce account: ${JSON.stringify(result.errors)}`);
  }

  return result.id;
}

export async function createSalesforceContact(params: {
  accountId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
}): Promise<string> {
  if (!isSalesforceConfigured()) throw new Error("Salesforce not configured");

  const conn = await getSalesforceConnection();
  const result = await conn.sobject("Contact").create({
    AccountId: params.accountId,
    FirstName: params.firstName,
    LastName: params.lastName,
    Email: params.email,
    Phone: params.phone,
    Title: params.title,
  });

  if (!result.success) {
    throw new Error(`Failed to create Salesforce contact: ${JSON.stringify(result.errors)}`);
  }

  return result.id;
}

export async function logSalesforceActivity(params: {
  whoId?: string; // Contact or Lead ID
  whatId?: string; // Account or Opportunity ID
  subject: string;
  description: string;
  type: "Email" | "Call" | "Other";
  status?: "Completed" | "Not Started";
}): Promise<string> {
  if (!isSalesforceConfigured()) throw new Error("Salesforce not configured");

  const conn = await getSalesforceConnection();
  const result = await conn.sobject("Task").create({
    WhoId: params.whoId,
    WhatId: params.whatId,
    Subject: params.subject,
    Description: params.description,
    Type: params.type,
    Status: params.status || "Completed",
    Priority: "Normal",
    ActivityDate: new Date().toISOString().split("T")[0],
  });

  if (!result.success) {
    throw new Error(`Failed to log Salesforce activity: ${JSON.stringify(result.errors)}`);
  }

  return result.id;
}

export async function updateSalesforceAccount(
  accountId: string,
  params: Record<string, unknown>
): Promise<void> {
  if (!isSalesforceConfigured()) throw new Error("Salesforce not configured");

  const conn = await getSalesforceConnection();
  const result = await conn.sobject("Account").update({
    Id: accountId,
    ...params,
  });

  if (!result.success) {
    throw new Error(`Failed to update Salesforce account: ${JSON.stringify(result.errors)}`);
  }
}

export async function syncProspectToSalesforce(prospectId: string): Promise<{
  accountId: string;
  contactId: string;
}> {
  if (!isSalesforceConfigured()) throw new Error("Salesforce not configured");

  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: { company: true },
  });

  // Find or create Account
  let sfAccountId: string;
  if (prospect.company.salesforceId) {
    sfAccountId = prospect.company.salesforceId;
  } else if (prospect.company.domain) {
    const existing = await findAccountByDomain(prospect.company.domain);
    if (existing) {
      sfAccountId = existing.Id;
    } else {
      sfAccountId = await createSalesforceAccount({
        name: prospect.company.name,
        website: prospect.company.domain,
        industry: prospect.company.industry ?? undefined,
        numberOfEmployees: prospect.company.employeeCount ?? undefined,
        description: prospect.company.description ?? undefined,
      });
    }
    // Save SF ID locally
    await prisma.company.update({
      where: { id: prospect.company.id },
      data: { salesforceId: sfAccountId },
    });
  } else {
    sfAccountId = await createSalesforceAccount({
      name: prospect.company.name,
    });
    await prisma.company.update({
      where: { id: prospect.company.id },
      data: { salesforceId: sfAccountId },
    });
  }

  // Find or create Contact
  let sfContactId: string;
  if (prospect.salesforceId) {
    sfContactId = prospect.salesforceId;
  } else if (prospect.email) {
    const existing = await findContactByEmail(prospect.email);
    if (existing) {
      sfContactId = existing.Id;
    } else {
      sfContactId = await createSalesforceContact({
        accountId: sfAccountId,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        email: prospect.email,
        phone: prospect.phone ?? undefined,
        title: prospect.title ?? undefined,
      });
    }
  } else {
    sfContactId = await createSalesforceContact({
      accountId: sfAccountId,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      title: prospect.title ?? undefined,
    });
  }

  // Save SF ID locally
  await prisma.prospect.update({
    where: { id: prospectId },
    data: { salesforceId: sfContactId },
  });

  return { accountId: sfAccountId, contactId: sfContactId };
}
