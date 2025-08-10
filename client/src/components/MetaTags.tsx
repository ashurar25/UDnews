
import { useEffect } from 'react';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

const MetaTags = ({ title, description, image, url, type = "article" }: MetaTagsProps) => {
  useEffect(() => {
    // Update document title
    document.title = `${title} - UD News`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph tags
    const updateOrCreateMeta = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Open Graph tags
    updateOrCreateMeta('og:title', title);
    updateOrCreateMeta('og:description', description);
    updateOrCreateMeta('og:type', type);
    
    if (image) {
      updateOrCreateMeta('og:image', image);
    }
    
    if (url) {
      updateOrCreateMeta('og:url', url);
    }

    // Twitter Card tags
    updateOrCreateMeta('twitter:card', 'summary_large_image', false);
    updateOrCreateMeta('twitter:title', title, false);
    updateOrCreateMeta('twitter:description', description, false);
    
    if (image) {
      updateOrCreateMeta('twitter:image', image, false);
    }

    // Schema.org JSON-LD
    const existingSchema = document.querySelector('#article-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    if (type === 'article') {
      const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": image,
        "url": url,
        "datePublished": new Date().toISOString(),
        "author": {
          "@type": "Organization",
          "name": "UD News"
        },
        "publisher": {
          "@type": "Organization",
          "name": "UD News",
          "logo": {
            "@type": "ImageObject",
            "url": "/logo.jpg"
          }
        }
      };

      const script = document.createElement('script');
      script.id = 'article-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [title, description, image, url, type]);

  return null;
};

export default MetaTags;
