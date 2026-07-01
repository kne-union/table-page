# table-page

### 描述

实现一个Table页面，支持列配置，筛选器，排序，批量操作等

### 安装

```shell
npm i --save @kne/table-page
```

### 示例

#### 示例代码

- 这里填写示例标题
- 这里填写示例说明
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css)

```jsx
const {default:TablePage} = _TablePage;

const BaseExample = ()=>{
    return <div>
        <TablePage />
    </div>;
};

render(<BaseExample />);

```

- TableView
- 表格视图组件，支持行选择、列宽设置、粘性表头等
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { TableView } = _TablePage;
const { Flex, Tag, Badge } = antd;
const { useState } = React;

const dataSource = [
  {
    id: 'ORD20240115001',
    customerName: '深圳市腾讯计算机系统有限公司',
    contact: '张三',
    phone: '138-0013-8000',
    amount: 42500,
    status: '已完成',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-17'
  },
  {
    id: 'ORD20240115002',
    customerName: '华为技术有限公司',
    contact: '李四',
    phone: '139-0014-9000',
    amount: 85000,
    status: '处理中',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-20'
  },
  {
    id: 'ORD20240115003',
    customerName: '阿里巴巴集团控股有限公司',
    contact: '王五',
    phone: '137-0015-7000',
    amount: 120000,
    status: '待发货',
    orderDate: '2024-01-14',
    deliveryDate: '2024-01-22'
  },
  {
    id: 'ORD20240115004',
    customerName: '北京字节跳动科技有限公司',
    contact: '赵六',
    phone: '136-0016-6000',
    amount: 65000,
    status: '已完成',
    orderDate: '2024-01-13',
    deliveryDate: '2024-01-16'
  },
  {
    id: 'ORD20240115005',
    customerName: '百度在线网络技术（北京）有限公司',
    contact: '钱七',
    phone: '135-0017-5000',
    amount: 95000,
    status: '已取消',
    orderDate: '2024-01-12',
    deliveryDate: ''
  }
];

const columns = [
  { name: 'id', title: '订单编号', width: 180 },
  { name: 'customerName', title: '客户名称', span: 10 },
  { name: 'contact', title: '联系人', width: 80 },
  { name: 'phone', title: '联系电话', width: '130px', render: (value) => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  { name: 'amount', title: '订单金额(元)', render: (value) => <strong style={{ color: '#f5222d' }}>¥{value.toLocaleString()}</strong> },
  { name: 'orderDate', title: '下单日期', format: 'date' },
  { name: 'deliveryDate', title: '预计送达', format: 'date' },
  { name: 'status', title: '订单状态', width: 100, render: (value) => {
      const config = {
        '已完成': { color: 'success', text: '已完成' },
        '处理中': { color: 'processing', text: '处理中' },
        '待发货': { color: 'warning', text: '待发货' },
        '已取消': { color: 'default', text: '已取消' }
      };
      const { color, text } = config[value] || { color: 'default', text: value };
      return <Badge status={color} text={text} />;
    }}
];

const WithCheckbox = () => {
  const [selectKeys, setSelectKeys] = useState([]);
  const totalAmount = selectKeys.reduce((sum, id) => sum + (dataSource.find(d => d.id === id)?.amount || 0), 0);
  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <span>已选 <strong>{selectKeys.length}</strong> 个订单，总金额 <strong style={{ color: '#52c41a' }}>¥{totalAmount.toLocaleString()}</strong></span>
      </Flex>
      <TableView dataSource={dataSource} columns={columns} rowSelection={{
        type: 'checkbox', allowSelectedAll: true, selectedRowKeys: selectKeys, onChange: setSelectKeys
      }} />
    </div>
  );
};

const WithSelected = () => {
  const [selectKeys, setSelectKeys] = useState([]);
  const selectedOrder = dataSource.find(d => d.id === selectKeys[0]);
  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <span>已选订单：{selectedOrder ? &#96;${selectedOrder.id} (${selectedOrder.customerName})&#96; : '无'}</span>
        {selectedOrder && <Tag color="blue">¥{selectedOrder.amount.toLocaleString()}</Tag>}
      </Flex>
      <TableView dataSource={dataSource} columns={columns} rowSelection={{
        type: 'radio', selectedRowKeys: selectKeys, onChange: setSelectKeys
      }} />
    </div>
  );
};

const WithColumnWidth = () => {
  const widthColumns = [
    { name: 'id', title: '订单编号', width: 180 },
    { name: 'customerName', title: '客户名称', width: '200px' },
    { name: 'amount', title: '订单金额(元)', width: 120, render: (value) => <strong style={{ color: '#f5222d' }}>¥{value.toLocaleString()}</strong> },
    { name: 'status', title: '订单状态', width: '100px', render: (value) => {
      const config = {
        '已完成': { color: 'success', text: '已完成' },
        '处理中': { color: 'processing', text: '处理中' },
        '待发货': { color: 'warning', text: '待发货' },
        '已取消': { color: 'default', text: '已取消' }
      };
      const { color, text } = config[value] || { color: 'default', text: value };
      return <Badge status={color} text={text} />;
    }}
  ];
  return (
    <div>
      <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
        通过 columns 的 <code>width</code> 设置列最小宽度，支持数字（如 <code>180</code>）或字符串（如 <code>'100px'</code>），内容超出时会自动撑开
      </div>
      <TableView dataSource={dataSource.slice(0, 3)} columns={widthColumns} />
    </div>
  );
};

