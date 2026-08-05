import { getViewportRect, isDocumentScrollContainer } from '@kne/react-sticky-scroller';

export const parsePixelValue = value => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
};

export const normalizeScrollTopInsetCSSValue = value => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return String(value);
};

export const resolveScrollTopInset = (scrollTopInset, stickyOffset) => scrollTopInset ?? stickyOffset;

export const parseInsetPixels = (inset, element) => {
  if (inset == null) {
    return 0;
  }
  if (typeof inset === 'number') {
    return inset;
  }
  if (typeof inset === 'string') {
    const trimmed = inset.trim();
    if (trimmed.endsWith('px')) {
      return parsePixelValue(trimmed);
    }
    const variableMatch = trimmed.match(/var\(\s*(--[^,\s)]+)/);
    if (variableMatch) {
      return readCssVariableLength(element, variableMatch[1], '0px');
    }
  }
  return 0;
};

/** @deprecated use parseInsetPixels */
export const parseStickyOffset = parseInsetPixels;

export const readScrollTopInsetPixels = element => {
  const fromVar = readCssVariableLength(element, '--scroll-top-inset', '0px') || readCssVariableLength(element, '--sticky-offset', '0px') || readCssVariableLength(element, '--nav-height', '0px');
  return fromVar;
};

export const getTableElement = root => {
  if (!root) {
    return null;
  }
  return root.querySelector('.info-page-table') || root;
};

export const getScrollAnchorElement = (root, { preferToolbar = false } = {}) => {
  if (!root) {
    return null;
  }
  if (preferToolbar) {
    return root.querySelector('.table-page-toolbar-section') || root.querySelector('.table-with-toolbar') || getTableElement(root);
  }
  return getTableElement(root);
};

export const readCssVariableLength = (element, variableName, fallback = '0px') => {
  if (typeof document === 'undefined') {
    return 0;
  }
  const host = element || document.documentElement;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:0;width:0;overflow:hidden;';
  probe.style.marginTop = `var(${variableName}, ${fallback})`;
  host.appendChild(probe);
  const value = parsePixelValue(getComputedStyle(probe).marginTop);
  host.removeChild(probe);
  return value;
};

const resolveScrollContainer = (element, getScrollContainer) => {
  const explicitContainer = typeof getScrollContainer === 'function' ? getScrollContainer() : null;
  if (explicitContainer) {
    return explicitContainer;
  }
  let parent = element?.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.scrollingElement || document.documentElement;
};

const scrollToElement = (element, { offsetTop = 0, getScrollContainer } = {}) => {
  const scrollContainer = resolveScrollContainer(element, getScrollContainer);
  const targetRect = element.getBoundingClientRect();

  if (scrollContainer === document.scrollingElement || scrollContainer === document.documentElement || scrollContainer === document.body) {
    const scrollTop = window.pageYOffset + targetRect.top - offsetTop;
    window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'auto' });
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const nextScrollTop = scrollContainer.scrollTop + targetRect.top - containerRect.top - offsetTop;
  scrollContainer.scrollTo({ top: Math.max(0, nextScrollTop), behavior: 'auto' });
};

export const scrollAnchorIntoView = (root, { getScrollContainer, preferToolbar = false } = {}) => {
  const target = getScrollAnchorElement(root, { preferToolbar });
  if (!target) {
    return;
  }

  const offsetTop = readScrollTopInsetPixels(target);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (isTopEdgeInViewport(target, offsetTop, getScrollContainer)) {
        return;
      }
      scrollToElement(target, { offsetTop, getScrollContainer });
    });
  });
};

export const isTopEdgeInViewport = (element, scrollMarginTop = 0, getScrollContainer) => {
  if (!element) {
    return true;
  }
  const rect = element.getBoundingClientRect();
  const explicitContainer = typeof getScrollContainer === 'function' ? getScrollContainer() : null;
  if (!isDocumentScrollContainer(explicitContainer)) {
    const containerRect = explicitContainer.getBoundingClientRect();
    const viewportTop = containerRect.top + scrollMarginTop;
    return rect.top >= viewportTop && rect.top < containerRect.bottom;
  }
  const viewport = getViewportRect();
  const viewportTop = viewport.top + scrollMarginTop;
  return rect.top >= viewportTop && rect.top < viewport.bottom;
};
