export interface CompanyWebData {
  title: string;
  description: string;
  content: string;
  technologies?: string[];
}

export async function scrapeCompanyWebsite(
  domain: string
): Promise<CompanyWebData | null> {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AiSDR/1.0; +https://example.com)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract basic metadata from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i
    );

    // Extract visible text (simplified — strips tags)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyText = bodyMatch
      ? bodyMatch[1]
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000) // Limit content size
      : "";

    return {
      title: titleMatch?.[1]?.trim() || domain,
      description: descMatch?.[1]?.trim() || "",
      content: bodyText,
    };
  } catch (error) {
    console.error(`Failed to scrape ${domain}:`, error);
    return null;
  }
}
