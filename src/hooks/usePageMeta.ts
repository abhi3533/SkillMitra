import { useEffect } from "react";

export const usePageMeta = (title: string, description: string) => {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }
    return () => {
      document.title = "SkillMitra — Learn Any Skill From India's Best Experts";
    };
  }, [title, description]);
};
