import React from 'react';
import Ellipsis from './Ellipsis';
import style from './columnHeaderTitle.module.scss';

const isSimpleTitle = title => typeof title === 'string' || typeof title === 'number';

export const wrapColumnHeaderTitle = title => {
  if (title == null || title === '') {
    return title;
  }
  if (isSimpleTitle(title)) {
    return <Ellipsis ellipsis>{title}</Ellipsis>;
  }
  return <span className={style['ellipsis']}>{title}</span>;
};
