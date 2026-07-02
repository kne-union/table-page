import { useMemo, useState } from 'react';
import groupBy from 'lodash/groupBy';
import { HolderOutlined, RedoOutlined } from '@ant-design/icons';
import style from './columnConfig.module.scss';
import { Button, Checkbox, Col, Collapse, Input, List, Row, Tooltip } from 'antd';
import { ReactSortable } from 'react-sortablejs';
import classnames from 'classnames';
import transform from 'lodash/transform';
import cloneDeep from 'lodash/cloneDeep';
import { getColumnConfig, setColumnConfig } from './columnConfigUtils';
import { useIntl } from '@kne/react-intl';
import withLocale from './withLocale';

const ColumnsControlContent = withLocale(({ close, onConfirm, columns, config: defaultValue }) => {
  const { formatMessage } = useIntl();
  const [config, onChange] = useState(defaultValue || {});
  const [searchText, setSearchText] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [scrollEl, setScrollEl] = useState(null);

  const { leftFixedColumns, rightFixedColumns, visibleColumns, hiddenColumns } = useMemo(() => {
    return transform(
      Object.assign(
        {
          leftFixedColumns: [],
          rightFixedColumns: [],
          visibleColumns: [],
          hiddenColumns: []
        },
        groupBy(columns, item => {
          if (item.fixed === 'right') {
            return 'rightFixedColumns';
          }
          if (item.fixed === true || item.fixed === 'left') {
            return 'leftFixedColumns';
          }
          return (getColumnConfig(config, item.name, 'visible') !== true && item.hidden) || getColumnConfig(config, item.name, 'visible') === false ? 'hiddenColumns' : 'visibleColumns';
        })
      ),
      (result, value, key) => {
        result[key] = value.sort((a, b) => getColumnConfig(config, a.name, 'rank', 0) - getColumnConfig(config, b.name, 'rank', 0));
      },
      {}
    );
  }, [columns, config]);

  const sortableVisibleColumns = useMemo(() => {
    return visibleColumns.map(column => Object.assign({}, column, { id: column.name }));
  }, [visibleColumns]);

  const handlerColumnsChange = columnsState => {
    const newConfig = cloneDeep(config);
    const columnsList = [].concat(columnsState.leftFixedColumns, columnsState.visibleColumns, columnsState.rightFixedColumns);
    (columnsState.hiddenColumns || []).forEach(col => {
      Object.assign(newConfig, setColumnConfig(newConfig, col.name, { visible: false }));
    });
    columnsList.forEach((col, index) => {
      Object.assign(newConfig, setColumnConfig(newConfig, col.name, { rank: index + 1 }));
    });
    onChange(newConfig);
  };

  const renderColumn = item => {
    return (
      <>
        {item.titleText || item.title || formatMessage({ id: 'UnnamedColumn' })}
        {item.groupHeader && item.groupHeader.length > 0 ? `(${item.groupHeader.map(({ title }) => title).join('-')})` : ''}
      </>
    );
  };

  const collapseItems = useMemo(() => {
    return [
      {
        key: 'active',
        label: formatMessage({ id: 'VisibleInfo' }),
        children: (
          <div className={style['columns-control-content-list']}>
            {leftFixedColumns.map((item, index) => (
              <div className={style['columns-control-content-item']} key={item.name || `left-${index}`}>
                <Checkbox checked disabled>
                  {renderColumn(item)}
                </Checkbox>
              </div>
            ))}
            <ReactSortable
              tag="div"
              className={style['columns-control-sortable-list']}
              list={sortableVisibleColumns}
              filter=".ignore-elements"
              dragClass="table-page-sortable-drag"
              ghostClass="table-page-sortable-ghost"
              chosenClass="table-page-sortable-chosen"
              forceFallback
              fallbackOnBody
              scroll={scrollEl || true}
              bubbleScroll
              setList={nextVisibleColumns => {
                handlerColumnsChange({
                  leftFixedColumns,
                  visibleColumns: nextVisibleColumns,
                  hiddenColumns,
                  rightFixedColumns
                });
              }}
              animation={300}
              delayOnTouchStart
              delay={2}
            >
              {sortableVisibleColumns.map(item => (
                <div className={classnames(style['columns-control-content-item'], style['is-drag'])} key={item.id}>
                  <HolderOutlined className={style['columns-control-content-item-icon']} />
                  <Checkbox
                    checked
                    disabled={item.fixed || leftFixedColumns.length + visibleColumns.length + rightFixedColumns.length <= 1}
                    onChange={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      const newConfig = Object.assign({}, config);
                      newConfig[item.name] = Object.assign({}, newConfig[item.name], { visible: false });
                      onChange(newConfig);
                    }}
                  >
                    {renderColumn(item)}
                  </Checkbox>
                </div>
              ))}
            </ReactSortable>
            {rightFixedColumns.map((item, index) => (
              <div className={style['columns-control-content-item']} key={item.name || `right-${index}`}>
                <Checkbox checked disabled>
                  {item.titleText || item.title || formatMessage({ id: 'UnnamedColumn' })}
                </Checkbox>
              </div>
            ))}
          </div>
        )
      },
      {
        key: 'un-active',
        label: (
          <Row wrap={false} justify="space-between">
            <Col>{formatMessage({ id: 'HiddenInfo' })}</Col>
            <Col
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Input.Search placeholder={formatMessage({ id: 'Search' })} onSearch={value => setSearchText(value)} className={style['columns-control-content-input']} size="small" allowClear />
            </Col>
          </Row>
        ),
        children: (
          <List
            dataSource={hiddenColumns.filter(item => {
              const title = item.titleText || item.title;
              return typeof title === 'string' && title.indexOf(searchText) > -1;
            })}
            renderItem={item => (
              <List.Item className={style['columns-control-content-item']} key={item.name}>
                <Checkbox
                  checked={false}
                  onChange={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    const newConfig = Object.assign({}, config);
                    newConfig[item.name] = Object.assign({}, newConfig[item.name], { visible: true });
                    onChange(newConfig);
                  }}
                >
                  {item.titleText || item.title || formatMessage({ id: 'UnnamedColumn' })}
                </Checkbox>
              </List.Item>
            )}
          />
        )
      }
    ];
  }, [config, formatMessage, hiddenColumns, leftFixedColumns, onChange, rightFixedColumns, scrollEl, searchText, sortableVisibleColumns, visibleColumns.length]);

  return (
    <div className={style['columns-control-content']}>
      <div className={style['columns-control-content-title']}>
        <Row align="middle" justify="space-between">
          <Col>{formatMessage({ id: 'EditTable' })}</Col>
          <Col>
            <Tooltip title={formatMessage({ id: 'RestoreDefault' })}>
              <Button
                type="text"
                icon={<RedoOutlined />}
                onClick={async () => {
                  onConfirm && (await onConfirm({}));
                  close();
                }}
              />
            </Tooltip>
          </Col>
        </Row>
      </div>
      <div className={style['columns-control-content-scroller']} ref={setScrollEl}>
        <Collapse defaultActiveKey={['active', 'un-active']} ghost bordered items={collapseItems} />
      </div>
      <Row className={style['columns-control-content-footer']} justify="end" gutter={10}>
        <Col>
          <Button
            size="small"
            onClick={() => {
              onChange(defaultValue || {});
              close();
            }}
          >
            {formatMessage({ id: 'Cancel' })}
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            size="small"
            loading={confirmLoading}
            onClick={async () => {
              setConfirmLoading(true);
              try {
                onConfirm && (await onConfirm(config));
                close();
              } finally {
                setConfirmLoading(false);
              }
            }}
          >
            {formatMessage({ id: 'Confirm' })}
          </Button>
        </Col>
      </Row>
    </div>
  );
});

export default ColumnsControlContent;
