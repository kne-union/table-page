import { createPortal } from 'react-dom';
import { forwardRef, useEffect, useRef, useState } from 'react';
import useRefCallback from '@kne/use-ref-callback';
import classnames from 'classnames';
import style from './style.module.scss';
import { getTableScrollElement, getViewportRect, isDocumentScrollContainer, observeViewportIntersection, shouldShowFloatingScrollbar } from './scrollUtils';

const BAR_HEIGHT = 15;
const THUMB_MARGIN = 2;

const computeBarMetrics = (scrollEl, viewportState, getPortalContainer) => {
  const rect = scrollEl.getBoundingClientRect();
  const portalContainer = typeof getPortalContainer === 'function' ? getPortalContainer() : null;
  const useEmbeddedPlacement = !isDocumentScrollContainer(portalContainer);
  const trackWidth = rect.width;
  const thumbWidth = Math.max((trackWidth * scrollEl.clientWidth) / scrollEl.scrollWidth - THUMB_MARGIN * 2, 24);
  const maxThumbOffset = trackWidth - thumbWidth - THUMB_MARGIN * 2;
  const scrollRatio = scrollEl.scrollWidth > scrollEl.clientWidth ? scrollEl.scrollLeft / (scrollEl.scrollWidth - scrollEl.clientWidth) : 0;
  const visible = shouldShowFloatingScrollbar(scrollEl, viewportState, getPortalContainer);

  if (useEmbeddedPlacement) {
    const containerRect = portalContainer.getBoundingClientRect();
    return {
      placement: 'embedded',
      offsetLeft: Math.round(rect.left - containerRect.left),
      width: Math.round(trackWidth),
      thumbWidth,
      thumbLeft: THUMB_MARGIN + maxThumbOffset * scrollRatio,
      visible
    };
  }

  const viewport = getViewportRect();
  return {
    placement: 'fixed',
    left: Math.round(rect.left),
    width: Math.round(trackWidth),
    bottom: window.innerHeight - viewport.bottom,
    thumbWidth,
    thumbLeft: THUMB_MARGIN + maxThumbOffset * scrollRatio,
    visible
  };
};

const metricsEqual = (prev, next) => {
  if (!prev || !next) {
    return prev === next;
  }
  return (
    prev.placement === next.placement &&
    prev.visible === next.visible &&
    prev.width === next.width &&
    prev.thumbWidth === next.thumbWidth &&
    prev.thumbLeft === next.thumbLeft &&
    (prev.placement === 'embedded' ? prev.offsetLeft === next.offsetLeft : prev.left === next.left && prev.bottom === next.bottom)
  );
};

const FloatingScrollBar = ({ metrics, onThumbDrag, getPortalContainer }) => {
  const startRef = useRef(0);
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const onThumbDragRef = useRef(onThumbDrag);
  onThumbDragRef.current = onThumbDrag;

  useEffect(() => {
    movingRef.current = moving;
  }, [moving]);

  useEffect(() => {
    const moveHandler = event => {
      if (!movingRef.current) {
        return;
      }
      onThumbDragRef.current(event.clientX - startRef.current);
      startRef.current = event.clientX;
    };
    const upHandler = () => {
      setMoving(false);
    };
    document.addEventListener('mousemove', moveHandler, true);
    document.addEventListener('mouseup', upHandler, true);
    return () => {
      document.removeEventListener('mousemove', moveHandler, true);
      document.removeEventListener('mouseup', upHandler, true);
    };
  }, []);

  if (!metrics?.visible) {
    return null;
  }

  const portalContainer = typeof getPortalContainer === 'function' ? getPortalContainer() : null;
  const useEmbeddedPlacement = metrics.placement === 'embedded';
  const portalTarget = useEmbeddedPlacement && portalContainer ? portalContainer : document.body;

  return createPortal(
    <div
      className={classnames(style['floating-scrollbar'], 'table-page-floating-scrollbar', {
        [style['floating-scrollbar-embedded']]: useEmbeddedPlacement
      })}
      style={
        useEmbeddedPlacement
          ? {
              marginLeft: metrics.offsetLeft,
              width: metrics.width,
              height: BAR_HEIGHT
            }
          : {
              left: metrics.left,
              width: metrics.width,
              height: BAR_HEIGHT,
              bottom: metrics.bottom
            }
      }
    >
      <div
        className={classnames(style['floating-scrollbar-thumb'], {
          [style['is-moving']]: moving
        })}
        style={{
          width: metrics.thumbWidth,
          left: metrics.thumbLeft
        }}
        onMouseDown={event => {
          event.preventDefault();
          startRef.current = event.clientX;
          setMoving(true);
        }}
      />
    </div>,
    portalTarget
  );
};

