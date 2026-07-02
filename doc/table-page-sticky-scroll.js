const { default: TablePage } = _TablePage;
const { fields } = _ReactFilter;
const { SuperSelectFilterItem } = fields;
const { Flex, Tag } = antd;
const { useRef, useMemo } = React;

const NAV_HEIGHT = 56;
const DEMO_HEIGHT = 600;
const TOTAL = 80;

const statusMap = {
  active: { type: 'success', text: '在职' },
  vacation: { type: 'warning', text: '休假' },
  resigned: { type: 'default', text: '离职' },
  probation: { type: 'processing', text: '试用期' }
};

const departments = ['技术研发部', '产品设计部', '市场营销部', '人力资源部', '财务部'];

const departmentOptions = departments.map(item => ({ value: item, label: item }));
const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({ value, label: text }));

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

  return result;
};

const buildEmployee = index => {
  const statusKeys = ['active', 'vacation', 'resigned', 'probation'];
  return {
    id: `EMP${String(index + 1).padStart(4, '0')}`,
    employeeNo: `EMP-2024-${String(index + 1).padStart(4, '0')}`,
    name: `员工${index + 1}`,
    department: departments[index % departments.length],
    position: ['工程师', '经理', '专员'][index % 3],
    status: statusKeys[index % statusKeys.length],
    joinDate: `2024-${String((index % 12) + 1).padStart(2, '0')}-15`
  };
};

const allEmployees = Array.from({ length: TOTAL }, (_, index) => buildEmployee(index));

const columns = [
  { name: 'employeeNo', title: '工号', width: 160, min: 120, max: 220, fixed: 'left', renderType: 'small' },
  { name: 'name', title: '姓名', width: 100, renderType: 'main' },
  { name: 'department', title: '部门', width: 150 },
  { name: 'position', title: '职位', width: 120 },
  {
    name: 'status',
    title: '状态',
    width: 100,
    renderType: 'status',
    getValueOf: item => statusMap[item.status] || { type: 'default', text: item.status }
  },
  { name: 'joinDate', title: '入职日期', width: 120, format: 'date' }
];

const TIP_TAG_STYLE = { marginRight: 8 };

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag style={TIP_TAG_STYLE} color="blue">页面滚动</Tag>
      在下方<strong>灰色边框演示区</strong>内滚动（非 <code>scroll.y</code>）；表头通过 <code>sticky</code> + <code>getScrollContainer</code> 吸顶。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="green">getScrollContainer</Tag>
      指向演示区滚动容器；<code>scrollTopInset</code> 传入顶部导航占位高度（<code>{NAV_HEIGHT}px</code>），用于吸顶表头偏移与翻页滚回。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="gold">筛选栏</Tag>
      顶部工具栏含 <code>search</code> 与 <code>filter</code>；筛选变化会 <code>reload</code> 并回到第 1 页，翻页后滚回工具栏顶部。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="purple">横向 Scroller</Tag>
      表格底部未完全露出时，会在滚动容器底部显示横向滚动条（<code>horizontalScroller</code> 默认开启）。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="orange">操作提示</Tag>
      在演示区内向下滚动，蓝色导航条会吸顶，表格表头应固定在其下方；翻页后滚回表格顶部。
    </div>
  </div>
);

const BaseExample = () => {
  const scrollRef = useRef(null);

  const loader = useMemo(
    () =>
      ({ data, requestParams }) => {
        const currentPage = Number(data?.currentPage) || 1;
        const perPage = Number(data?.perPage) || 50;
        const filteredEmployees = applyFilters(allEmployees, data, requestParams);
        const start = (currentPage - 1) * perPage;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              pageData: filteredEmployees.slice(start, start + perPage),
              totalCount: filteredEmployees.length
            });
          }, 200);
        });
      },
    []
  );

  return (
    <Flex vertical gap={16}>
      <Tips />
      <div
        style={{
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff'
        }}
      >
        <div
          ref={scrollRef}
          style={{
            height: DEMO_HEIGHT,
            overflow: 'auto',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 100,
              height: NAV_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              color: '#fff',
              fontWeight: 500,
              background: '#1677ff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
            }}
          >
            模拟顶部导航（{NAV_HEIGHT}px）
          </div>
          <Flex vertical gap={16} style={{ padding: 16 }}>
            <div
              style={{
                padding: '20px 24px',
                background: '#f5f5f5',
                borderRadius: 8,
                color: '#666',
                fontSize: 13
              }}
            >
              在演示区内继续向下滚动 ↓
            </div>
            <div
              style={{
                height: 520,
                borderRadius: 8,
                background: 'linear-gradient(180deg, #f0f5ff 0%, #fff 100%)',
                border: '1px dashed #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}
            >
              占位区域（模拟页面上方内容）
            </div>
            <TablePage
              name="demo-table-page-sticky-scroll"
              sticky
              scrollTopInset={NAV_HEIGHT}
              getScrollContainer={() => scrollRef.current}
              scroll={{ x: 900 }}
              search={{ name: 'keyword', label: '关键词', placeholder: '搜索工号/姓名', style: { width: 200 } }}
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
              pagination={{
                open: true,
                pageSize: 50,
                cachePageSize: false,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              dataFormat={data => ({
                list: data.pageData,
                total: data.totalCount
              })}
              loader={loader}
              columns={columns}
            />
            <div style={{ height: 80, color: '#999', fontSize: 13, textAlign: 'center' }}>演示区底部留白</div>
          </Flex>
        </div>
      </div>
    </Flex>
  );
};

render(<BaseExample />);
