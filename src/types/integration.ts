export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  status: "connected" | "disconnected" | "error";
  lastSyncAt?: Date;
}

export interface SalesforceDedup {
  isDuplicate: boolean;
  account?: { id: string; name: string; owner: string };
  contact?: { id: string; name: string; email: string };
}
