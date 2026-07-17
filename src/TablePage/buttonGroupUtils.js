export const hasButtonGroupList = buttonGroup => Array.isArray(buttonGroup?.list) && buttonGroup.list.length > 0;

const normalizeButtonGroupList = (list, defaultSize) => {
  if (!Array.isArray(list)) {
    return list;
  }
  return list.map(item => {
    if (typeof item === 'function') {
      return item;
    }
    if (defaultSize === undefined) {
      return { ...item };
    }
    return {
      ...item,
      size: item.size ?? defaultSize
    };
  });
};

const resolveButtonGroupProps = (buttonGroup, getPopupContainer, { defaultSize, defaultShowLength, minShowLength }) => {
  if (!buttonGroup) {
    return {};
  }
  const { size, moreType, showLength, list, getPopupContainer: userGetPopupContainer, ...rest } = buttonGroup;
  const resolvedShowLength = Number.isInteger(showLength) ? Math.max(minShowLength, showLength) : defaultShowLength;
  return {
    ...rest,
    list: normalizeButtonGroupList(list, defaultSize),
    ...(defaultSize !== undefined ? { size: size ?? defaultSize } : size !== undefined ? { size } : {}),
    moreType: moreType ?? 'link',
    showLength: resolvedShowLength,
    getPopupContainer: userGetPopupContainer ?? getPopupContainer
  };
};

export const resolveToolbarButtonGroupProps = (buttonGroup, getPopupContainer) => {
  return resolveButtonGroupProps(buttonGroup, getPopupContainer, {
    defaultSize: 'small',
    defaultShowLength: 1,
    minShowLength: 1
  });
};
