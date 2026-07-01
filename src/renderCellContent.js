import React from 'react';
import classnames from 'classnames';
import Ellipsis from './Ellipsis';
import ellipsisStyle from './ellipsis.module.scss';

export const renderCellContent = (content, column, contentClassName) => {
  const wrapEllipsis = column.ellipsis && !column.ellipsisHandledByRender;
  const needsWidthConstraint = Boolean(column.ellipsis || column.cellFullWidth);
  const inner = wrapEllipsis ? <Ellipsis ellipsis={column.ellipsis}>{content}</Ellipsis> : content;

  return <span className={contentClassName}>{needsWidthConstraint ? <span className={classnames(ellipsisStyle['cell-content'], column.cellFullWidth && ellipsisStyle['cell-full-width'])}>{inner}</span> : inner}</span>;
};

export const getColumnEllipsis = column => {
  if (!column.ellipsis) {
    return undefined;
  }
  return typeof column.ellipsis === 'object' ? column.ellipsis : true;
};
