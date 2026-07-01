import React from 'react';
import classnames from 'classnames';
import ButtonGroup from '@kne/button-group';
import '@kne/button-group/dist/index.css';
import { parseColumnWidth } from '../TableView/columnWidth';
import style from './options.module.scss';

const normalizeOptionItem = (item, buttonClassName) => {
  if (item == null) {
    return null;
  }
  if (typeof item === 'function') {
    return item;
  }
  if (typeof item === 'string') {
    return { children: item, type: 'link', className: buttonClassName };
  }
  const { children, label, text, className, ...rest } = item;
  return {
    type: 'link',
    ...rest,
    className: classnames(buttonClassName, className),
    children: children ?? label ?? text
  };
};

const options = (value, { column } = {}) => {
  let list = value;
  let buttonGroupProps = column?.buttonGroup || {};

  if (value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.list)) {
    const { list: valueList, ...rest } = value;
    list = valueList;
    buttonGroupProps = { ...buttonGroupProps, ...rest };
  }

  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }

  const wrapperClassName = classnames(style['col-item'], style['options']);
  const buttonClassName = classnames(wrapperClassName, style['options-btn']);
  const normalizedList = list.map(item => normalizeOptionItem(item, buttonClassName)).filter(item => item != null && !item.hidden);

  if (normalizedList.length === 0) {
    return null;
  }

  const width = parseColumnWidth(column?.width);

  return (
    <div className={classnames(wrapperClassName, style['options-column'])} style={width > 0 ? { '--max-width': `${width}px` } : undefined}>
      <ButtonGroup moreType="link" itemClassName="btn-no-padding" list={normalizedList} {...buttonGroupProps} />
    </div>
  );
};

export default options;
