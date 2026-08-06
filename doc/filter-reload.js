const { default: TablePage, Table } = _TablePage;
const { fields } = _ReactFilter;
const { SuperSelectFilterItem } = fields;
const { Flex, Tag, Button, Space, message, Alert } = antd;
const { useMemo, useState, useRef, useCallback } = React;

const TOTAL = 80;
const departments = ['技术研发部', '产品设计部', '市场营销部', '人力资源部', '财务部'];
const statuses = [
  { value: 'active', label: '在职' },
  { value: 'vacation', label: '休假' },
  { value: 'probation', label: '试用期' },
  { value: 'resigned', label: '离职' }
];
const positions = ['工程师', '高级工程师', '经理', '总监', '专员'];

const statusMap = {
  active: { type: 'success', text: '在职' },
  vacation: { type: 'warning', text: '休假' },
  probation: { type: 'processing', text: '试用期' },
  resigned: { type: 'default', text: '离职' }
};

const normalizeFilterValue = value => {
  if (value == null) {
    return value;
  }
  return Array.isArray(value) ? value[0] : value;
};

const pickQueryFilters = data => {
  const keys = ['department', 'status', 'position', 'keyword'];
  const next = {};
  keys.forEach(key => {
    const value = normalizeFilterValue(data?.[key]);
    if (value != null && value !== '') {
      next[key] = value;
    }
  });
  return next;
};

const buildEmployee = index => ({
  id: index + 1,
  name: `员工${index + 1}`,
  department: departments[index % departments.length],
  position: positions[index % positions.length],
  status: statuses[index % statuses.length].value
});

const applyFilters = (list, data) => {
  let result = list;
  const department = normalizeFilterValue(data?.department);
  if (department) {
    result = result.filter(item => item.department === department);
  }
  const status = normalizeFilterValue(data?.status);
  if (status) {
    result = result.filter(item => item.status === status);
  }
  const position = normalizeFilterValue(data?.position);
  if (position) {
    result = result.filter(item => item.position === position);
  }
  if (data?.keyword) {
    const keyword = String(data.keyword).toLowerCase();
    result = result.filter(item => item.name.toLowerCase().includes(keyword));
  }
  return result;
};

/**
 * 验证：已选筛选 UI 与 reload 查询条件必须一致。
 *
 * 复现步骤：
 * 1. 选择「部门 / 状态」等筛选项，确认列表已过滤、上方已选标签有值
 * 2. 勾选若干行，点「批量操作」完成业务后 reload
 * 3. 期望：已选标签不变；列表仍按筛选过滤；「最近一次请求参数」仍含筛选字段
 */
