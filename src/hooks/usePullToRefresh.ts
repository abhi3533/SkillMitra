import { useState, useEffect, useCallback, useRef } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useRef(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  }, [onRefresh]);

  useEffect(() => {
    const threshold = 80;
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) startY.current = e.touches[0].clientY;
      else startY.current = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!startY.current) return;
      pullDistance.current = e.touches[0].clientY - startY.current;
      if (pullDistance.current > 20) setPulling(true);
    };
    const onTouchEnd = () => {
      if (pullDistance.current > threshold && !refreshing) handleRefresh();
      setPulling(false);
      pullDistance.current = 0;
      startY.current = 0;
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleRefresh, refreshing]);

  return { pulling, refreshing };
}