const BaseExample = () => {
  return (
    <Flex vertical gap={16}>
      <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
        订单列表 - 共 <strong>{dataSource.length}</strong> 个订单
      </div>
      <WithColumnWidth />
      <TableView dataSource={dataSource} columns={columns} />
      <WithCheckbox />
      <WithSelected />
      <div style={{ padding: '16px', background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: '8px' }}>
        暂无订单数据
      </div>
      <TableView
        style={{ height: '250px', overflowY: 'scroll' }}
        dataSource={dataSource}
        columns={columns}
        sticky
        headerStyle={{ position: 'sticky', top: 0, zIndex: 1, background: '#fafafa' }}
      />
    </Flex>
  );
};

render(<BaseExample />);

```

- Table
- 基于 antd Table 的表格组件，支持列宽拖动、字段显示/隐藏，与 TableView 使用一致的 columns、rowSelection 等 API
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { Table } = _TablePage;
const { Flex, Tag, Badge } = antd;
const { useState } = React;

const dataSource = [
  {
    id: 'ORD20240115001',
    customerName: '深圳市腾讯计算机系统有限公司',
    contact: '张三',
    phone: '13800138000',
    amount: 42500,
    status: '已完成',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-17'
  },
  {
    id: 'ORD20240115002',
    customerName: '华为技术有限公司',
    contact: '李四',
    phone: '13900149000',
    amount: 85000,
    status: '处理中',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-20'
  },
  {
    id: 'ORD20240115003',
    customerName: '阿里巴巴集团控股有限公司',
    contact: '王五',
    phone: '13700157000',
    amount: 120000,
    status: '待发货',
    orderDate: '2024-01-14',
    deliveryDate: '2024-01-22'
  },
  {
    id: 'ORD20240115004',
    customerName: '北京字节跳动科技有限公司',
    contact: '赵六',
    phone: '13600166000',
    amount: 65000,
    status: '已完成',
    orderDate: '2024-01-13',
    deliveryDate: '2024-01-16'
  },
  {
    id: 'ORD20240115005',
    customerName: '百度在线网络技术（北京）有限公司',
    contact: '钱七',
    phone: '13500175000',
    amount: 95000,
    status: '已取消',
    orderDate: '2024-01-12',
    deliveryDate: ''
  }
];

const columns = [
  { name: 'id', title: '订单编号', width: 180 },
  { name: 'customerName', title: '客户名称', width: 200 },
  { name: 'contact', title: '联系人', width: 80 },
  { name: 'phone', title: '联系电话', width: 130, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  { name: 'amount', title: '订单金额(元)', width: 120, render: value => <strong style={{ color: '#f5222d' }}>¥{value.toLocaleString()}</strong> },
  { name: 'orderDate', title: '下单日期', width: 110, format: 'date' },
  { name: 'deliveryDate', title: '预计送达', width: 110, format: 'date' },
  {
    name: 'status',
    title: '订单状态',
    width: 100,
    render: value => {
      const config = {
        已完成: { color: 'success', text: '已完成' },
        处理中: { color: 'processing', text: '处理中' },
        待发货: { color: 'warning', text: '待发货' },
        已取消: { color: 'default', text: '已取消' }
      };
      const { color, text } = config[value] || { color: 'default', text: value };
      return <Badge status={color} text={text} />;
    }
  }
];

const WithCheckbox = () => {
  const [selectKeys, setSelectKeys] = useState([]);
  const totalAmount = selectKeys.reduce((sum, id) => sum + (dataSource.find(d => d.id === id)?.amount || 0), 0);
  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <span>
          已选 <strong>{selectKeys.length}</strong> 个订单，总金额 <strong style={{ color: '#52c41a' }}>¥{totalAmount.toLocaleString()}</strong>
        </span>
      </Flex>
      <Table
        dataSource={dataSource}
        columns={columns}
        rowSelection={{
          type: 'checkbox',
          allowSelectedAll: true,
          selectedRowKeys: selectKeys,
          onChange: setSelectKeys
        }}
      />
    </div>
  );
};

const WithSelected = () => {
  const [selectKeys, setSelectKeys] = useState([]);
  const selectedOrder = dataSource.find(d => d.id === selectKeys[0]);
  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <span>已选订单：{selectedOrder ? &#96;${selectedOrder.id} (${selectedOrder.customerName})&#96; : '无'}</span>
        {selectedOrder && <Tag color="blue">¥{selectedOrder.amount.toLocaleString()}</Tag>}
      </Flex>
      <Table
        dataSource={dataSource}
        columns={columns}
        rowSelection={{
          type: 'radio',
          selectedRowKeys: selectKeys,
          onChange: setSelectKeys
        }}
      />
    </div>
  );
};

const WithScroll = () => {
  return (
    <div>
      <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
        基于 antd Table 渲染，支持 <code>scroll</code>、<code>sticky</code> 等原生表格能力
      </div>
      <Table
        dataSource={dataSource}
        columns={columns}
        sticky
        scroll={{ x: 1200, y: 240 }}
      />
    </div>
  );
};

const BaseExample = () => {
  return (
    <Flex vertical gap={16}>
      <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px' }}>
        订单列表（antd Table）- 共 <strong>{dataSource.length}</strong> 个订单，与 TableView 使用相同的 columns / rowSelection API
      </div>
      <Table dataSource={dataSource} columns={columns} />
      <WithCheckbox />
      <WithSelected />
      <Table dataSource={[]} columns={columns} />
      <WithScroll />
    </Flex>
  );
};

render(<BaseExample />);

```

