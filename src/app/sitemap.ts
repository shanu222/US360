import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/docs/setup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/docs/email`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];
}
