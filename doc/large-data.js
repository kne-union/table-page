const { default: TablePage, Table } = _TablePage;
const { fields } = _ReactFilter;
const { SuperSelectFilterItem } = fields;
const { Flex, Button, Segmented, Space, message } = antd;
const { useState, useEffect, useRef, useMemo } = React;

const TOTAL = 3000;

const companies = ['深圳市腾讯计算机系统有限公司', '华为技术有限公司', '阿里巴巴集团控股有限公司', '北京字节跳动科技有限公司', '百度在线网络技术（北京）有限公司', '网易（杭州）网络有限公司', '小米科技有限责任公司', '京东世纪贸易有限公司'];
const contacts = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
const statusList = ['pending', 'processing', 'done', 'canceled'];
const statusMap = {
  pending: { type: 'warning', text: '待发货' },
  processing: { type: 'processing', text: '处理中' },
  done: { type: 'success', text: '已完成' },
  canceled: { type: 'default', text: '已取消' }
};
const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({ value, label: text }));
const tagPool = ['加急', '物流', '评审', '大客户', '续约', '分期'];
const remarks = ['客户要求春节前完成交付，需协调物流加急处理，并同步更新合同附件。', '项目处于需求评审阶段，待客户确认最终配置清单后安排发货。', '已完成付款，仓库正在拣货，预计两个工作日内发出第一批货物。'];

const allOrders = Array.from({ length: TOTAL }, (_, index) => {
  const status = statusList[index % statusList.length];
  const day = String((index % 28) + 1).padStart(2, '0');
  return {
    id: `ORD2024${String(index + 1).padStart(6, '0')}`,
    customerName: companies[index % companies.length],
    contact: contacts[index % contacts.length],
    phone: `13${String(800138000 + index * 7919).slice(0, 9)}`,
    amount: 10000 + ((index * 3779) % 190000),
    status,
    tags: [tagPool[index % tagPool.length], tagPool[(index + 2) % tagPool.length]],
    remark: remarks[index % remarks.length],
    orderDate: `2024-01-${day}`,
    deliveryDate: status === 'canceled' ? '' : `2024-02-${day}`
  };
});