- useSelectedRow
- 行选择 Hook，配合 Table / TableView 实现多选、全选、批量操作与单选
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { Table, TableView } = _TablePage;
const { Button, Flex, Space, Badge, message } = antd;

const dataSource = [
  {
    id: 'ORD20240115001',
    customerName: '深圳市腾讯计算机系统有限公司',
    contact: '张三',
    amount: 42500,
    status: '待发货',
    orderDate: '2024-01-15'
  },
  {
    id: 'ORD20240115002',
    customerName: '华为技术有限公司',
    contact: '李四',
    amount: 85000,
    status: '处理中',
    orderDate: '2024-01-15'
  },
  {
    id: 'ORD20240115003',
    customerName: '阿里巴巴集团控股有限公司',
    contact: '王五',
    amount: 120000,
    status: '待发货',
    orderDate: '2024-01-14'
  },
  {
    id: 'ORD20240115004',
    customerName: '北京字节跳动科技有限公司',
    contact: '赵六',
    amount: 65000,
    status: '已完成',
    orderDate: '2024-01-13'
  },
  {
    id: 'ORD20240115005',
    customerName: '百度在线网络技术（北京）有限公司',
    contact: '钱七',
    amount: 95000,
    status: '已取消',
    orderDate: '2024-01-12'
  }
];

const columns = [
  { name: 'id', title: '订单编号', width: 180 },
  { name: 'customerName', title: '客户名称', width: 220 },
  { name: 'contact', title: '联系人', width: 100 },
  { name: 'amount', title: '订单金额(元)', width: 130, render: value => <strong style={{ color: '#f5222d' }}>¥{value.toLocaleString()}</strong> },
  { name: 'orderDate', title: '下单日期', width: 120, format: 'date' },
  {
    name: 'status',
    title: '订单状态',
    width: 100,
    render: value => {
      const config = {
        已完成: { color: 'success', text: '已完成' },
        处理中: { color: 'processing', text: '处理中' },
        待发货: { color: 'warning', text: '待发货' },
        已取消: { color: 'default', text: '已取消' }
      };
      const { color, text } = config[value] || { color: 'default', text: value };
      return <Badge status={color} text={text} />;
    }
  }
];

const BatchToolbar = ({ selectedRowKeys, selectedRows, clearSelectedRows, onBatchShip, onBatchExport }) => {
  const totalAmount = selectedRows.reduce((sum, item) => sum + (item.amount || 0), 0);
  return (
    <Flex justify="space-between" align="center" style={{ marginBottom: 12, padding: '12px', background: '#f5f5f5', borderRadius: 8 }}>
      <Space>
        <span>
          已选 <strong>{selectedRowKeys.length}</strong> 个订单，总金额 <strong style={{ color: '#52c41a' }}>¥{totalAmount.toLocaleString()}</strong>
        </span>
        <Button type="primary" size="small" disabled={!selectedRowKeys.length} onClick={onBatchShip}>
          批量发货
        </Button>
        <Button size="small" disabled={!selectedRowKeys.length} onClick={onBatchExport}>
          批量导出
        </Button>
        <Button size="small" disabled={!selectedRowKeys.length} onClick={clearSelectedRows}>
          清空选择
        </Button>
      </Space>
    </Flex>
  );
};

