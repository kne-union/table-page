const { Table, TableView } = _TablePage;
const { Flex } = antd;

const statusMap = {
  待发货: { type: 'warning', text: '待发货' },
  处理中: { type: 'processing', text: '处理中' },
  已完成: { type: 'success', text: '已完成' }
};

const categoryMap = {
  企业客户: { type: 'default', text: '企业客户' },
  战略客户: { type: 'processing', text: '战略客户' }
};

const dataSource = [
  {
    id: 'ORD001',
    customerName: '深圳市腾讯计算机系统有限公司',
    category: '企业客户',
    tags: ['物流', '加急'],
    keywords: ['合同', '附件', '春节前'],
    remark: '客户要求春节前完成交付，需协调物流加急处理，并同步更新合同附件。',
    amount: 42500,
    status: '待发货'
  },
  {
    id: 'ORD002',
    customerName: '华为技术有限公司',
    category: '战略客户',
    tags: ['评审', '配置清单'],
    keywords: ['需求评审', '配置清单'],
    remark: '项目处于需求评审阶段，待客户确认最终配置清单后安排发货。',
    amount: 85000,
    status: '处理中'
  },
  {
    id: 'ORD003',
    customerName: '阿里巴巴集团控股有限公司',
    category: '企业客户',
    tags: ['拣货', '付款完成'],
    keywords: ['付款', '拣货', '发货'],
    remark: '已完成付款，仓库正在拣货，预计两个工作日内发出第一批货物。',
    amount: 120000,
    status: '已完成'
  }
];

const columns = [
  { name: 'id', title: '编号', renderType: 'small' },
  { name: 'customerName', title: '客户名称', renderType: 'main' },
  {
    name: 'category',
    title: '分类',
    renderType: 'tag-short',
    getValueOf: item => categoryMap[item.category]
  },
  {
    name: 'tags',
    title: '标签',
    renderType: 'tagList',
    getValueOf: item =>
      (item.tags || []).map(text => ({
        type: text === '加急' ? 'error' : 'processing',
        text
      }))
  },
  {
    name: 'keywords',
    title: '关键词',
    renderType: 'list',
    split: '、',
    getValueOf: item => item.keywords
  },
  { name: 'remark', title: '备注', renderType: 'description' },
  {
    name: 'amount',
    title: '金额',
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  {
    name: 'status',
    title: '状态',
    renderType: 'status',
    getValueOf: item => statusMap[item.status]
  },
  {
    name: 'options',
    title: '操作',
    renderType: 'options',
    fixed: 'right',
    getValueOf: item => {
      const actions = [
        { children: '查看', onClick: () => console.log('查看', item.id) },
        { children: '编辑', onClick: () => console.log('编辑', item.id) }
      ];
      if (item.status !== '已完成') {
        actions.push({
          children: '删除',
          isDelete: true,
          message: `确定删除 ${item.id} 吗？`,
          onClick: () => console.log('删除', item.id)
        });
      }
      return actions;
    }
  }
];

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
        <p>
          列配置 <code>renderType</code> 声明列的渲染方式，无需手写 <code>render</code>。内置类型：
        </p>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li><code>main</code> — 主信息列，支持 <code>primary</code> / <code>hover</code> / <code>onClick</code></li>
          <li><code>amount</code> — 金额列，右对齐，配合 <code>format</code> 格式化</li>
          <li><code>tag</code> — 单个 Tag，<code>getValueOf</code> 返回 <code>{'{ type, text }'}</code></li>
          <li><code>status</code> — 状态 Badge，<code>getValueOf</code> 返回 <code>{'{ type, text }'}</code></li>
          <li><code>tagList</code> — 多个 Tag 列表</li>
          <li><code>list</code> — 文本列表，可用 <code>split</code> 指定分隔符</li>
          <li><code>options</code> — 操作列，<code>getValueOf</code> 返回按钮配置数组</li>
          <li><code>description</code> — 长文本描述列</li>
          <li><code>enum</code> — 枚举值映射渲染</li>
        </ul>
        <p>
          可与尺寸修饰词组合：<code>short</code> / <code>small</code> / <code>large</code>（如 <code>tag-short</code>、<code>status-small</code>、<code>main-large</code>）。
          通过 <code>getValueOf</code> 传入 render 所需数据结构，通过 <code>format</code> 做日期、金额等展示格式化。
        </p>
      </div>
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>Table</div>
        <Table dataSource={dataSource} columns={columns} scroll={{ x: 1800 }} />
      </div>
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>TableView</div>
        <TableView dataSource={dataSource} columns={columns} />
      </div>
    </Flex>
  );
};

render(<BaseExample />);
