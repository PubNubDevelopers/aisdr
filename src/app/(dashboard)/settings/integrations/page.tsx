import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Database, Cloud, Brain, BarChart3, Phone, Smartphone, Search } from "lucide-react";

function getIntegrations() {
  return [
    {
      name: "Perplexity",
      description: "AI-powered prospect discovery, company research, and enrichment",
      icon: Search,
      configured: !!process.env.PERPLEXITY_API_KEY,
    },
    {
      name: "Claude AI",
      description: "Research briefs, message composition, scoring, analysis",
      icon: Brain,
      configured: !!process.env.ANTHROPIC_API_KEY,
    },
    {
      name: "Salesforce",
      description: "CRM — read accounts/contacts, dedup check, activity logging",
      icon: Database,
      configured: !!process.env.SALESFORCE_CLIENT_ID,
    },
    {
      name: "Outreach",
      description: "Push prospects to sequences, pull engagement data",
      icon: BarChart3,
      configured: !!process.env.OUTREACH_ACCESS_TOKEN,
    },
    {
      name: "ZoomInfo",
      description: "Company and contact enrichment, intent data (optional — Perplexity is primary)",
      icon: Cloud,
      configured: !!process.env.ZOOMINFO_CLIENT_ID,
    },
    {
      name: "Gong",
      description: "Call transcripts and talk track insights for outreach personalization",
      icon: Phone,
      configured: !!process.env.GONG_ACCESS_KEY,
    },
    {
      name: "Apptopia",
      description: "App intelligence — download trends, SDK usage, growth signals",
      icon: Smartphone,
      configured: !!process.env.APPTOPIA_API_KEY,
    },
  ];
}

export default function IntegrationsPage() {
  const integrations = getIntegrations();

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect your sales tools"
      />

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <integration.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={integration.configured ? "success" : "warning"}
                  >
                    {integration.configured ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Settings className="mr-2 h-3 w-3" />
                  {integration.configured ? "Configure" : "Connect"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