const TableExample = () => {
  const { selectedRowKeys, selectedRows, getRowSelection, clearSelectedRows } = Table.useSelectedRow({ rowKey: 'id' });

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>Table + useSelectedRow</div>
      <BatchToolbar
        selectedRowKeys={selectedRowKeys}
        selectedRows={selectedRows}
        clearSelectedRows={clearSelectedRows}
        onBatchShip={() => {
          message.success(&#96;已批量发货 ${selectedRowKeys.length} 个订单&#96;);
          clearSelectedRows();
        }}
        onBatchExport={() => message.info(&#96;正在导出 ${selectedRowKeys.length} 个订单&#96;)}
      />
      <Table dataSource={dataSource} columns={columns} rowSelection={getRowSelection(dataSource)} />
    </div>
  );
};

const TableViewExample = () => {
  const { selectedRowKeys, selectedRows, getRowSelection, clearSelectedRows } = TableView.useSelectedRow({ rowKey: 'id' });

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>TableView + useSelectedRow</div>
      <BatchToolbar
        selectedRowKeys={selectedRowKeys}
        selectedRows={selectedRows}
        clearSelectedRows={clearSelectedRows}
        onBatchShip={() => {
          message.success(&#96;已批量发货 ${selectedRowKeys.length} 个订单&#96;);
          clearSelectedRows();
        }}
        onBatchExport={() => message.info(&#96;正在导出 ${selectedRowKeys.length} 个订单&#96;)}
      />
      <TableView dataSource={dataSource} columns={columns} rowSelection={getRowSelection(dataSource)} />
    </div>
  );
};

const RadioExample = () => {
  const { selectedRowKeys, selectedRows, getRowSelection } = Table.useSelectedRow({ rowKey: 'id', type: 'radio' });
  const selectedOrder = selectedRows[0];

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>单选模式 type: &apos;radio&apos;</div>
      <div style={{ marginBottom: 12 }}>
        当前选中：{selectedOrder ? &#96;${selectedOrder.id}（${selectedOrder.customerName}）&#96; : '无'}
      </div>
      <Table dataSource={dataSource} columns={columns} rowSelection={getRowSelection(dataSource)} />
    </div>
  );
};

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <TableExample />
      <TableViewExample />
      <RadioExample />
    </Flex>
  );
};

render(<BaseExample />);

```

- useSort
- 排序 Hook，配合 Table / TableView 实现表头排序、单列/多列排序与 sortDataSource 本地排序
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { Table, TableView } = _TablePage;
const { Flex, Badge, Tag } = antd;
const { useMemo } = React;

const dataSource = [
  { id: 'ORD001', customerName: '深圳市腾讯计算机系统有限公司', amount: 42500, status: '已完成', orderDate: '2024-01-15' },
  { id: 'ORD002', customerName: '华为技术有限公司', amount: 85000, status: '处理中', orderDate: '2024-01-14' },
  { id: 'ORD003', customerName: '阿里巴巴集团控股有限公司', amount: 120000, status: '待发货', orderDate: '2024-01-16' },
  { id: 'ORD004', customerName: '北京字节跳动科技有限公司', amount: 65000, status: '已完成', orderDate: '2024-01-13' },
  { id: 'ORD005', customerName: '百度在线网络技术（北京）有限公司', amount: 95000, status: '已取消', orderDate: '2024-01-12' }
];

const statusRender = value => {
  const config = {
    已完成: { color: 'success', text: '已完成' },
    处理中: { color: 'processing', text: '处理中' },
    待发货: { color: 'warning', text: '待发货' },
    已取消: { color: 'default', text: '已取消' }
  };
  const { color, text } = config[value] || { color: 'default', text: value };
  return <Badge status={color} text={text} />;
};

const columns = [
  { name: 'id', title: '订单编号', width: 140, sort: { single: true } },
  { name: 'customerName', title: '客户名称', width: 240, sort: true },
  { name: 'amount', title: '订单金额(元)', width: 130, sort: true, render: value => <strong style={{ color: '#f5222d' }}>¥{value.toLocaleString()}</strong> },
  { name: 'orderDate', title: '下单日期', width: 120, sort: true, format: 'date' },
  { name: 'status', title: '订单状态', width: 100, render: statusRender }
];

const SortState = ({ sort }) => (
  <div style={{ marginBottom: 12, padding: '12px', background: '#f5f5f5', borderRadius: 8 }}>
    当前排序：
    {sort.length ? (
      <span>
        {sort.map(item => (
          <Tag key={item.name} color="blue" style={{ marginLeft: 8 }}>
            {item.name} {item.sort}
          </Tag>
        ))}
      </span>
    ) : (
      <span style={{ marginLeft: 8, color: '#999' }}>无</span>
    )}
  </div>
);

const TableExample = () => {
  const { sort, sortRender } = Table.useSort({
    onSortChange: value => console.log('Table 排序变更:', value)
  });
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>Table + useSort（金额、日期支持多列排序）</div>
      <SortState sort={sort} />
      <Table dataSource={sortedData} columns={columns} sortRender={sortRender} />
    </div>
  );
};

const TableViewExample = () => {
  const { sort, sortRender } = TableView.useSort({
    defaultSort: [{ name: 'orderDate', sort: 'DESC' }],
    onSortChange: value => console.log('TableView 排序变更:', value)
  });
  const sortedData = useMemo(() => TableView.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>TableView + useSort（默认按下单日期降序）</div>
      <SortState sort={sort} />
      <TableView dataSource={sortedData} columns={columns} sortRender={sortRender} />
    </div>
  );
};

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <div style={{ color: '#666', fontSize: 13 }}>
        列配置 <code>sort: true</code> 开启排序，<code>sort: {'{ single: true }'}</code> 为单列排序。点击表头三角切换 DESC → ASC → 取消。
      </div>
      <TableExample />
      <TableViewExample />
    </Flex>
  );
};

render(<BaseExample />);

```

- column ellipsis
- 列 ellipsis 配置，基于 antd Typography 实现超出省略与 tooltip 展示
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { Table, TableView } = _TablePage;
const { Flex, Badge } = antd;

const dataSource = [
  {
    id: 'ORD001',
    customerName: '深圳市腾讯计算机系统有限公司深圳总部研发中心',
    remark: '客户要求春节前完成交付，需协调物流加急处理，并同步更新合同附件与验收标准说明文档。',
    amount: 42500,
    status: '待发货'
  },
  {
    id: 'ORD002',
    customerName: '华为技术有限公司坂田基地采购中心',
    remark: '项目处于需求评审阶段，待客户确认最终配置清单后安排发货。',
    amount: 85000,
    status: '处理中'
  },
  {
    id: 'ORD003',
    customerName: '阿里巴巴集团控股有限公司滨江园区',
    remark: '已完成付款，仓库正在拣货，预计两个工作日内发出第一批货物。',
    amount: 120000,
    status: '待发货'
  }
];

const statusRender = value => {
  const config = {
    已完成: { color: 'success', text: '已完成' },
    处理中: { color: 'processing', text: '处理中' },
    待发货: { color: 'warning', text: '待发货' }
  };
  const { color, text } = config[value] || { color: 'default', text: value };
  return <Badge status={color} text={text} />;
};

const columns = [
  { name: 'id', title: '订单编号', width: 120 },
  {
    name: 'customerName',
    title: '客户名称',
    width: 180,
    ellipsis: true
  },
  {
    name: 'remark',
    title: '备注',
    width: 220,
    ellipsis: { showTitle: true }
  },
  {
    name: 'amount',
    title: '金额',
    width: 100,
    render: value => &#96;¥${value.toLocaleString()}&#96;
  },
  { name: 'status', title: '状态', width: 90, render: statusRender }
];

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <div style={{ color: '#666', fontSize: 13 }}>
        列配置 <code>ellipsis: true</code> 或 <code>ellipsis: {'{ showTitle: true }'}</code>，超出宽度自动省略，悬停显示完整内容（基于 antd Typography）。
      </div>
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>Table</div>
        <Table dataSource={dataSource} columns={columns} />
      </div>
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>TableView</div>
        <TableView dataSource={dataSource} columns={columns} />
      </div>
    </Flex>
  );
};

