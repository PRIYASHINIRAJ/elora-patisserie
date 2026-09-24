import { useEffect } from 'react';

const SITE_NAME = 'Élora Patisserie';

function setMetaTag(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Sets the document title and meta description for the current page.
 * Restores the previous values on unmount so navigating away doesn't
 * leave stale metadata behind.
 */
export function usePageMeta({ title, description }) {
  useEffect(() => {
    const previousTitle = document.title;
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');

    if (title) document.title = `${title} — ${SITE_NAME}`;
    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:title', title ? `${title} — ${SITE_NAME}` : SITE_NAME, 'property');
      setMetaTag('og:description', description, 'property');
    }

    return () => {
      document.title = previousTitle;
      if (previousDescription) setMetaTag('description', previousDescription);
    };
  }, [title, description]);
}
