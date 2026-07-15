const { default: TablePage, Table } = _TablePage;
const { fields } = _ReactFilter;
const { SuperSelectFilterItem } = fields;
const { Table: AntTable, Flex, Tag, Button, Space, Switch, message } = antd;
const { useMemo, useState } = React;

const TOTAL = 156;

const range = (start, end) => Array.from({ length: end - start }, (_, i) => start + i);

const surnames = ['张', '李', '王', '刘', '陈'];
const givenNames = ['伟', '强', '敏', '磊', '杰', '婷', '娜', '静', '丽', '娟'];
const departments = ['技术研发部', '产品设计部', '市场营销部', '人力资源部', '财务部'];
const positions = ['工程师', '高级工程师', '经理', '总监', '专员'];
const educations = ['本科', '硕士', '博士', '大专'];
const performances = ['A', 'B', 'C', 'S'];

const statusMap = {
  active: { type: 'success', text: '在职' },
  vacation: { type: 'warning', text: '休假' },
  resigned: { type: 'default', text: '离职' },
  probation: { type: 'processing', text: '试用期' }
};

const perfMap = {
  S: { type: 'success', text: 'S' },
  A: { type: 'processing', text: 'A' },
  B: { type: 'warning', text: 'B' },
  C: { type: 'error', text: 'C' }
};

const departmentOptions = departments.map(item => ({ value: item, label: item }));
const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({ value, label: text }));
const positionOptions = positions.map(item => ({ value: item, label: item }));

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