render(<BaseExample />);

```

- column config
- 列宽拖动调整、显示/隐藏字段、列排序与 localStorage 持久化（仅 Table）
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { Table } = _TablePage;
const { Flex, Badge, Tag } = antd;

const dataSource = [
  {
    id: 'ORD20240115001',
    customerName: '深圳市腾讯计算机系统有限公司',
    contact: '张三',
    phone: '13800138000',
    amount: 42500,
    status: '已完成',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-17',
    remark: '客户要求春节前完成交付，需协调物流加急处理。'
  },
  {
    id: 'ORD20240115002',
    customerName: '华为技术有限公司',
    contact: '李四',
    phone: '13900149000',
    amount: 85000,
    status: '处理中',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-20',
    remark: '项目处于需求评审阶段，待客户确认最终配置清单。'
  },
  {
    id: 'ORD20240115003',
    customerName: '阿里巴巴集团控股有限公司',
    contact: '王五',
    phone: '13700157000',
    amount: 120000,
    status: '待发货',
    orderDate: '2024-01-14',
    deliveryDate: '2024-01-22',
    remark: '已完成付款，仓库正在拣货。'
  },
  {
    id: 'ORD20240115004',
    customerName: '北京字节跳动科技有限公司',
    contact: '赵六',
    phone: '13600166000',
    amount: 65000,
    status: '已完成',
    orderDate: '2024-01-13',
    deliveryDate: '2024-01-16',
    remark: '常规订单，按标准流程处理。'
  }
];

const statusRender = value => {
  const config = {
    已完成: { color: 'success', text: '已完成' },
    处理中: { color: 'processing', text: '处理中' },
    待发货: { color: 'warning', text: '待发货' },
    已取消: { color: 'default', text: '已取消' }
  };
  const { color, text } = config[value] || { color: 'default', text: value };
  return <Badge status={color} text={text} />;
};

const columns = [
  { name: 'id', title: '订单编号', width: 160, min: 120, max: 240, fixed: 'left' },
  { name: 'customerName', title: '客户名称', width: 200, min: 140, max: 360 },
  { name: 'contact', title: '联系人', width: 90, min: 70, max: 160 },
  { name: 'phone', title: '联系电话', width: 130, min: 110, max: 180, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  { name: 'amount', title: '订单金额(元)', width: 130, min: 100, max: 200, render: value => <strong style={{ color: '#f5222d' }}>¥{value.toLocaleString()}</strong> },
  { name: 'orderDate', title: '下单日期', width: 110, min: 90, max: 160, format: 'date' },
  { name: 'deliveryDate', title: '预计送达', width: 110, min: 90, max: 160, format: 'date' },
  { name: 'status', title: '订单状态', width: 100, min: 80, max: 140, render: statusRender },
  { name: 'remark', title: '备注', width: 200, min: 120, max: 400, hidden: true, ellipsis: true }
];

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag color="blue">列宽拖动</Tag>
      鼠标悬停表头列右侧，出现拖动手柄后可左右拖动调整列宽（受 <code>min</code> / <code>max</code> 约束）。仅 <code>Table</code> 组件支持。
    </div>
    <div>
      <Tag color="green">显示/隐藏</Tag>
      点击最后一列表头的 <strong>设置图标</strong>，可勾选显示或隐藏列、拖拽排序；配置通过 <code>name</code> 持久化到 localStorage。
    </div>
    <div>
      <Tag color="orange">默认隐藏</Tag>
      本示例中「备注」列设置了 <code>hidden: true</code>，可在列配置面板中重新显示。
    </div>
    <div>
      <Tag color="purple">固定列</Tag>
      「订单编号」设置了 <code>fixed: 'left'</code>，固定显示且不可隐藏。
    </div>
  </div>
);

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <Tips />
      <Table name="demo-table-column-config" controllerOpen dataSource={dataSource} columns={columns} />
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>关闭列配置（controllerOpen=false）</div>
        <Table dataSource={dataSource.slice(0, 2)} columns={columns} controllerOpen={false} />
      </div>
    </Flex>
  );
};

render(<BaseExample />);

```

