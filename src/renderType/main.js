import React from 'react';
import { Tooltip } from 'antd';
import classnames from 'classnames';
import Ellipsis from '../Ellipsis';
import ellipsisStyle from '../ellipsis.module.scss';
import style from './main.module.scss';

const main = (value, { column, dataSource } = {}) => {
  const { ellipsis = true, hover = true, primary = true, onClick } = column || {};

  if (!hover && !primary && !onClick) {
    return <Ellipsis ellipsis={ellipsis}>{value}</Ellipsis>;
  }

  const ellipsisConfig = typeof ellipsis === 'object' ? ellipsis : {};
  const showTooltip = ellipsis && ellipsisConfig.showTitle !== false;

  const text = (
    <span
      className={classnames(style['text'], ellipsis && style['ellipsis'], {
        [style['hover']]: hover,
        [style['primary']]: primary
      })}
      onClick={onClick ? e => onClick({ item: value, colItem: dataSource, event: e }) : undefined}
    >
      {value}
    </span>
  );

  if (!showTooltip) {
    return text;
  }

  return (
    <Tooltip title={value} rootClassName={ellipsisStyle['tooltip']}>
      {text}
    </Tooltip>
  );
};

export default main;
