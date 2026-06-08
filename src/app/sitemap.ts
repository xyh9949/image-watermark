import { MetadataRoute } from 'next';
import { SITE_URL } from './lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/compress`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}
