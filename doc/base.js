const { default: TablePage } = _TablePage;

const BaseExample = () => {
  return (
    <TablePage
      name="demo-table-page-base"
      loader={({ data }) => {
        const { currentPage = 1, perPage = 10 } = data || {};
        const total = 28;
        const start = (currentPage - 1) * perPage;
        const pageData = Array.from({ length: Math.min(perPage, total - start) }, (_, i) => ({
          id: `ORD${String(start + i + 1).padStart(4, '0')}`,
          orderNo: `ORD-2024-${String(start + i + 1).padStart(4, '0')}`,
          customerName: ['腾讯', '华为', '阿里', '字节', '百度'][i % 5],
          amount: 10000 + (start + i) * 1500,
          status: ['已完成', '处理中', '待发货'][i % 3]
        }));

        return new Promise(resolve => {
          setTimeout(() => resolve({ pageData, totalCount: total }), 300);
        });
      }}
      dataFormat={data => ({
        list: data.pageData,
        total: data.totalCount
      })}
      columns={[
        { name: 'orderNo', title: '订单编号', width: 160 },
        { name: 'customerName', title: '客户名称', width: 140 },
        {
          name: 'amount',
          title: '金额(元)',
          width: 120,
          render: value => `¥${value.toLocaleString()}`
        },
        { name: 'status', title: '状态', width: 100 }
      ]}
    />
  );
};

render(<BaseExample />);
