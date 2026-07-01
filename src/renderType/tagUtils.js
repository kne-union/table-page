import React from 'react';
import { Space, Tag } from 'antd';
import { globalParams } from '../globalParams';

const DEFAULT_TAG_TYPE_COLORS = {
  default: 'default',
  success: 'success',
  progress: 'processing',
  processing: 'processing',
  danger: 'error',
  error: 'error',
  warning: 'warning',
  info: 'blue',
  other: 'purple',
  skill: 'default',
  result: 'default',
  filterResult: 'cyan',
  completed: 'success',
  pending: 'warning',
  high: 'error',
  medium: 'warning',
  low: 'default'
};

export const getTagColor = type => {
  if (!type) {
    return 'default';
  }
  const customColors = globalParams.tagTypeColors || {};
  return customColors[type] || DEFAULT_TAG_TYPE_COLORS[type] || type;
};

export const normalizeTagItem = item => {
  if (item == null) {
    return null;
  }
  if (typeof item === 'string' || typeof item === 'number') {
    return { text: String(item) };
  }
  if (typeof item === 'object') {
    return Object.assign({}, item, {
      text: item.text ?? item.children ?? item.label
    });
  }
  return null;
};

export const renderTagItem = (item, key) => {
  const tag = normalizeTagItem(item);
  if (!tag || (tag.text == null && tag.children == null)) {
    return null;
  }

  const { text, type, color, children, ...rest } = tag;

  return (
    <Tag key={key} color={color ?? getTagColor(type)} {...rest}>
      {children ?? text}
    </Tag>
  );
};

export const renderTagList = value => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return (
    <Space size={[4, 4]} wrap>
      {value.map((item, index) => renderTagItem(item, index))}
    </Space>
  );
};