- group header
- 分组表头（groupHeader），实现多级表头结构，可与 useSort 配合使用（仅 Table）
- _TablePage(@kne/current-lib_table-page)[import * as _TablePage from "@kne/table-page"],(@kne/current-lib_table-page/dist/index.css),antd(antd)

```jsx
const { Table } = _TablePage;
const { Flex, Tag } = antd;
const { useMemo } = React;

const dataSource = [
  {
    id: 'SALE001',
    region: '华北区',
    province: '北京',
    city: '北京',
    productName: '企业版 SaaS',
    productCode: 'SAAS-ENT',
    salesAmount: 1250000,
    salesVolume: 50,
    growthRate: 23.5,
    marketShare: 18.2,
    customerCount: 128,
    newCustomerCount: 32,
    repurchaseRate: 85.5,
    avgOrderValue: 9765.6,
    targetCompletion: 92.5
  },
  {
    id: 'SALE002',
    region: '华东区',
    province: '上海',
    city: '上海',
    productName: '企业版 SaaS',
    productCode: 'SAAS-ENT',
    salesAmount: 1680000,
    salesVolume: 68,
    growthRate: 35.2,
    marketShare: 22.8,
    customerCount: 156,
    newCustomerCount: 45,
    repurchaseRate: 88.6,
    avgOrderValue: 24705.9,
    targetCompletion: 105.2
  },
  {
    id: 'SALE003',
    region: '华南区',
    province: '广东',
    city: '深圳',
    productName: '专业版 SaaS',
    productCode: 'SAAS-PRO',
    salesAmount: 980000,
    salesVolume: 95,
    growthRate: 28.6,
    marketShare: 16.3,
    customerCount: 112,
    newCustomerCount: 28,
    repurchaseRate: 82.4,
    avgOrderValue: 10315.8,
    targetCompletion: 95.8
  }
];

const growthRateRender = value => (
  <span style={{ color: value > 20 ? '#52c41a' : value > 10 ? '#1677ff' : '#faad14' }}>{value}%</span>
);

const columns = [
  {
    name: 'region',
    title: '大区',
    width: 100,
    groupHeader: [{ name: 'area', title: '区域信息' }]
  },
  {
    name: 'province',
    title: '省份',
    width: 100,
    groupHeader: [{ name: 'area', title: '区域信息' }]
  },
  {
    name: 'city',
    title: '城市',
    width: 100,
    groupHeader: [{ name: 'area', title: '区域信息' }]
  },
  {
    name: 'productName',
    title: '产品名称',
    width: 150,
    groupHeader: [{ name: 'product', title: '产品信息' }]
  },
  {
    name: 'productCode',
    title: '产品编码',
    width: 130,
    groupHeader: [{ name: 'product', title: '产品信息' }]
  },
  {
    name: 'salesAmount',
    title: '销售金额',
    width: 130,
    sort: { single: true },
    render: value => <strong style={{ color: '#f5222d' }}>¥{(value / 10000).toFixed(2)}万</strong>,
    groupHeader: [{ name: 'sales', title: '销售业绩' }]
  },
  {
    name: 'salesVolume',
    title: '销售数量',
    width: 110,
    sort: true,
    groupHeader: [{ name: 'sales', title: '销售业绩' }]
  },
  {
    name: 'growthRate',
    title: '增长率',
    width: 110,
    sort: true,
    render: growthRateRender,
    groupHeader: [{ name: 'sales', title: '销售业绩' }]
  },
  {
    name: 'marketShare',
    title: '市场份额',
    width: 110,
    sort: true,
    render: value => &#96;${value}%&#96;,
    groupHeader: [{ name: 'market', title: '市场分析' }]
  },
  {
    name: 'customerCount',
    title: '客户总数',
    width: 110,
    sort: true,
    groupHeader: [{ name: 'market', title: '市场分析' }]
  },
  {
    name: 'newCustomerCount',
    title: '新增客户',
    width: 110,
    sort: true,
    groupHeader: [{ name: 'market', title: '市场分析' }]
  },
  {
    name: 'repurchaseRate',
    title: '复购率',
    width: 110,
    render: value => &#96;${value}%&#96;,
    groupHeader: [{ name: 'customer', title: '客户指标' }]
  },
  {
    name: 'avgOrderValue',
    title: '客单价',
    width: 120,
    render: value => &#96;¥${value.toLocaleString()}&#96;,
    groupHeader: [{ name: 'customer', title: '客户指标' }]
  },
  {
    name: 'targetCompletion',
    title: '目标完成率',
    width: 130,
    sort: true,
    render: value => (
      <span style={{ color: value >= 100 ? '#52c41a' : value >= 90 ? '#1677ff' : '#faad14' }}>{value}%</span>
    ),
    groupHeader: [{ name: 'target', title: '目标达成' }]
  }
];

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag color="blue">groupHeader</Tag>
      在列配置中通过 <code>groupHeader</code> 声明所属分组，相同 <code>name</code> 的列会自动合并为多级表头（仅 <code>Table</code> 支持）。
    </div>
    <div>
      <Tag color="green">多级分组</Tag>
      <code>groupHeader</code> 为数组，按层级嵌套，例如{' '}
      <code>{&#96;[{ name: 'sales', title: '销售业绩' }, { name: 'detail', title: '明细' }]&#96;}</code>。
    </div>
    <div>
      <Tag color="orange">排序</Tag>
      分组表头可与 <code>useSort</code> 配合，排序按钮显示在叶子列表头。
    </div>
  </div>
);

const BaseExample = () => {
  const { sort, sortRender } = Table.useSort({
    onSortChange: value => console.log('排序变更:', value)
  });
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <Flex vertical gap={24}>
      <Tips />
      <Table dataSource={sortedData} columns={columns} sortRender={sortRender} scroll={{ x: 1600 }} />
    </Flex>
  );
};

render(<BaseExample />);

```