const columns = [
  {
    name: 'employeeNo',
    title: '工号',
    width: 180,
    min: 120,
    max: 240,
    fixed: 'left',
    sort: { single: true },
    renderType: 'main',
    primary: true,
    onClick: ({ item, colItem }) => {
      message.info(`查看员工：${colItem.name}（${item}）`);
    }
  },
  {
    name: 'name',
    title: '姓名',
    width: 100,
    min: 80,
    max: 160,
    sort: true,
    renderType: 'main',
    onClick: ({ item, colItem }) =>
      new Promise(resolve => {
        const hide = message.loading(`正在加载 ${item} 的详情…`, 0);
        setTimeout(() => {
          hide();
          message.success(`${colItem.department} · ${colItem.position}`);
          resolve();
        }, 600);
      })
  },
  { name: 'department', title: '部门', width: 150, min: 120, max: 240, sort: true },
  { name: 'position', title: '职位', width: 120, min: 100, max: 200 },
  {
    name: 'status',
    title: '状态',
    renderType: 'status',
    getValueOf: item => statusMap[item.status] || { type: 'default', text: item.status }
  },
  { name: 'performance', title: '绩效', width: 80, min: 70, max: 120, renderType: 'tag', getValueOf: item => perfMap[item.performance] || { type: 'default', text: item.performance } },
  { name: 'phone', title: '手机号', width: 140, min: 120, max: 180, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  { name: 'email', title: '邮箱', width: 200, min: 160, max: 320, ellipsis: true },
  { name: 'joinDate', title: '入职日期', width: 120, min: 100, max: 160, format: 'date', sort: true },
  { name: 'workYears', title: '工龄', width: 90, min: 70, max: 120, sort: true, render: value => `${value}年` },
  { name: 'salary', title: '薪资范围', width: 120, min: 100, max: 180, hidden: true },
  { name: 'education', title: '学历', width: 90, min: 70, max: 120, hidden: true },
  {
    name: 'options',
    title: '操作',
    renderType: 'options',
    fixed: 'right',
    width: 160,
    min: 120,
    max: 200,
    getValueOf: item => {
      const actions = [
        { children: '查看', onClick: () => message.info(`查看 ${item.name}`) },
        { children: '编辑', onClick: () => message.info(`编辑 ${item.name}`) }
      ];
      if (item.status !== 'resigned') {
        actions.push({
          children: '离职办理',
          onClick: () => message.warning(`办理离职 ${item.name}`)
        });
      }
      return actions;
    }
  }
];

const sortFieldLabels = {
  employeeNo: '工号',
  name: '姓名',
  department: '部门',
  joinDate: '入职日期',
  workYears: '工龄'
};

const normalizeFilterValue = value => {
  if (value == null) {
    return value;
  }
  return Array.isArray(value) ? value[0] : value;
};

const applyFilters = (employees, data, requestParams) => {
  const params = Object.assign({}, requestParams?.data, data);
  let result = employees;

  if (params.keyword) {
    const keyword = String(params.keyword).toLowerCase();
    result = result.filter(item => item.employeeNo.toLowerCase().includes(keyword) || item.name.includes(params.keyword));
  }

  const department = normalizeFilterValue(params.department);
  if (department) {
    result = result.filter(item => item.department === department);
  }

  const status = normalizeFilterValue(params.status);
  if (status) {
    result = result.filter(item => item.status === status);
  }

  const position = normalizeFilterValue(params.position);
  if (position) {
    result = result.filter(item => item.position === position);
  }

  return result;
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

const TIP_TAG_STYLE = { marginRight: 8 };

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag style={TIP_TAG_STYLE} color="blue">数据加载</Tag>
      通过 <code>loader</code> 模拟分页接口，请求参数为 <code>data.currentPage</code>、<code>data.perPage</code>。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="green">分页</Tag>
      分页器渲染在表格外侧，翻页时以 <code>reload</code> 方式请求；<code>pageSize</code> 会持久化到 localStorage；当 <code>total</code> 为 0（无数据）时不显示分页器。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="gold">筛选</Tag>
      顶部工具栏集成 <code>filter</code>、<code>search</code>、<code>batchActions</code>；筛选变化自动 <code>reload</code> 并回到第 1 页。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="lime">Tab</Tag>
      通过 <code>tab</code> 配置顶部分类切换（默认「全部」），选中值写入 filter value 并显示在已选标签；桌面端在表格边框外，移动端在 SearchInput 下方；可用 <code>tabProps</code> 透传 Tabs 属性（如 <code>tabBarExtraContent</code>）。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="orange">列配置</Tag>
      设置 <code>name</code> 开启列宽拖动与显示/隐藏，「薪资范围」「学历」默认隐藏；状态列使用 <code>renderType="status"</code>，绩效列使用 <code>renderType="tag"</code>，操作列使用 <code>renderType="options"</code> 且 <code>fixed="right"</code>。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="cyan">排序</Tag>
      配合 <code>Table.useSort</code> 与 <code>sortRender</code>、<code>mobileSortToolbar</code>，在 <code>onSortChange</code> 中调用 <code>reload</code> 传排序参数，与翻页一样不闪烁。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="volcano">移动端</Tag>
      设置 <code>renderMobile</code> 后，手机预览下启用卡片 List（含全选、排序工具栏）；桌面端仍为 antd Table。下方另有「仅 SearchInput + 自定义卡片」示例，用于确认 SearchInput 与卡片列表间距。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="geekblue">固定表头</Tag>
      设置 <code>sticky</code> 与 <code>scroll.y</code>，表体在固定高度内滚动时表头保持可见；横向滚动配合 <code>scroll.x</code>。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="magenta">单元格点击</Tag>
      列配置 <code>onClick</code>（配合 <code>renderType="main"</code>、<code>primary</code> / <code>hover</code>），仅可点击单元格 hover 时显示手型；工号列同步演示异步点击 loading。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="purple">总结栏</Tag>
      <code>summary</code> 回调可拿到 <code>data</code>、<code>requestParams</code> 等 fetch 上下文。
    </div>
  </div>
);

const BaseExample = () => {
  const tableRef = React.useRef();
  const [empty, setEmpty] = useState(false);
  const emptyRef = React.useRef(false);
  const allEmployees = useMemo(() => range(0, TOTAL).map(buildEmployee), []);
  const { selectedRows, getRowSelection } = Table.useSelectedRow({ rowKey: 'id' });
  const { sort, sortRender, mobileSortToolbar } = Table.useSort({
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
      <Space wrap>
        <Flex align="center" gap={8}>
          <Switch
            checked={empty}
            onChange={checked => {
              emptyRef.current = checked;
              setEmpty(checked);
              tableRef.current?.reload({ data: { currentPage: 1 } });
            }}
          />
          <span>{empty ? '空数据（无分页）' : '有数据（显示分页）'}</span>
        </Flex>
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
        scroll={{ x: 1600, y: 400 }}
        size="large"
        renderMobile
        sortRender={sortRender}
        mobileSortToolbar={mobileSortToolbar}
        rowSelection={getRowSelection(allEmployees)}
        selectedRows={selectedRows}
        search={{ name: 'keyword', label: '关键词', placeholder: '搜索工号/姓名', style: { width: 220 } }}
        tab={{
          name: 'position',
          label: '职位',
          list: positionOptions
        }}
        tabProps={{
          tabBarExtraContent: (
            <Button type="link" size="small" onClick={() => message.info('新增职位')}>
              新增职位
            </Button>
          )
        }}
        filter={{
          list: [
            [
              {
                type: SuperSelectFilterItem,
                props: { name: 'department', label: '部门', single: true, options: departmentOptions }
              },
              {
                type: SuperSelectFilterItem,
                props: { name: 'status', label: '状态', single: true, options: statusOptions }
              }
            ]
          ],
          displayLine: 1
        }}
        batchActions={[
          {
            key: 'export',
            label: '批量导出',
            onClick: ({ selectedRowKeys }) => {
              message.info(`正在导出 ${selectedRowKeys.length} 名员工`);
            }
          },
          {
            key: 'notify',
            label: '批量通知',
            onClick: ({ selectedRowKeys }) => {
              message.success(`已通知 ${selectedRowKeys.length} 名员工`);
            }
          }
        ]}
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
          if (emptyRef.current) {
            return new Promise(resolve => {
              setTimeout(() => resolve({ pageData: [], totalCount: 0 }), 400);
            });
          }
          const currentPage = Number(data?.currentPage ?? requestParams?.data?.currentPage) || 1;
          const perPage = Number(data?.perPage ?? requestParams?.data?.perPage) || 20;
          const sortParams = data?.sort ?? requestParams?.data?.sort ?? [{ name: 'joinDate', sort: 'DESC' }];
          const filteredEmployees = applyFilters(allEmployees, data, requestParams);
          const sortedEmployees = sortParams.length ? Table.sortDataSource(filteredEmployees, sortParams, columns) : filteredEmployees;
          const startIndex = (currentPage - 1) * perPage;

          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                pageData: sortedEmployees.slice(startIndex, startIndex + perPage),
                totalCount: filteredEmployees.length
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
                <AntTable.Summary.Cell index={6} colSpan={7}>
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

const sharedGroups = [
  {
    id: 1,
    name: '华北销售共享组',
    description: '覆盖华北区销售线索与客户跟进数据，成员可按只读或读写权限访问。',
    members: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }],
    dataSources: [{ id: 'd1' }, { id: 'd2' }],
    sharedModules: [{ id: 'm1' }]
  },
  {
    id: 2,
    name: '产品研发协作组',
    description: '产品与研发跨部门协作，共享需求池与缺陷跟踪模块。',
    members: [{ id: 'u4' }, { id: 'u5' }],
    dataSources: [{ id: 'd3' }],
    sharedModules: [{ id: 'm2' }, { id: 'm3' }]
  },
  {
    id: 3,
    name: '财务审计只读组',
    description: '审计人员只读访问财务相关模块与导出记录。',
    members: [{ id: 'u6' }],
    dataSources: [{ id: 'd4' }, { id: 'd5' }, { id: 'd6' }],
    sharedModules: [{ id: 'm4' }]
  }
];

const sharedGroupColumns = [
  { name: 'id', title: 'ID', width: 80, renderType: 'small' },
  { name: 'name', title: '共享组名称', width: 180, renderType: 'main' },
  { name: 'description', title: '描述', width: 320, renderType: 'description', ellipsis: true },
  {
    name: 'options',
    title: '操作',
    width: 140,
    renderType: 'options',
    getValueOf: item => [
      { children: '编辑', type: 'link', onClick: () => console.log('edit', item.id) },
      { children: '删除', type: 'link', isDelete: true, message: `确定删除 ${item.name} 吗？`, onClick: () => console.log('remove', item.id) }
    ]
  }
];

const SharedGroupMobileCard = ({ item }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '14px 16px',
      background: '#fff',
      border: '1px solid #f0f0f0',
      borderRadius: 12,
      boxSizing: 'border-box'
    }}
  >
    <div>
      <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 600, lineHeight: 1.4, color: 'rgba(0,0,0,0.88)' }}>
        {item.name}
      </div>
      <Flex align="center" gap={8} wrap="wrap" style={{ marginBottom: 6, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
        <span>成员 {item.members.length}</span>
        <span style={{ color: 'rgba(0,0,0,0.25)' }}>·</span>
        <span>数据来源 {item.dataSources.length}</span>
        <span style={{ color: 'rgba(0,0,0,0.25)' }}>·</span>
        <span>模块 {item.sharedModules.length}</span>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>#{item.id}</span>
      </Flex>
      <div
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'rgba(0,0,0,0.45)'
        }}
      >
        {item.description}
      </div>
    </div>
  </div>
);

