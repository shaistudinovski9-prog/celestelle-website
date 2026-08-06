import { useEffect } from 'react';

// Lightweight per-page <title> + optional meta description. Enough SEO/UX for a
// Vite SPA; if we later need crawlable SSR, swap for a metaframework.
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
