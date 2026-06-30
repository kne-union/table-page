import React from 'react';
import classnames from 'classnames';
import Ellipsis from './Ellipsis';
import ellipsisStyle from './ellipsis.module.scss';

export const renderCellContent = (content, column, contentClassName) => {
  return <span className={classnames(contentClassName, column.ellipsis && ellipsisStyle['cell-content'])}>{column.ellipsis ? <Ellipsis ellipsis={column.ellipsis}>{content}</Ellipsis> : content}</span>;
};

export const getColumnEllipsis = column => {
  if (!column.ellipsis) {
    return undefined;
  }
  return typeof column.ellipsis === 'object' ? column.ellipsis : true;
};
