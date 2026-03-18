export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
}

export async function fetchCompanyNews(
  companyName: string,
  domain?: string
): Promise<NewsItem[]> {
  // Uses a web search/news API to find recent company news
  // In production, this would use NewsAPI, Google News API, or similar
  // For MVP, returns empty — can be populated when API keys are configured

  const query = domain
    ? `"${companyName}" OR site:${domain}`
    : `"${companyName}"`;

  try {
    // Placeholder for news API integration
    // Example with NewsAPI:
    // const response = await fetch(
    //   `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10`,
    //   { headers: { "X-Api-Key": process.env.NEWS_API_KEY! } }
    // );
    console.log(`News search query: ${query}`);
    return [];
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
}

export async function fetchFundingData(
  companyName: string
): Promise<{
  lastRound?: { type: string; amount: string; date: string; investors: string[] };
  totalFunding?: string;
} | null> {
  // In production, use Crunchbase API or similar
  // Placeholder for MVP
  try {
    console.log(`Funding lookup: ${companyName}`);
    return null;
  } catch (error) {
    console.error("Funding fetch error:", error);
    return null;
  }
}
