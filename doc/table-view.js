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
        <span>已选订单：{selectedOrder ? `${selectedOrder.id} (${selectedOrder.customerName})` : '无'}</span>
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
