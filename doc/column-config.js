const { Table } = _TablePage;
const { Flex, Tag } = antd;

const orderStatusMap = {
  已完成: { type: 'success', text: '已完成' },
  处理中: { type: 'processing', text: '处理中' },
  待发货: { type: 'warning', text: '待发货' },
  已取消: { type: 'default', text: '已取消' }
};

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

const columns = [
  { name: 'id', title: '订单编号', width: 160, min: 120, max: 240, fixed: 'left', renderType: 'small' },
  { name: 'customerName', title: '客户名称', width: 200, min: 140, max: 360, renderType: 'main' },
  { name: 'contact', title: '联系人', width: 90, min: 70, max: 160 },
  { name: 'phone', title: '联系电话', width: 130, min: 110, max: 180, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  {
    name: 'amount',
    title: '订单金额(元)',
    width: 130,
    min: 100,
    max: 200,
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  { name: 'orderDate', title: '下单日期', width: 110, min: 90, max: 160, format: 'date' },
  { name: 'deliveryDate', title: '预计送达', width: 110, min: 90, max: 160, format: 'date' },
  {
    name: 'status',
    title: '订单状态',
    width: 100,
    min: 80,
    max: 140,
    renderType: 'status',
    getValueOf: item => orderStatusMap[item.status] || { type: 'default', text: item.status }
  },
  { name: 'remark', title: '备注', width: 200, min: 120, max: 400, hidden: true, renderType: 'description' }
];

const TIP_TAG_STYLE = { marginRight: 8 };

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag style={TIP_TAG_STYLE} color="blue">列宽拖动</Tag>
      鼠标悬停表头列右侧，出现拖动手柄后可左右拖动调整列宽（受 <code>min</code> / <code>max</code> 约束）。仅 <code>Table</code> 组件支持。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="green">显示/隐藏</Tag>
      点击最后一列表头的 <strong>设置图标</strong>，可勾选显示或隐藏列、拖拽排序；配置通过 <code>name</code> 持久化到 localStorage。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="orange">默认隐藏</Tag>
      本示例中「备注」列设置了 <code>hidden: true</code>，可在列配置面板中重新显示。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="purple">固定列</Tag>
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
