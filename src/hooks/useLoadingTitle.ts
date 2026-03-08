import { useEffect } from "react";

/**
 * Shows a loading indicator in the browser tab title while `loading` is true.
 * Restores the original title when done.
 */
export const useLoadingTitle = (loading: boolean) => {
  useEffect(() => {
    if (!loading) return;
    const original = document.title;
    document.title = `⏳ Loading… — SkillMitra`;
    return () => {
      document.title = original;
    };
  }, [loading]);
};
