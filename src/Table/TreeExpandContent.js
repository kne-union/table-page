import React from 'react';
import { CaretRightOutlined, LoadingOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import style from './style.module.scss';

const TreeExpandContent = ({ level = 0, indentSize = 16, hasChildren, expanded, loading, onExpand, selection, className }) => (
  <span className={classnames(style['tree-selection-content'], className, 'info-page-table-col-content')}>
    <span className={style['tree-indent']} style={{ width: level * indentSize, minWidth: level * indentSize }} />
    {hasChildren ? (
      <button
        type="button"
        className={classnames(style['tree-expand'], {
          [style['is-expanded']]: expanded && !loading,
          [style['is-loading']]: loading
        })}
        aria-expanded={!!expanded}
        disabled={!!loading}
        onClick={event => {
          event.stopPropagation();
          if (loading) {
            return;
          }
          onExpand?.(event);
        }}
      >
        {loading ? <LoadingOutlined spin /> : <CaretRightOutlined />}
      </button>
    ) : (
      <span className={style['tree-leaf-placeholder']} />
    )}
    {selection ? <span className={style['tree-selection-control']}>{selection}</span> : null}
  </span>
);

export default TreeExpandContent;
