const { Table, TableView } = _TablePage;
const { Flex, Radio, Tabs } = antd;
const { useState } = React;

const dataSource = [
  {
    id: 'ORD001',
    customerName: '深圳市腾讯计算机系统有限公司',
    contact: '张三',
    amount: 42500,
    status: '已完成'
  },
  {
    id: 'ORD002',
    customerName: '华为技术有限公司',
    contact: '李四',
    amount: 85000,
    status: '处理中'
  },
  {
    id: 'ORD003',
    customerName: '阿里巴巴集团控股有限公司',
    contact: '王五',
    amount: 120000,
    status: '待发货'
  }
];

const columns = [
  { name: 'id', title: '订单编号', width: 120, renderType: 'small' },
  { name: 'customerName', title: '客户名称', width: 220, renderType: 'main' },
  { name: 'contact', title: '联系人', width: 80 },
  {
    name: 'amount',
    title: '订单金额',
    width: 120,
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  { name: 'status', title: '状态', width: 100 }
];

const SizeDemo = ({ Component, title, description, size }) => (
  <div>
    <div style={{ marginBottom: 8 }}>
      <strong>{title}</strong>
      <span style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>{description}</span>
    </div>
    <Component dataSource={dataSource} columns={columns} size={size} controllerOpen={false} />
  </div>
);

const InteractiveSize = ({ Component }) => {
  const [size, setSize] = useState('default');
  return (
    <div>
      <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
        <strong>切换 size</strong>
        <Radio.Group
          optionType="button"
          value={size}
          onChange={e => setSize(e.target.value)}
          options={[
            { label: 'default (8px)', value: 'default' },
            { label: 'small (4px)', value: 'small' },
            { label: 'large (14px 8px)', value: 'large' }
          ]}
        />
      </Flex>
      <Component dataSource={dataSource} columns={columns} size={size === 'default' ? undefined : size} controllerOpen={false} />
    </div>
  );
};

const SizeExamples = ({ Component }) => (
  <Flex vertical gap={24}>
    <InteractiveSize Component={Component} />
    <SizeDemo Component={Component} title="default" description="padding: 8px" />
    <SizeDemo Component={Component} title='size="small"' description="padding: 4px" size="small" />
    <SizeDemo Component={Component} title='size="large"' description="padding: 14px 8px" size="large" />
    <div>
      <div style={{ marginBottom: 8 }}>
        <strong>CSS 变量覆盖</strong>
        <span style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>
          --kne-table-cell-padding-default: 12px 16px
        </span>
      </div>
      <div style={{ '--kne-table-cell-padding-default': '12px 16px' }}>
        <Component dataSource={dataSource} columns={columns} controllerOpen={false} />
      </div>
    </div>
  </Flex>
);

const BaseExample = () => {
  return (
    <Flex vertical gap={16}>
      <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: 8, fontSize: 13 }}>
        <div>
          <code>size</code> 控制单元格 padding：默认 <code>8px</code>，<code>small</code> 为 <code>4px</code>，
          <code>large</code> 为 <code>14px 8px</code>
        </div>
        <div style={{ marginTop: 4, color: '#666' }}>
          可通过 CSS 变量覆盖：
          <code>--kne-table-cell-padding-default</code> /
          <code>--kne-table-cell-padding-small</code> /
          <code>--kne-table-cell-padding-large</code>，或直接设
          <code>--kne-table-cell-padding</code>
        </div>
      </div>

      <Tabs
        items={[
          {
            key: 'table',
            label: 'Table',
            children: <SizeExamples Component={Table} />
          },
          {
            key: 'tableView',
            label: 'TableView',
            children: <SizeExamples Component={TableView} />
          }
        ]}
      />
    </Flex>
  );
};

render(<BaseExample />);
