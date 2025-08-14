import React from 'react';
import { toAbsoluteUrl } from '@/lib/url';

interface ArticleJsonLdProps {
  urlPath: string; // e.g. `/news/123-some-slug`
  title: string;
  description?: string;
  image?: string; // relative or absolute
  datePublished?: string; // ISO
  dateModified?: string; // ISO
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string; // relative or absolute
}

const ArticleJsonLd: React.FC<ArticleJsonLdProps> = ({
  urlPath,
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName = 'UD News Update',
  publisherName = 'UD News Update',
  publisherLogo = '/logo512.png',
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': toAbsoluteUrl(urlPath),
    },
    headline: title,
    description: description,
    image: image ? [toAbsoluteUrl(image)] : undefined,
    datePublished,
    dateModified: dateModified || datePublished,
    author: authorName ? [{ '@type': 'Person', name: authorName }] : undefined,
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(publisherLogo),
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default ArticleJsonLd;