### API

### TableView

表格视图组件，基于 Ant Design 的 Row/Col 布局实现，支持列配置、行选择、粘性表头等能力。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataSource | array | - | 表格数据源 |
| columns | array | - | 列配置，见下方 columns 说明 |
| rowKey | string \| function | `'id'` | 行唯一标识字段名或取值函数 |
| rowSelection | object | - | 行选择配置，见下方 rowSelection 说明 |
| placeholder | string | `'-'` | 空值占位符 |
| emptyIsPlaceholder | boolean | `true` | 空值是否显示占位符 |
| empty | ReactNode | `<Empty />` | 无数据时的展示内容 |
| sticky | boolean | - | 是否启用粘性表头 |
| headerStyle | object | - | 表头自定义样式 |
| onRowSelect | function | - | 行点击回调 `(item, { columns, dataSource }) => void` |
| render | function | - | 自定义渲染 `(props) => ReactNode`，可获取 `header` 和 `renderBody` |
| sortRender | function | - | 排序按钮渲染，由 `useSort` 提供 |

#### columns

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | - | 字段名，对应 dataSource 中的属性 |
| title | ReactNode | - | 列标题 |
| width | number \| string | - | 列最小宽度，支持数字（如 `50`，视为 50px）或字符串（如 `'50px'`），参与列宽计算，内容超出时会自动撑开 |
| span | number | - | 列占比（基于 24 栅格），未设置时自动均分剩余栅格 |
| align | string | `'top'` | 垂直对齐方式 |
| justify | string | `'flex-start'` | 水平对齐方式 |
| format | string \| function | - | 值格式化 |
| render | function | - | 自定义单元格渲染 `(value, { column, dataSource, context }) => ReactNode` |
| sort | boolean \| object | - | 是否支持排序，`{ single: true }` 为单列排序 |
| ellipsis | boolean \| object | `false` | 超出省略，基于 antd Typography；`true` 开启省略与 tooltip，`{ showTitle: false }` 关闭 tooltip |
| display | boolean \| function | - | 是否显示该列 |
| emptyIsPlaceholder | boolean | - | 该列空值是否显示占位符 |
| placeholder | string | - | 该列空值占位符 |
| renderPlaceholder | function | - | 自定义空值渲染 |

#### rowSelection

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | `'checkbox'` \| `'radio'` | - | 选择类型 |
| selectedRowKeys | array | - | 已选中的行 key 列表 |
| onChange | function | - | 选中变化回调 `(selectedRowKeys, id, { context, checked }) => void` |
| allowSelectedAll | boolean | - | 是否允许全选（仅 checkbox 模式） |
| isSelectedAll | boolean | - | 是否全选状态 |
| onIsSelectAllChange | function | - | 全选状态变化回调 |

### useSelectedRow

行选择 Hook，用于配合 `Table` / `TableView` 的 `rowSelection`，API 参考 `@kne/components-core` 同名 Hook。

#### 参数

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| rowKey | string \| function | `'id'` | 行唯一标识 |
| type | `'checkbox'` \| `'radio'` | `'checkbox'` | 选择类型 |

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| selectedRowKeys | array | 已选行 key 列表 |
| selectedRows | array | 已选行数据 |
| onSelect | function | `(item, checked) => void` |
| onSelectAll | function | `(checked, selected, items) => void` |
| setSelectedRows | function | 直接设置已选行数据 |
| setSelectedRowKeys | function | `(keys, dataSource) => void` |
| clearSelectedRows | function | 清空选择 |
| getRowSelection | function | `(dataSource, extra?) => rowSelection` 生成 `rowSelection` 配置 |

#### 示例

```jsx
const { selectedRowKeys, getRowSelection, clearSelectedRows } = Table.useSelectedRow({ rowKey: 'id' });

<Table
  dataSource={dataSource}
  columns={columns}
  rowSelection={getRowSelection(dataSource)}
/>;
```

### useSort

