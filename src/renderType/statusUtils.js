import React from 'react';
import { Badge } from 'antd';
import { globalParams } from '../globalParams';

const DEFAULT_STATUS_TYPE_MAP = {
  default: 'default',
  success: 'success',
  progress: 'processing',
  processing: 'processing',
  danger: 'error',
  error: 'error',
  warning: 'warning',
  info: 'processing',
  other: 'default',
  active: 'success',
  vacation: 'warning',
  resigned: 'default',
  probation: 'processing',
  completed: 'success',
  pending: 'warning',
  shipped: 'processing',
  paid: 'success',
  cancelled: 'error'
};

export const getStatusType = type => {
  if (!type) {
    return 'default';
  }
  const customTypes = globalParams.statusTypeColors || {};
  return customTypes[type] || DEFAULT_STATUS_TYPE_MAP[type] || type;
};

export const normalizeStatusItem = item => {
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

export const renderStatusItem = item => {
  const statusItem = normalizeStatusItem(item);
  if (!statusItem || statusItem.text == null) {
    return null;
  }

  const { text, type, status, color, children, ...rest } = statusItem;

  return <Badge status={status ?? color ?? getStatusType(type)} text={children ?? text} {...rest} />;
};