/** 仅 SearchInput + renderMobile：确认工具栏与卡片列表有间距、不紧贴 */
const SearchMobileExample = () => (
  <Flex vertical gap={12}>
    <div style={{ color: '#666', fontSize: 13, lineHeight: 1.7 }}>
      <Tag color="blue" style={{ marginRight: 8 }}>
        search only
      </Tag>
      仅配置 <code>search</code>（无 filter / batch / tab），移动端开启 <code>renderMobile</code> 自定义卡片时，
      SearchInput 与下方卡片列表应有间距，不可紧挨。请切换手机预览查看。
    </div>
    <TablePage
      name="demo-search-mobile-gap"
      pagination={{ open: false }}
      search={{ name: 'keyword', label: '关键词', placeholder: '搜索共享组名称' }}
      columns={sharedGroupColumns}
      loader={() =>
        Promise.resolve({
          pageData: sharedGroups,
          totalCount: sharedGroups.length
        })
      }
      renderMobile={({ dataSource }) => (
        <Flex vertical gap={12} className="info-page-table-mobile-card-list">
          {(dataSource || []).map(item => (
            <SharedGroupMobileCard key={item.id} item={item} />
          ))}
        </Flex>
      )}
    />
  </Flex>
);

render(
  <Flex vertical gap={32}>
    <BaseExample />
    <SearchMobileExample />
  </Flex>
);