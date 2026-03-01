import { useState, useEffect, useRef } from 'react';

export const useAnimatedCounter = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = countRef.current;
    if (startValue === end) return;
    
    setDirection(end > startValue ? 'up' : 'down');
    setIsAnimating(true);
    startTimeRef.current = null;
    
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = time - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      const ease = 1 - Math.pow(1 - percentage, 4); // easeOutQuart
      
      const current = startValue + (end - startValue) * ease;
      countRef.current = current;
      setCount(current);

      if (progress < duration) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        countRef.current = end;
        setIsAnimating(false);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [end, duration]);

  return { count, isAnimating, direction };
};
