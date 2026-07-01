const { default: TablePage, Table } = _TablePage;
const { Table: AntTable, Flex, Badge, Tag, Button, Space } = antd;
const { useMemo } = React;

const TOTAL = 156;

const range = (start, end) => Array.from({ length: end - start }, (_, i) => start + i);

const surnames = ['张', '李', '王', '刘', '陈'];
const givenNames = ['伟', '强', '敏', '磊', '杰', '婷', '娜', '静', '丽', '娟'];
const departments = ['技术研发部', '产品设计部', '市场营销部', '人力资源部', '财务部'];
const positions = ['工程师', '高级工程师', '经理', '总监', '专员'];
const educations = ['本科', '硕士', '博士', '大专'];
const performances = ['A', 'B', 'C', 'S'];

const statusMap = {
  active: { color: 'success', text: '在职' },
  vacation: { color: 'warning', text: '休假' },
  resigned: { color: 'default', text: '离职' },
  probation: { color: 'processing', text: '试用期' }
};

const perfMap = {
  S: { color: 'success', text: 'S' },
  A: { color: 'processing', text: 'A' },
  B: { color: 'warning', text: 'B' },
  C: { color: 'error', text: 'C' }
};

const buildEmployee = index => {
  const statusKeys = ['active', 'vacation', 'resigned', 'probation'];
  return {
    id: `EMP${String(index + 1).padStart(4, '0')}`,
    employeeNo: `EMP-2024-${String(index + 1).padStart(4, '0')}`,
    name: `${surnames[index % surnames.length]}${givenNames[index % givenNames.length]}`,
    department: departments[index % departments.length],
    position: positions[index % positions.length],
    status: statusKeys[index % statusKeys.length],
    email: `employee${index + 1}@company.com`,
    phone: `138${String(index).padStart(8, '0')}`,
    joinDate: `2023-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    workYears: Math.floor(index / 12) + 1,
    salary: `${15 + (index % 20)}K-${20 + (index % 20)}K`,
    education: educations[index % educations.length],
    performance: performances[index % performances.length]
  };
};

const statusRender = value => {
  const { color, text } = statusMap[value] || { color: 'default', text: value };
  return <Badge status={color} text={text} />;
};

const perfRender = value => {
  const { color, text } = perfMap[value] || { color: 'default', text: value };
  return <Tag color={color === 'processing' ? 'blue' : color === 'success' ? 'green' : color === 'warning' ? 'orange' : color === 'error' ? 'red' : 'default'}>{text}</Tag>;
};

const columns = [
  { name: 'employeeNo', title: '工号', width: 180, min: 120, max: 240, fixed: 'left', sort: { single: true } },
  { name: 'name', title: '姓名', width: 100, min: 80, max: 160, fixed: 'left', sort: true },
  { name: 'department', title: '部门', width: 150, min: 120, max: 240, sort: true },
  { name: 'position', title: '职位', width: 120, min: 100, max: 200 },
  { name: 'status', title: '状态', width: 100, min: 80, max: 140, render: statusRender },
  { name: 'performance', title: '绩效', width: 80, min: 70, max: 120, render: perfRender },
  { name: 'phone', title: '手机号', width: 140, min: 120, max: 180, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  { name: 'email', title: '邮箱', width: 200, min: 160, max: 320, ellipsis: true },
  { name: 'joinDate', title: '入职日期', width: 120, min: 100, max: 160, format: 'date', sort: true },
  { name: 'workYears', title: '工龄', width: 90, min: 70, max: 120, sort: true, render: value => `${value}年` },
  { name: 'salary', title: '薪资范围', width: 120, min: 100, max: 180, hidden: true },
  { name: 'education', title: '学历', width: 90, min: 70, max: 120, hidden: true }
];

const sortFieldLabels = {
  employeeNo: '工号',
  name: '姓名',
  department: '部门',
  joinDate: '入职日期',
  workYears: '工龄'
};

const SortState = ({ sort }) => (
  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 8, fontSize: 13 }}>
    当前排序：
    {sort.length ? (
      sort.map(item => (
        <Tag key={item.name} color="blue" style={{ marginLeft: 8 }}>
          {sortFieldLabels[item.name] || item.name} {item.sort}
        </Tag>
      ))
    ) : (
      <span style={{ marginLeft: 8, color: '#999' }}>无</span>
    )}
  </div>
);

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag color="blue">数据加载</Tag>
      通过 <code>loader</code> 模拟分页接口，请求参数为 <code>data.currentPage</code>、<code>data.perPage</code>。
    </div>
    <div>
      <Tag color="green">分页</Tag>
      分页器渲染在表格外侧，翻页时以 <code>reload</code> 方式请求；<code>pageSize</code> 会持久化到 localStorage。
    </div>
    <div>
      <Tag color="orange">列配置</Tag>
      设置 <code>name</code> 开启列宽拖动与显示/隐藏，「薪资范围」「学历」默认隐藏。
    </div>
    <div>
      <Tag color="cyan">排序</Tag>
      配合 <code>Table.useSort</code> 与 <code>sortRender</code>，在 <code>onSortChange</code> 中调用 <code>reload</code> 传排序参数，与翻页一样不闪烁。
    </div>
    <div>
      <Tag color="purple">总结栏</Tag>
      <code>summary</code> 回调可拿到 <code>data</code>、<code>requestParams</code> 等 fetch 上下文。
    </div>
  </div>
);

const BaseExample = () => {
  const tableRef = React.useRef();
  const allEmployees = useMemo(() => range(0, TOTAL).map(buildEmployee), []);
  const { sort, sortRender } = Table.useSort({
    defaultSort: [{ name: 'joinDate', sort: 'DESC' }],
    onSortChange: newSort => {
      tableRef.current?.reload({
        data: { currentPage: 1, sort: newSort }
      });
    }
  });

  return (
    <Flex vertical gap={16}>
      <Tips />
      <SortState sort={sort} />
      <Space>
        <Button
          onClick={() => {
            tableRef.current?.reload({
              data: { currentPage: 1 }
            });
          }}
        >
          重新加载（回到第 1 页）
        </Button>
        <Button
          onClick={() => {
            tableRef.current?.refresh();
          }}
        >
          刷新当前页
        </Button>
      </Space>
      <TablePage
        ref={tableRef}
        name="demo-employee-table"
        sticky
        sortRender={sortRender}
        pagination={{
          open: true,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        dataFormat={data => ({
          list: data.pageData,
          total: data.totalCount,
          data
        })}
        loader={({ data, requestParams }) => {
          const currentPage = Number(data?.currentPage ?? requestParams?.data?.currentPage) || 1;
          const perPage = Number(data?.perPage ?? requestParams?.data?.perPage) || 20;
          const sortParams = data?.sort ?? requestParams?.data?.sort ?? [{ name: 'joinDate', sort: 'DESC' }];
          const sortedEmployees = sortParams.length ? Table.sortDataSource(allEmployees, sortParams, columns) : allEmployees;
          const startIndex = (currentPage - 1) * perPage;

          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                pageData: sortedEmployees.slice(startIndex, startIndex + perPage),
                totalCount: TOTAL
              });
            }, 400);
          });
        }}
        columns={columns}
        summary={({ pageData, data }) => {
          const totalCount = data?.totalCount || 0;
          return (
            <AntTable.Summary fixed>
              <AntTable.Summary.Row>
                <AntTable.Summary.Cell index={0} colSpan={5}>
                  <strong>当前页统计</strong>
                </AntTable.Summary.Cell>
                <AntTable.Summary.Cell index={5}>
                  <strong>{pageData.length} 人</strong>
                </AntTable.Summary.Cell>
                <AntTable.Summary.Cell index={6} colSpan={6}>
                  <strong>总员工数: {totalCount} 人</strong>
                </AntTable.Summary.Cell>
              </AntTable.Summary.Row>
            </AntTable.Summary>
          );
        }}
      />
    </Flex>
  );
};

render(<BaseExample />);
