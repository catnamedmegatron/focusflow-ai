import { useEffect, useRef } from 'react';

export function useScrollAnimation() {
  const elementsRef = useRef([]);

  useEffect(() => {
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optionally stop observing after it becomes visible
          // observer.unobserve(entry.target); 
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15, // Trigger when 15% visible
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all elements currently in the ref array
    elementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Function to add elements to the ref array
  const addToRefs = (el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  return { addToRefs };
}
