import { useEffect, useState } from 'react';

const useElementWidth = ref => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const update = () => setWidth(el.clientWidth);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    update();
    return () => resizeObserver.disconnect();
  }, [ref]);

  return width;
};

export default useElementWidth;
