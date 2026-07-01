export const parsePixelValue = value => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
};

export const getViewportRect = () => {
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    return {
      top: visualViewport.offsetTop,
      bottom: visualViewport.offsetTop + visualViewport.height,
      left: visualViewport.offsetLeft,
      right: visualViewport.offsetLeft + visualViewport.width,
      height: visualViewport.height
    };
  }
  return {
    top: 0,
    bottom: window.innerHeight,
    left: 0,
    right: window.innerWidth,
    height: window.innerHeight
  };
};

export const getTableElement = root => {
  if (!root) {
    return null;
  }
  return root.querySelector('.info-page-table') || root;
};

export const getTableScrollElement = root => {
  if (!root) {
    return null;
  }
  return root.querySelector('.ant-table-body') || root.querySelector('.ant-table-content');
};

export const getElementViewportState = element => {
  if (!element) {
    return {
      isBottomInViewport: true,
      isPartiallyInViewport: false,
      isTopInViewport: true,
      rect: null,
      viewport: getViewportRect()
    };
  }
  const rect = element.getBoundingClientRect();
  const viewport = getViewportRect();
  return {
    isBottomInViewport: rect.bottom > viewport.top && rect.bottom <= viewport.bottom,
    isPartiallyInViewport: rect.top < viewport.bottom && rect.bottom > viewport.top,
    isTopInViewport: rect.top >= viewport.top && rect.top < viewport.bottom,
    rect,
    viewport
  };
};

export const isTopEdgeInViewport = (element, scrollMarginTop = 0) => {
  const { isTopInViewport, rect, viewport } = getElementViewportState(element);
  if (!rect) {
    return true;
  }
  const viewportTop = viewport.top + scrollMarginTop;
  return rect.top >= viewportTop && rect.top < viewport.bottom;
};

export const shouldShowFloatingScrollbar = (scrollEl, viewportState) => {
  if (!scrollEl || scrollEl.scrollWidth <= scrollEl.clientWidth + 1) {
    return false;
  }
  const state = viewportState || getElementViewportState(scrollEl);
  if (!state.isPartiallyInViewport) {
    return false;
  }
  return !state.isBottomInViewport;
};

export const observeViewportIntersection = (element, onChange) => {
  if (!element) {
    return () => {};
  }

  const notify = entry => {
    onChange(getElementViewportState(element));
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      notify(entry);
    },
    {
      root: null,
      threshold: [0, 0.01, 0.25, 0.5, 0.75, 1]
    }
  );

  observer.observe(element);

  const handleViewportChange = () => {
    notify();
  };

  window.addEventListener('scroll', handleViewportChange, true);
  window.addEventListener('resize', handleViewportChange);
  window.visualViewport?.addEventListener('resize', handleViewportChange);
  window.visualViewport?.addEventListener('scroll', handleViewportChange);
  notify();

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', handleViewportChange, true);
    window.removeEventListener('resize', handleViewportChange);
    window.visualViewport?.removeEventListener('resize', handleViewportChange);
    window.visualViewport?.removeEventListener('scroll', handleViewportChange);
  };
};