排序 Hook，配合 `Table` / `TableView` 的 `sortRender` 实现表头排序。

#### 参数

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sort | array | - | 受控排序值 `[{ name, sort: 'ASC' \| 'DESC' }]` |
| defaultSort | array | `[]` | 默认排序 |
| onSortChange | function | - | 排序变化回调 `(sort) => void` |

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| sort | array | 当前排序配置 |
| setSort | function | 设置排序 |
| sortRender | function | `({ name, single }) => ReactNode`，传给 Table / TableView |

#### columns.sort

| 值 | 说明 |
|----|------|
| `true` | 开启排序，默认单列模式 |
| `{ single: true }` | 单列排序，切换列时清除其他列 |
| `{ single: false }` | 多列排序 |

#### sortDataSource

本地排序工具函数：`sortDataSource(dataSource, sort, columns)`。

#### 示例

```jsx
const { sort, sortRender } = Table.useSort({ onSortChange: console.log });
const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort, dataSource]);

<Table dataSource={sortedData} columns={columns} sortRender={sortRender} />;
```

### Table

表格组件，以 antd `Table` 作为展示层，外层 API 与 `TableView` 保持一致，可直接复用相同的 `columns`、`rowSelection` 等配置。此外支持透传 antd Table 的原生属性（如 `scroll`、`pagination`、`size` 等）。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataSource | array | - | 表格数据源 |
| columns | array | - | 列配置，见 TableView 的 columns 说明 |
| rowKey | string \| function | `'id'` | 行唯一标识字段名或取值函数 |
| rowSelection | object | - | 行选择配置，见 TableView 的 rowSelection 说明 |
| placeholder | string | `'-'` | 空值占位符 |
| emptyIsPlaceholder | boolean | `true` | 空值是否显示占位符 |
| empty | ReactNode | `<Empty />` | 无数据时的展示内容 |
| sticky | boolean | - | 是否启用粘性表头 |
| headerStyle | object | - | 表头自定义样式 |
| onRowSelect | function | - | 行点击回调 `(item, { columns, dataSource }) => void` |
| render | function | - | 自定义渲染 `(props) => ReactNode`，`header` 为 `null`，`renderBody` 返回 antd Table |
| sortRender | function | - | 排序按钮渲染，由 `useSort` 提供 |
| pagination | boolean \| object | `false` | 分页配置，默认不显示；传入对象时使用 antd 分页 |
| name | string | - | 表格唯一标识，用于持久化列配置 |
| controllerOpen | boolean | `true` | 是否开启列宽拖动与列配置面板 |
| tableServerApis | object | - | 自定义列配置存储 API，默认使用 `localStorage` |
| ...antdTableProps | - | - | 其余属性透传给 antd `Table`（如 `scroll`、`bordered`） |

#### 与 TableView 的差异

| 项目 | TableView | Table |
|------|-----------|-------|
| 展示层 | Row/Col 自定义布局 | antd `Table` |
| `columns.span` | 基于 24 栅格分配列宽 | 不生效，请使用 `width` |
| 单选展示 | 右侧勾选图标 | antd 左侧 radio 列 |
| 列宽拖动 / 字段显示隐藏 | 不支持 | 支持，见下方说明 |
| 扩展能力 | 自定义 `render` 拆分表头/表体 | 支持 antd 原生 `scroll`、`pagination` 等 |

#### columns 扩展（仅 Table）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| hidden | boolean | `false` | 默认隐藏该列，可在列配置面板中重新显示 |
| min | number | `80` | 列最小宽度（px），拖动调整列宽时的下限，无需手动配置 |
| max | number | `600` | 列最大宽度（px），拖动调整列宽时的上限，无需手动配置 |
| fixed | `'left'` \| `'right'` \| boolean | - | 固定列，固定列不可隐藏或拖动排序 |
| groupHeader | array | - | 分组表头配置，见下方 groupHeader 说明 |

#### groupHeader

在列配置中通过 `groupHeader` 声明该列所属的分组表头，支持多级嵌套。相同分组路径的列会自动合并为 antd 嵌套表头（仅 `Table` 支持，`TableView` 不生效）。

| 属性 | 类型 | 说明 |
|------|------|------|
| name | string | 分组唯一标识 |
| title | ReactNode | 分组标题 |

完整示例见文档 `group header`。

#### 列宽拖动与字段显示/隐藏

设置 `name` 开启列配置持久化；`controllerOpen` 控制是否显示拖动手柄与设置面板（默认 `true`）。列只需配置 `width`，`min` / `max` 有默认值（80 / 600），一般无需手动指定。

```jsx
<Table
  name="order-list"
  dataSource={dataSource}
  columns={[
    { name: 'id', title: '订单编号', width: 160, min: 120, max: 240, fixed: 'left' },
    { name: 'customerName', title: '客户名称', width: 200, min: 140, max: 360 },
    { name: 'remark', title: '备注', width: 200, hidden: true }
  ]}
/>
```

- 悬停表头列右侧拖动手柄可调整列宽
- 点击最后一列表头设置图标可显示/隐藏列、拖拽排序
- `hidden: true` 的列默认隐藏，可在面板中重新显示
- `fixed` 列固定显示且不可隐藏

完整示例见文档 `column config`。
