import { Button, Select } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import { useIntl } from '@kne/react-intl';
import style from './style.module.scss';

const MobilePagination = ({ className, current, pageSize, total, onChange, showTotal, showSizeChanger, pageSizeOptions, hideOnSinglePage }) => {
  const { formatMessage } = useIntl();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }

  const rangeStart = (current - 1) * pageSize + 1;
  const rangeEnd = Math.min(current * pageSize, total);
  const totalNode = typeof showTotal === 'function' ? showTotal(total, [rangeStart, rangeEnd]) : null;
  const hasMeta = !!totalNode || showSizeChanger;

  return (
    <div className={classnames(style['mobile-pagination'], { [style['is-center']]: !hasMeta }, className)}>
      {hasMeta ? (
        <div className={style['mobile-pagination-meta']}>
          {totalNode ? <span>{totalNode}</span> : null}
          {showSizeChanger ? (
            <Select
              size="small"
              variant="borderless"
              value={pageSize}
              onChange={size => onChange(1, size)}
              options={pageSizeOptions.map(item => ({
                value: Number(item),
                label: formatMessage({ id: 'PageSizeText' }, { size: item })
              }))}
            />
          ) : null}
        </div>
      ) : null}
      <div className={style['mobile-pagination-bar']}>
        <Button type="text" shape="circle" className={style['mobile-pagination-btn']} aria-label={formatMessage({ id: 'PrevPage' })} icon={<LeftOutlined />} disabled={current <= 1} onClick={() => onChange(current - 1, pageSize)} />
        <span className={style['mobile-pagination-indicator']}>
          <span className={style['mobile-pagination-current']}>{current}</span>
          <span className={style['mobile-pagination-divider']}>/</span>
          {totalPages}
        </span>
        <Button
          type="text"
          shape="circle"
          className={style['mobile-pagination-btn']}
          aria-label={formatMessage({ id: 'NextPage' })}
          icon={<RightOutlined />}
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1, pageSize)}
        />
      </div>
    </div>
  );
};

export default MobilePagination;
