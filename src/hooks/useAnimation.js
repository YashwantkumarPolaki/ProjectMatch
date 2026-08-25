import { useEffect, useRef, useState } from "react";

// Animated counter: 0 → target over ~600ms
export function useCountUp(target, delay = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    let start = null;
    const duration = 600;
    const timeout = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, delay]);

  return value;
}

// Trigger a value to "true" after mount (for CSS transition triggers)
export function useMountTrigger(delay = 0) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return active;
}
