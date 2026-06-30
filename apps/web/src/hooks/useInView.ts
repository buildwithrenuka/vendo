import { useEffect, useRef, useState } from "react";

type Options = {
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
};

export function useInView<T extends HTMLElement = HTMLDivElement>(options: Options = {}) {
  const { once = true, rootMargin = "-8% 0px", threshold = 0.12 } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
