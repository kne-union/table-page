const { Table, TableView, mergeTreeChildren } = _TablePage;
const { Space, Button, Radio } = antd;
const { useState } = React;

const columns = [
  { name: 'name', title: '名称', renderType: 'main' },
  { name: 'code', title: '编码', width: 120 },
  { name: 'owner', title: '负责人', width: 100 }
];

const treeData = [
  {
    id: '1',
    name: '华东区',
    code: 'EAST',
    owner: '张三',
    children: [
      {
        id: '1-1',
        name: '上海',
        code: 'SH',
        owner: '李四',
        children: [
          { id: '1-1-1', name: '浦东分部', code: 'SH-PD', owner: '王五' },
          { id: '1-1-2', name: '徐汇分部', code: 'SH-XH', owner: '赵六' }
        ]
      },
      { id: '1-2', name: '杭州', code: 'HZ', owner: '钱七' }
    ]
  },
  {
    id: '2',
    name: '华北区',
    code: 'NORTH',
    owner: '孙八',
    children: [{ id: '2-1', name: '北京', code: 'BJ', owner: '周九' }]
  }
];

const treeListData = [
  { id: '1', name: '华东区', code: 'EAST', owner: '张三', parentId: null },
  { id: '1-1', name: '上海', code: 'SH', owner: '李四', parentId: '1' },
  { id: '1-1-1', name: '浦东分部', code: 'SH-PD', owner: '王五', parentId: '1-1' },
  { id: '1-1-2', name: '徐汇分部', code: 'SH-XH', owner: '赵六', parentId: '1-1' },
  { id: '1-2', name: '杭州', code: 'HZ', owner: '钱七', parentId: '1' },
  { id: '2', name: '华北区', code: 'NORTH', owner: '孙八', parentId: '' },
  { id: '2-1', name: '北京', code: 'BJ', owner: '周九', parentId: '2' }
];

const lazyRootData = [
  { id: 'org-1', name: '集团总部', code: 'HQ', owner: '张三', parentId: null, hasChildren: true },
  { id: 'org-2', name: '分公司', code: 'BR', owner: '李四', parentId: null, hasChildren: true }
];

const lazyChildrenMap = {
  'org-1': [
    { id: 'org-1-1', name: '研发中心', code: 'RD', owner: '王五', hasChildren: true },
    { id: 'org-1-2', name: '市场部', code: 'MKT', owner: '赵六', hasChildren: false }
  ],
  'org-1-1': [
    { id: 'org-1-1-1', name: '前端组', code: 'FE', owner: '钱七', hasChildren: false },
    { id: 'org-1-1-2', name: '后端组', code: 'BE', owner: '孙八', hasChildren: false }
  ],
  'org-2': [{ id: 'org-2-1', name: '华南办', code: 'SC', owner: '周九', hasChildren: false }]
};

const TreeExample = () => {
  const { selectedRowKeys, getRowSelection, clearSelectedRows } = Table.useSelectedRow({ rowKey: 'id' });
  const treeListSelection = Table.useSelectedRow({ rowKey: 'id' });
  const [expandedKeys, setExpandedKeys] = useState(false);
  const [checkRelation, setCheckRelation] = useState('parent');
  const [lazyData, setLazyData] = useState(lazyRootData);

  const handleLoadChildren = (item, { key }) =>
    new Promise(resolve => {
      setTimeout(() => {
        const children = lazyChildrenMap[key] || [];
        setLazyData(prev =>
          mergeTreeChildren(prev, children, {
            parentKeyValue: key,
            dataType: 'treeList',
            rowKey: 'id',
            parentKey: 'parentId',
            hasChildrenKey: 'hasChildren'
          })
        );
        resolve();
      }, 800);
    });

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <div style={{ marginBottom: 8 }}>Table：dataType=&quot;tree&quot;（嵌套 children）</div>
        <Table dataSource={treeData} columns={columns} dataType="tree" defaultExpandedKeys controllerOpen={false} />
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>Table：dataType=&quot;treeList&quot; + 勾选（checkRelation）</div>
        <Space style={{ marginBottom: 8 }} wrap>
          <Radio.Group
            value={checkRelation}
            optionType="button"
            options={[
              { label: 'parent', value: 'parent' },
              { label: 'all', value: 'all' },
              { label: 'independent', value: 'independent' }
            ]}
            onChange={e => {
              setCheckRelation(e.target.value);
              clearSelectedRows();
            }}
          />
        </Space>
        <Table dataSource={treeListData} columns={columns} dataType="treeList" defaultExpandedKeys controllerOpen={false} rowSelection={getRowSelection(treeListData, { allowSelectedAll: true, checkRelation })} />
        <div style={{ marginTop: 8 }}>已选 key：{selectedRowKeys.join(', ') || '无'}</div>
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>Table：懒加载（hasChildren + onLoadChildren + mergeTreeChildren）</div>
        <Table dataSource={lazyData} columns={columns} dataType="treeList" onLoadChildren={handleLoadChildren} controllerOpen={false} />
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>Table：受控展开 true / false / key 数组</div>
        <Space style={{ marginBottom: 8 }}>
          <Button size="small" onClick={() => setExpandedKeys(true)}>
            全部展开
          </Button>
          <Button size="small" onClick={() => setExpandedKeys(false)}>
            全部收起
          </Button>
          <Button size="small" onClick={() => setExpandedKeys(['1', '1-1'])}>
            展开指定节点
          </Button>
        </Space>
        <Table dataSource={treeData} columns={columns} dataType="tree" expandedKeys={expandedKeys} onExpandedKeysChange={setExpandedKeys} controllerOpen={false} />
      </div>

      <div>
        <div style={{ marginBottom: 8 }}>TableView：同样 API（CSS Grid 树形）</div>
        <TableView dataSource={treeListData} columns={columns} dataType="treeList" defaultExpandedKeys rowSelection={treeListSelection.getRowSelection(treeListData, { allowSelectedAll: true, checkRelation: 'parent' })} />
      </div>
    </Space>
  );
};

render(<TreeExample />);
