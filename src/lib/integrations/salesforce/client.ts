// @ts-expect-error — jsforce lacks type declarations
import jsforce from "jsforce";

let connection: jsforce.Connection | null = null;

export async function getSalesforceConnection(): Promise<jsforce.Connection> {
  if (connection) return connection;

  const conn = new jsforce.Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com",
  });

  await conn.login(
    process.env.SALESFORCE_USERNAME!,
    process.env.SALESFORCE_PASSWORD! + (process.env.SALESFORCE_SECURITY_TOKEN || "")
  );

  connection = conn;
  return conn;
}

export function resetConnection() {
  connection = null;
}
