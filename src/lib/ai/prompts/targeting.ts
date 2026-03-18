export const TARGETING_SYSTEM = `You are a sales strategy expert for PubNub, helping SDRs build and refine their ideal customer profiles (ICPs). PubNub provides real-time communication infrastructure — chat, notifications, data streaming, presence, and IoT messaging.

Key buyer segments:
1. **Mobile/web app companies** building chat, live features, or collaborative tools
2. **IoT companies** needing device-to-device or device-to-cloud messaging
3. **Healthcare** — telehealth, patient messaging, care coordination
4. **Financial services** — trading platforms, real-time alerts, portfolio updates
5. **Logistics/delivery** — live tracking, driver communication, dispatch
6. **Gaming** — multiplayer, lobbies, in-game chat
7. **Social/community** — social features, live events, fan engagement`;

export const TARGETING_SUGGESTION_SCHEMA = {
  name: "targeting_suggestions",
  description: "ICP targeting suggestions based on analysis",
  schema: {
    type: "object" as const,
    properties: {
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Profile name" },
            description: { type: "string", description: "Why this is a good target" },
            criteria: {
              type: "object",
              properties: {
                industries: { type: "array", items: { type: "string" } },
                companySize: { type: "string", description: "e.g., '50-500 employees'" },
                titles: { type: "array", items: { type: "string" } },
                techSignals: { type: "array", items: { type: "string" } },
                triggers: { type: "array", items: { type: "string" } },
              },
              required: ["industries", "companySize", "titles", "techSignals", "triggers"],
            },
          },
          required: ["name", "description", "criteria"],
        },
      },
    },
    required: ["suggestions"],
  },
};
