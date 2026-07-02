import React, { useState } from 'react';
import { Tooltip } from 'antd';
import classnames from 'classnames';
import Ellipsis from '../Ellipsis';
import ellipsisStyle from '../ellipsis.module.scss';
import style from './main.module.scss';

const MainCell = ({ value, column, dataSource }) => {
  const { ellipsis = true, hover = true, primary = true, onClick } = column || {};
  const [loading, setLoading] = useState(false);
  const isClickable = Boolean(hover || primary || onClick);

  if (!isClickable) {
    return <Ellipsis ellipsis={ellipsis}>{value}</Ellipsis>;
  }

  const ellipsisConfig = typeof ellipsis === 'object' ? ellipsis : {};
  const showTooltip = ellipsis && ellipsisConfig.showTitle !== false;

  const handleClick = onClick
    ? e => {
        if (loading) {
          return;
        }
        setLoading(true);
        Promise.resolve(onClick({ item: value, colItem: dataSource, event: e })).finally(() => {
          setLoading(false);
        });
      }
    : undefined;

  const text = (
    <span
      className={classnames(style['text'], ellipsis && style['ellipsis'], {
        [style['hover']]: hover,
        [style['primary']]: primary,
        [style['clickable']]: Boolean(onClick),
        [style['loading']]: loading
      })}
      onClick={handleClick}
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

const main = (value, { column, dataSource } = {}) => <MainCell value={value} column={column} dataSource={dataSource} />;

export default main;