const HorizontalScroller = forwardRef(({ className, enabled = true, getPortalContainer, children }, forwardedRef) => {
  const [metrics, setMetrics] = useState(null);
  const containerRef = useRef(null);
  const scrollElRef = useRef(null);
  const viewportStateRef = useRef(null);
  const metricsRef = useRef(null);

  const setContainerRef = useRefCallback(node => {
    containerRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  });

  const updateMetrics = useRefCallback(() => {
    const scrollEl = scrollElRef.current;
    if (!scrollEl) {
      metricsRef.current = null;
      setMetrics(null);
      return;
    }
    const nextMetrics = computeBarMetrics(scrollEl, viewportStateRef.current, getPortalContainer);
    if (metricsEqual(metricsRef.current, nextMetrics)) {
      return;
    }
    metricsRef.current = nextMetrics;
    setMetrics(nextMetrics);
  });

  const handleThumbDrag = useRefCallback(deltaX => {
    const scrollEl = scrollElRef.current;
    if (!scrollEl) {
      return;
    }
    const trackWidth = scrollEl.clientWidth;
    const scrollableWidth = scrollEl.scrollWidth - scrollEl.clientWidth;
    const thumbWidth = Math.max((trackWidth * scrollEl.clientWidth) / scrollEl.scrollWidth - THUMB_MARGIN * 2, 24);
    const thumbTravel = trackWidth - thumbWidth - THUMB_MARGIN * 2;
    if (thumbTravel <= 0) {
      return;
    }
    scrollEl.scrollLeft += (deltaX / thumbTravel) * scrollableWidth;
    updateMetrics();
  });

  useEffect(() => {
    if (!enabled) {
      scrollElRef.current = null;
      viewportStateRef.current = null;
      metricsRef.current = null;
      setMetrics(null);
      return undefined;
    }

    const root = containerRef.current;
    if (!root) {
      return undefined;
    }

    let scrollEl = null;
    let unobserveViewport = null;
    let contentResizeObserver = null;
    const portalContainer = typeof getPortalContainer === 'function' ? getPortalContainer() : null;
    const useEmbeddedPlacement = !isDocumentScrollContainer(portalContainer);

    const detachScrollEl = () => {
      unobserveViewport?.();
      unobserveViewport = null;
      if (!scrollEl) {
        return;
      }
      scrollEl.removeEventListener('scroll', updateMetrics);
      contentResizeObserver?.disconnect();
      contentResizeObserver = null;
      scrollElRef.current = null;
      viewportStateRef.current = null;
      scrollEl = null;
    };

    const attachScrollEl = nextScrollEl => {
      if (!nextScrollEl || nextScrollEl === scrollEl) {
        return;
      }
      detachScrollEl();
      scrollEl = nextScrollEl;
      scrollElRef.current = scrollEl;
      if (!useEmbeddedPlacement) {
        unobserveViewport = observeViewportIntersection(scrollEl, state => {
          viewportStateRef.current = state;
          updateMetrics();
        });
      }
      scrollEl.addEventListener('scroll', updateMetrics, { passive: true });
      contentResizeObserver = new ResizeObserver(updateMetrics);
      contentResizeObserver.observe(scrollEl);
      Array.from(scrollEl.children).forEach(child => {
        contentResizeObserver.observe(child);
      });
    };

    const onLayoutChange = () => {
      attachScrollEl(getTableScrollElement(root));
      updateMetrics();
    };

    const containerResizeObserver = new ResizeObserver(onLayoutChange);
    containerResizeObserver.observe(root);
    onLayoutChange();

    const onWindowChange = () => {
      if (!useEmbeddedPlacement) {
        updateMetrics();
      }
    };

    if (!useEmbeddedPlacement) {
      window.addEventListener('scroll', onWindowChange, true);
      window.addEventListener('resize', onWindowChange);
      window.visualViewport?.addEventListener('resize', onWindowChange);
      window.visualViewport?.addEventListener('scroll', onWindowChange);
    }

    if (useEmbeddedPlacement && portalContainer) {
      portalContainer.addEventListener('scroll', updateMetrics, { passive: true });
      window.addEventListener('resize', updateMetrics);
    }

    return () => {
      detachScrollEl();
      containerResizeObserver.disconnect();
      if (!useEmbeddedPlacement) {
        window.removeEventListener('scroll', onWindowChange, true);
        window.removeEventListener('resize', onWindowChange);
        window.visualViewport?.removeEventListener('resize', onWindowChange);
        window.visualViewport?.removeEventListener('scroll', onWindowChange);
      }
      if (useEmbeddedPlacement && portalContainer) {
        portalContainer.removeEventListener('scroll', updateMetrics);
        window.removeEventListener('resize', updateMetrics);
      }
    };
  }, [enabled, updateMetrics, getPortalContainer]);

  return (
    <>
      <div ref={setContainerRef} className={className}>
        {children}
      </div>
      {enabled ? <FloatingScrollBar metrics={metrics} onThumbDrag={handleThumbDrag} getPortalContainer={getPortalContainer} /> : null}
    </>
  );
});

export default HorizontalScroller;
