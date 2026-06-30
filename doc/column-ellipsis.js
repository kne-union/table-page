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
    render: value => `¥${value.toLocaleString()}`
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