// 列定义放在组件外保持引用稳定，表格才能复用单元格渲染结果
const columns = [
  { name: 'id', title: '订单编号', width: 170, renderType: 'small' },
  { name: 'customerName', title: '客户名称', renderType: 'main', onClick: ({ item }) => message.info(`查看客户：${item}`) },
  { name: 'contact', title: '联系人', width: 90 },
  { name: 'phone', title: '联系电话', width: 130, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  {
    name: 'amount',
    title: '订单金额',
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  {
    name: 'tags',
    title: '标签',
    renderType: 'tagList',
    getValueOf: item => item.tags.map(text => ({ type: text === '加急' ? 'error' : 'processing', text }))
  },
  { name: 'remark', title: '备注', renderType: 'description' },
  { name: 'orderDate', title: '下单日期', format: 'date' },
  { name: 'deliveryDate', title: '预计送达', format: 'date' },
  { name: 'status', title: '订单状态', renderType: 'status', getValueOf: item => statusMap[item.status] },
  {
    name: 'options',
    title: '操作',
    renderType: 'options',
    fixed: 'right',
    getValueOf: item => [
      { children: '查看', onClick: () => message.info(`查看 ${item.id}`) },
      { children: '编辑', onClick: () => message.info(`编辑 ${item.id}`) },
      { children: '删除', isDelete: true, message: `确定删除 ${item.id} 吗？`, onClick: () => message.success(`已删除 ${item.id}`) }
    ]
  }
];

const loader = ({ data }) => {
  const currentPage = Number(data?.currentPage) || 1;
  const perPage = Number(data?.perPage) || 100;
  const status = Array.isArray(data?.status) ? data.status[0] : data?.status;
  const keyword = data?.keyword ? String(data.keyword) : '';
  const filtered = allOrders.filter(item => (!status || item.status === status) && (!keyword || item.id.includes(keyword) || item.customerName.includes(keyword)));
  const start = (currentPage - 1) * perPage;
  // 模拟接口请求 800ms
  return new Promise(resolve => {
    setTimeout(() => resolve({ pageData: filtered.slice(start, start + perPage), totalCount: filtered.length }), 800);
  });
};

// 下一帧绘制完成后回调，用于近似测量「到用户看到」的耗时
const afterPaint = callback => requestAnimationFrame(() => setTimeout(callback, 0));

const LargeDataExample = () => {
  const [count, setCount] = useState(100);
  const [mountKey, setMountKey] = useState(0);
  const [renderCost, setRenderCost] = useState(null);
  const [selectCost, setSelectCost] = useState(null);
  const pendingRenderRef = useRef(false);
  const selectStartRef = useRef(null);
  const { selectedRows, getRowSelection, clearSelectedRows } = Table.useSelectedRow({ rowKey: 'id' });

  const measuredLoader = useMemo(
    () => params =>
      loader(params).then(result => {
        pendingRenderRef.current = performance.now();
        return result;
      }),
    []
  );

  const dataFormat = useMemo(
    () => data => {
      const start = pendingRenderRef.current;
      if (start) {
        pendingRenderRef.current = false;
        afterPaint(() => setRenderCost(Math.round(performance.now() - start)));
      }
      return { list: data.pageData, total: data.totalCount };
    },
    []
  );

  useEffect(() => {
    if (selectStartRef.current === null) {
      return;
    }
    const start = selectStartRef.current;
    selectStartRef.current = null;
    afterPaint(() => setSelectCost(Math.round(performance.now() - start)));
  }, [selectedRows]);

  const rowSelection = getRowSelection(allOrders, {
    onChange: () => {
      selectStartRef.current = performance.now();
    }
  });

  // 切数量 / 重新加载都重新挂载 TablePage，每次都走首包骨架屏
  const remount = () => {
    clearSelectedRows();
    setRenderCost(null);
    setSelectCost(null);
    setMountKey(key => key + 1);
  };

  return (
    <Flex vertical gap={12}>
      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>大数据量加载：首包走 TablePage 骨架屏加载壳，接口返回后切到真实表格，观察表格区域是否塌陷空白；含省略号列、标签列、固定操作列与多选，可勾选行观察重渲染耗时</div>
      <Flex gap={12} align="center" wrap>
        <span>每页数量</span>
        <Segmented
          value={count}
          onChange={value => {
            setCount(value);
            remount();
          }}
          options={[100, 300, 500, 1000].map(value => ({ value, label: `${value} 行` }))}
        />
        <Button type="primary" onClick={remount}>
          重新加载
        </Button>
        <Space size={16} style={{ color: '#666' }}>
          <span>
            首屏渲染：<strong>{renderCost === null ? '-' : `${renderCost} ms`}</strong>
          </span>
          <span>
            勾选响应：<strong>{selectCost === null ? '-' : `${selectCost} ms`}</strong>
          </span>
        </Space>
      </Flex>
      <TablePage
        key={mountKey}
        name="demo-table-page-large-data"
        sticky
        scroll={{ y: 400 }}
        search={{ name: 'keyword', label: '关键词', placeholder: '搜索订单编号/客户名称', style: { width: 220 } }}
        filter={{
          list: [[{ type: SuperSelectFilterItem, props: { name: 'status', label: '订单状态', single: true, options: statusOptions } }]],
          displayLine: 1
        }}
        batchActions={[
          {
            key: 'export',
            label: '批量导出',
            onClick: ({ selectedRowKeys }) => message.info(`正在导出 ${selectedRowKeys.length} 个订单`)
          }
        ]}
        rowSelection={rowSelection}
        selectedRows={selectedRows}
        pagination={{
          open: true,
          pageSize: count,
          cachePageSize: false,
          showSizeChanger: false,
          showQuickJumper: true
        }}
        dataFormat={dataFormat}
        loader={measuredLoader}
        columns={columns}
      />
    </Flex>
  );
};

render(<LargeDataExample />);
