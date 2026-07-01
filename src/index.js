import { useIntl } from '@kne/react-intl';

import withLocale from './withLocale';
import style from './style.module.scss';

const TablePage = withLocale(() => {
  const { formatMessage } = useIntl();
  return <span className={style['tips']}>我是一个初始化组件</span>;
});

export default TablePage;

export { default as TableView } from './TableView';
export { default as Table } from './Table';
export { default as useSelectedRow } from './useSelectedRow';
export { default as useSort, sortDataSource } from './useSort';
export { default as useTableConfig } from './useTableConfig';
export { default as tableLocalApis } from './tableLocalApis';
