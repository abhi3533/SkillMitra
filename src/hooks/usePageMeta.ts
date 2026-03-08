import { useEffect } from "react";

const BASE_URL = "https://skillmitra.online";
const DEFAULT_OG_IMAGE = `${BASE_URL}/icons/icon-512x512.png`;

interface PageMetaOptions {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, any>;
}

const setMeta = (attr: string, key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute("content", content);
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute("content", content);
    document.head.appendChild(el);
  }
};

const setLink = (rel: string, href: string) => {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (el) {
    el.href = href;
  } else {
    el = document.createElement("link");
    el.rel = rel;
    el.href = href;
    document.head.appendChild(el);
  }
};

export const usePageMeta = (
  titleOrOptions: string | PageMetaOptions,
  descriptionArg?: string
) => {
  const opts: PageMetaOptions = typeof titleOrOptions === "string"
    ? { title: titleOrOptions, description: descriptionArg || "" }
    : titleOrOptions;

  const { title, description, canonical, ogImage, ogType, jsonLd } = opts;

  useEffect(() => {
    // Title
    document.title = title;

    // Description
    setMeta("name", "description", description);

    // Canonical
    const canonicalUrl = canonical || `${BASE_URL}${window.location.pathname}`;
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", ogType || "website");

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // JSON-LD
    let scriptEl = document.querySelector('script[data-page-jsonld]') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.type = "application/ld+json";
        scriptEl.setAttribute("data-page-jsonld", "true");
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      document.title = "SkillMitra — Learn Any Skill From India's Best Experts";
      const ldScript = document.querySelector('script[data-page-jsonld]');
      if (ldScript) ldScript.remove();
    };
  }, [title, description, canonical, ogImage, ogType, jsonLd]);
};
