import React from 'react';
import { Typography } from 'antd';
import style from './ellipsis.module.scss';

const Ellipsis = ({ children, ellipsis }) => {
  if (!ellipsis) {
    return children;
  }

  const userConfig = typeof ellipsis === 'object' ? ellipsis : {};
  const { showTitle, ...rest } = userConfig;

  return (
    <Typography.Text
      className={style['ellipsis']}
      ellipsis={Object.assign(
        {},
        {
          tooltip:
            showTitle === false
              ? false
              : {
                  rootClassName: style['tooltip']
                }
        },
        rest
      )}
    >
      {children}
    </Typography.Text>
  );
};

export default Ellipsis;