const FilterReloadExample = () => {
  const tableRef = useRef();
  const employeesRef = useRef(Array.from({ length: TOTAL }, (_, i) => buildEmployee(i)));
  const [dataVersion, setDataVersion] = useState(0);
  const { selectedRowKeys, selectedRows, getRowSelection, clearSelectedRows } = Table.useSelectedRow({ rowKey: 'id' });
  const [lastQuery, setLastQuery] = useState({});
  const [lastTrigger, setLastTrigger] = useState('首包');
  const triggerRef = useRef('首包');

  const allEmployees = employeesRef.current;
  const queryText = JSON.stringify(lastQuery, null, 2);
  const hasFilterInQuery = Object.keys(lastQuery).length > 0;

  const runAfterBatch = useCallback(
    (label, mutate) => {
      mutate(employeesRef.current);
      setDataVersion(v => v + 1);
      clearSelectedRows();
      triggerRef.current = label;
      // 故意裸调：只重置页码，不应丢掉当前已选筛选
      tableRef.current?.reload({ data: { currentPage: 1 } });
    },
    [clearSelectedRows]
  );

  return (
    <Flex vertical gap={12}>
      <Alert
        type="info"
        showIcon
        message="筛选 + 选择 + 批量操作 + reload 一致性"
        description={
          <div style={{ lineHeight: 1.7 }}>
            1. 先选筛选项（部门/状态等）
            <br />
            2. 勾选若干行（支持表头全选当前可勾选行）
            <br />
            3. 点「批量操作」执行业务（会改本地数据并 <code>reload</code>）
            <br />
            通过标准：已选筛选标签不变；列表仍是过滤结果；下方请求参数仍含筛选字段
          </div>
        }
      />

      <div
        style={{
          padding: 12,
          background: hasFilterInQuery ? '#f6ffed' : '#fff7e6',
          border: `1px solid ${hasFilterInQuery ? '#b7eb8f' : '#ffd591'}`,
          borderRadius: 8,
          fontSize: 13
        }}
      >
        <Space wrap style={{ marginBottom: 8 }}>
          <Tag color={hasFilterInQuery ? 'success' : 'warning'}>{hasFilterInQuery ? '请求含筛选' : '请求无筛选字段'}</Tag>
          <Tag>触发方式：{lastTrigger}</Tag>
          <Tag color="blue">已选 {selectedRowKeys.length} 条</Tag>
          <Tag>数据版本 {dataVersion}</Tag>
        </Space>
        <div style={{ color: '#666', marginBottom: 4 }}>最近一次请求参数（从 loader 的 data 提取）：</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{queryText === '{}' ? '{ }（无 department / status / position / keyword）' : queryText}</pre>
        {selectedRows.length > 0 ? (
          <div style={{ marginTop: 8, color: '#666' }}>
            当前选中：{selectedRows.map(item => item.name).join('、')}
          </div>
        ) : null}
      </div>

      <Space wrap>
        <Button
          onClick={() => {
            triggerRef.current = 'ref.reload({ data: { currentPage: 1 } })';
            tableRef.current?.reload({ data: { currentPage: 1 } });
          }}
        >
          ref.reload（裸调）
        </Button>
        <Button
          onClick={() => {
            triggerRef.current = 'ref.reload()';
            tableRef.current?.reload();
          }}
        >
          ref.reload() 无参
        </Button>
        <Button disabled={!selectedRowKeys.length} onClick={() => clearSelectedRows()}>
          清空选择
        </Button>
      </Space>

      <TablePage
        ref={tableRef}
        name="demo-filter-reload"
        rowKey="id"
        rowSelection={getRowSelection(allEmployees)}
        selectedRows={selectedRows}
        search={{ name: 'keyword', label: '关键词', placeholder: '搜姓名' }}
        filter={{
          list: [
            {
              type: SuperSelectFilterItem,
              props: {
                name: 'department',
                label: '部门',
                single: true,
                options: departments.map(item => ({ value: item, label: item }))
              }
            },
            {
              type: SuperSelectFilterItem,
              props: {
                name: 'status',
                label: '状态',
                single: true,
                options: statuses
              }
            },
            {
              type: SuperSelectFilterItem,
              props: {
                name: 'position',
                label: '职位',
                single: true,
                options: positions.map(item => ({ value: item, label: item }))
              }
            }
          ]
        }}
        batchActions={[
          {
            key: 'set-active',
            label: '批量设为在职',
            onClick: ({ selectedRowKeys: keys }) => {
              const idSet = new Set(keys);
              runAfterBatch('batch:设为在职 → reload', list => {
                list.forEach(item => {
                  if (idSet.has(item.id)) {
                    item.status = 'active';
                  }
                });
              });
              message.success(`已将 ${keys.length} 人设为在职并 reload`);
            }
          },
          {
            key: 'set-vacation',
            label: '批量设为休假',
            onClick: ({ selectedRowKeys: keys }) => {
              const idSet = new Set(keys);
              runAfterBatch('batch:设为休假 → reload', list => {
                list.forEach(item => {
                  if (idSet.has(item.id)) {
                    item.status = 'vacation';
                  }
                });
              });
              message.success(`已将 ${keys.length} 人设为休假并 reload`);
            }
          },
          {
            key: 'remove',
            label: '批量删除',
            danger: true,
            onClick: ({ selectedRowKeys: keys }) => {
              const idSet = new Set(keys);
              runAfterBatch('batch:删除 → reload', list => {
                employeesRef.current = list.filter(item => !idSet.has(item.id));
              });
              message.success(`已删除 ${keys.length} 人并 reload`);
            }
          },
          {
            key: 'reload-only',
            label: '仅 reload（不改数据）',
            onClick: ({ selectedRowKeys: keys, reload }) => {
              message.info(`已选 ${keys.length} 条，仅触发 reload`);
              triggerRef.current = 'batchActions.reload({ data: { currentPage: 1 } })';
              reload({ data: { currentPage: 1 } });
            }
          }
        ]}
        pagination={{
          open: true,
          pageSize: 10,
          showSizeChanger: true
        }}
        dataFormat={data => ({
          list: data.pageData,
          total: data.totalCount,
          data
        })}
        loader={({ data }) => {
          const query = pickQueryFilters(data);
          const trigger = triggerRef.current;
          const currentPage = Number(data?.currentPage) || 1;
          const perPage = Number(data?.perPage) || 10;
          const source = employeesRef.current;
          const filtered = applyFilters(source, data);
          const start = (currentPage - 1) * perPage;

          return new Promise(resolve => {
            setTimeout(() => {
              setLastQuery(query);
              setLastTrigger(trigger);
              triggerRef.current = '筛选/翻页等内部 reload';
              resolve({
                pageData: filtered.slice(start, start + perPage).map(item => ({ ...item })),
                totalCount: filtered.length
              });
            }, 300);
          });
        }}
        columns={[
          { name: 'id', title: 'ID', width: 70 },
          { name: 'name', title: '姓名', width: 120 },
          { name: 'department', title: '部门', width: 140 },
          { name: 'position', title: '职位', width: 120 },
          {
            name: 'status',
            title: '状态',
            width: 100,
            renderType: 'status',
            getValueOf: item => statusMap[item.status] || { type: 'default', text: item.status }
          }
        ]}
      />
    </Flex>
  );
};

render(<FilterReloadExample />);
