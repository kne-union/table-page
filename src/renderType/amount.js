import React from 'react';
import Ellipsis from '../Ellipsis';
import style from './amount.module.scss';

const amount = (value, { column } = {}) => {
  const { ellipsis = true } = column || {};

  return (
    <span className={style['amount']}>
      <Ellipsis ellipsis={ellipsis}>{value}</Ellipsis>
    </span>
  );
};

export default amount;
