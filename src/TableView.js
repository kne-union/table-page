import React from 'react';
import { TableView as TableViewBase } from '@kne/table-view';

const TableView = ({ renderMobile = true, ...props }) => {
  return <TableViewBase renderMobile={renderMobile} {...props} />;
};

TableView.Header = TableViewBase.Header;
TableView.useSelectedRow = TableViewBase.useSelectedRow;
TableView.useSort = TableViewBase.useSort;
TableView.sortDataSource = TableViewBase.sortDataSource;

export default TableView;
