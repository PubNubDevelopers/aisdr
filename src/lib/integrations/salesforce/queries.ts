import { getSalesforceConnection } from "./client";

export interface SalesforceAccount {
  Id: string;
  Name: string;
  Website: string;
  Industry: string;
  NumberOfEmployees: number;
  OwnerId: string;
  Owner: { Name: string };
}

export interface SalesforceContact {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Title: string;
  AccountId: string;
}

export async function findAccountByDomain(domain: string): Promise<SalesforceAccount | null> {
  const conn = await getSalesforceConnection();
  const result = await conn.query<SalesforceAccount>(
    `SELECT Id, Name, Website, Industry, NumberOfEmployees, OwnerId, Owner.Name
     FROM Account
     WHERE Website LIKE '%${domain}%'
     LIMIT 1`
  );
  return result.records[0] || null;
}

export async function findContactByEmail(email: string): Promise<SalesforceContact | null> {
  const conn = await getSalesforceConnection();
  const result = await conn.query<SalesforceContact>(
    `SELECT Id, FirstName, LastName, Email, Title, AccountId
     FROM Contact
     WHERE Email = '${email}'
     LIMIT 1`
  );
  return result.records[0] || null;
}

export async function getClosedWonOpps(limit = 50): Promise<Array<{
  Id: string;
  Name: string;
  Amount: number;
  CloseDate: string;
  Account: { Name: string; Industry: string; NumberOfEmployees: number };
}>> {
  const conn = await getSalesforceConnection();
  const result = await conn.query(
    `SELECT Id, Name, Amount, CloseDate,
            Account.Name, Account.Industry, Account.NumberOfEmployees
     FROM Opportunity
     WHERE StageName = 'Closed Won'
     ORDER BY CloseDate DESC
     LIMIT ${limit}`
  );
  return result.records as Array<{
    Id: string;
    Name: string;
    Amount: number;
    CloseDate: string;
    Account: { Name: string; Industry: string; NumberOfEmployees: number };
  }>;
}
