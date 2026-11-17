import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/metadata';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/how-it-works', '/templates', '/providers', '/feedback', '/privacy', '/terms']
    .map(path => ({ url: `${siteUrl}${path}`, changeFrequency: 'monthly', priority: path ? 0.6 : 1 }));
}
