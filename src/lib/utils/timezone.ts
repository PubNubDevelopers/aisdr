export function getOptimalSendTime(timezone: string): {
  hour: number;
  dayOfWeek: number[];
} {
  // Best engagement: Tuesday-Thursday, 8-10 AM local time
  // Timezone will be used for send-time optimization in Phase 2
  void timezone;
  return {
    hour: 9,
    dayOfWeek: [2, 3, 4], // Tue, Wed, Thu
  };
}

export function getTimezoneFromLocation(
  city?: string,
  state?: string,
  country?: string
): string {
  // Simplified — in production, use a proper timezone lookup
  if (country === "US" || country === "United States") {
    const eastern = ["NY", "FL", "GA", "MA", "PA", "NC", "VA", "CT", "NJ", "MD"];
    const central = ["TX", "IL", "MN", "WI", "TN", "MO", "IN"];
    const mountain = ["CO", "AZ", "UT", "NM"];
    const pacific = ["CA", "WA", "OR", "NV"];

    if (state && eastern.includes(state)) return "America/New_York";
    if (state && central.includes(state)) return "America/Chicago";
    if (state && mountain.includes(state)) return "America/Denver";
    if (state && pacific.includes(state)) return "America/Los_Angeles";
  }
  return "America/New_York"; // Default
}
