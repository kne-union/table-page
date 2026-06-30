import React, { useLayoutEffect, useRef } from 'react';
import useRefCallback from '@kne/use-ref-callback';

const Label = ({ className, children, onChange }) => {
  const ref = useRef(null);
  const handlerChange = useRefCallback(onChange);
  useLayoutEffect(() => {
    const computed = () => {
      if (!ref.current) {
        return;
      }
      handlerChange(ref.current.getBoundingClientRect());
    };
    const resizeObserver = new ResizeObserver(computed);
    resizeObserver.observe(ref.current);
    computed();
    return () => {
      resizeObserver.disconnect();
    };
  }, [handlerChange]);
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
};

export default Label;
