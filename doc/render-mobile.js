const { Table, TableView, preset } = _TablePage;
const { Flex, Tag, Card, Button, Dropdown, Tabs, Checkbox } = antd;
const { useState, useMemo } = React;

const statusMap = {
  已完成: { color: 'success', text: '已完成' },
  处理中: { color: 'processing', text: '处理中' },
  待发货: { color: 'warning', text: '待发货' }
};

const dataSource = [
  {
    id: 'ORD001',
    customerName: '深圳市腾讯计算机系统有限公司',
    contact: '张三',
    phone: '13800138000',
    amount: 42500,
    status: '已完成'
  },
  {
    id: 'ORD002',
    customerName: '华为技术有限公司',
    contact: '李四',
    phone: '13900149000',
    amount: 85000,
    status: '处理中'
  },
  {
    id: 'ORD003',
    customerName: '阿里巴巴集团控股有限公司',
    contact: '王五',
    phone: '13700157000',
    amount: 120000,
    status: '待发货'
  }
];

const columns = [
  { name: 'id', title: '订单编号', width: 120, renderType: 'small' },
  { name: 'customerName', title: '客户名称', width: 220, renderType: 'main', sort: true },
  { name: 'contact', title: '联系人', width: 80 },
  { name: 'phone', title: '联系电话', width: 130, render: value => value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') },
  {
    name: 'amount',
    title: '订单金额',
    width: 120,
    sort: true,
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  {
    name: 'status',
    title: '状态',
    width: 100,
    renderType: 'status',
    getValueOf: item => ({ type: statusMap[item.status]?.color || 'default', text: item.status })
  },
  {
    name: 'options',
    title: '操作',
    width: 140,
    renderType: 'options',
    getValueOf: item => [
      { children: '查看', onClick: () => console.log('查看', item.id) },
      { children: '编辑', onClick: () => console.log('编辑', item.id) },
      { children: '删除', isDelete: true, message: `确定删除 ${item.id} 吗？`, onClick: () => console.log('删除', item.id) }
    ]
  }
];

preset({
  renderMobile: {
    orderCard: ({ renderBody }) => {
      const totalAmount = dataSource.reduce((sum, item) => sum + item.amount, 0);
      return (
        <div
          className="preset-order-card-example"
          style={{
            borderRadius: 12,
            background: '#f5f7fa',
            padding: 16
          }}
        >
          <style>{`
            .preset-order-card-example .info-page-table-mobile-card:not(.is-mobile-card-selected):not(.is-mobile-card-selected-all) {
              background: linear-gradient(135deg, #ffffff 0%, #f9f0ff 52%, #eef2ff 100%) !important;
              border-color: #e8dfff !important;
            }
            .preset-order-card-example .info-page-table-mobile-card:not(.is-mobile-card-selected):not(.is-mobile-card-selected-all):hover {
              background: linear-gradient(135deg, #fafafa 0%, #f3ebff 52%, #e8eeff 100%) !important;
            }
          `}</style>
          <div style={{ marginBottom: 16 }}>
            <Flex justify="space-between" align="center" gap={8} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>近期订单</div>
              <Tag color="purple" style={{ margin: 0, flexShrink: 0 }}>
                preset: orderCard
              </Tag>
            </Flex>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              {dataSource.length} 笔 · 合计 ¥{totalAmount.toLocaleString()}
            </div>
          </div>
          <div
            className="info-page-table"
            style={{
              '--kne-table-cell-padding': '14px 8px'
            }}
          >
            {renderBody()}
          </div>
        </div>
      );
    }
  }
});

const formatPhone = phone => phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');

const getOrderActions = item => [
  { key: 'view', label: '查看', onClick: () => console.log('查看', item.id) },
  { key: 'edit', label: '编辑', onClick: () => console.log('编辑', item.id) },
  { key: 'delete', label: '删除', danger: true, onClick: () => console.log('删除', item.id) }
];

const OrderMobileCard = ({ item, checked, disabled, onCheckChange }) => {
  const status = statusMap[item.status] || { color: 'default', text: item.status };
  const actionItems = getOrderActions(item);
  const isSelected = checked;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: isSelected ? 'var(--primary-color-1, #e6f4ff)' : '#fff',
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${isSelected ? 'var(--primary-color-2, var(--primary-color, #1677ff))' : 'transparent'}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        color: isSelected ? 'var(--primary-color, #1677ff)' : undefined,
        boxSizing: 'border-box'
      }}
    >
      <Checkbox checked={checked} disabled={disabled} onChange={onCheckChange} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Flex justify="space-between" align="center" gap={8} style={{ marginBottom: 10 }}>
          <Flex align="center" gap={8} wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
            <Tag color={status.color} style={{ margin: 0 }}>
              {status.text}
            </Tag>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{item.id}</span>
          </Flex>
          <Dropdown
            trigger={['click']}
            menu={{
              items: actionItems.map(({ key, label, danger, onClick }) => ({
                key,
                label,
                danger,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  onClick();
                }
              }))
            }}
          >
            <Button type="text" size="small" style={{ padding: '0 4px' }} onClick={e => e.stopPropagation()}>
              ···
            </Button>
          </Dropdown>
        </Flex>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.88)',
            lineHeight: 1.5,
            marginBottom: 6
          }}
        >
          {item.customerName}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: 1.6 }}>
          {item.contact} · {formatPhone(item.phone)}
        </div>
        <Flex
          justify="space-between"
          align="center"
          gap={12}
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #f0f0f0'
          }}
        >
          <Flex align="baseline" gap={6} style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', flexShrink: 0 }}>订单金额</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>¥{item.amount.toLocaleString()}</span>
          </Flex>
          <Flex gap={4} align="center" style={{ flexShrink: 0 }}>
            {actionItems.slice(0, 2).map(({ key, label, onClick }) => (
              <Button
                key={key}
                type="link"
                size="small"
                style={{ padding: '0 4px', height: 'auto' }}
                onClick={e => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                {label}
              </Button>
            ))}
          </Flex>
        </Flex>
      </div>
    </div>
  );
};

const DefaultMobileCards = ({ Component }) => {
  const [selectKeys, setSelectKeys] = useState([]);
  const totalAmount = selectKeys.reduce((sum, id) => sum + (dataSource.find(d => d.id === id)?.amount || 0), 0);
  return (
    <div>
      <div style={{ marginBottom: 12, color: '#666', fontSize: 13, lineHeight: 1.7 }}>
        <code>renderMobile={'{true}'}</code>：移动端启用默认卡片 List，不再渲染 antd Table；
        开启 <code>allowSelectedAll</code> 后顶部工具栏左侧显示全选。请用示例预览的手机模式查看效果。
      </div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <span>
          已选 <strong>{selectKeys.length}</strong> 个订单，总金额 <strong style={{ color: '#52c41a' }}>¥{totalAmount.toLocaleString()}</strong>
        </span>
      </Flex>
      <Component
        dataSource={dataSource}
        columns={columns}
        size="large"
        controllerOpen={false}
        renderMobile
        rowSelection={{
          type: 'checkbox',
          allowSelectedAll: true,
          selectedRowKeys: selectKeys,
          onChange: keys => setSelectKeys(keys)
        }}
      />
    </div>
  );
};

const SortState = ({ sort }) => (
  <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f5f5f5', borderRadius: 8, fontSize: 13 }}>
    当前排序：
    {sort.length ? (
      <span>
        {sort.map(item => (
          <Tag key={item.name} color="blue" style={{ marginLeft: 8 }}>
            {item.name} {item.sort}
          </Tag>
        ))}
      </span>
    ) : (
      <span style={{ marginLeft: 8, color: '#999' }}>无</span>
    )}
  </div>
);

const MobileSortWithSelectAll = ({ Component }) => {
  const [selectKeys, setSelectKeys] = useState([]);
  const { sort, sortRender, mobileSortToolbar } = Table.useSort({});
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <Component
      dataSource={sortedData}
      columns={columns}
      size="large"
      controllerOpen={false}
      renderMobile
      sortRender={sortRender}
      mobileSortToolbar={mobileSortToolbar}
      rowSelection={{
        type: 'checkbox',
        allowSelectedAll: true,
        selectedRowKeys: selectKeys,
        onChange: keys => setSelectKeys(keys)
      }}
    />
  );
};

const MobileSortExample = ({ Component }) => {
  const { sort, sortRender, mobileSortToolbar } = Table.useSort({
    defaultSort: [{ name: 'amount', sort: 'DESC' }],
    onSortChange: value => console.log('移动端排序变更:', value)
  });
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <Flex vertical gap={24}>
      <div>
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13, lineHeight: 1.7 }}>
          移动端排序：列配置 <code>sort: true</code>，配合 <code>Table.useSort</code> 传入 <code>mobileSortToolbar</code>。
          工具栏居右，可选择排序列并切换升序 / 降序；再次点击当前方向或下拉选「取消排序」可清除。数据需自行用 <code>sortDataSource</code> 排序。
        </div>
        <SortState sort={sort} />
        <Component
          dataSource={sortedData}
          columns={columns}
          size="large"
          controllerOpen={false}
          renderMobile
          sortRender={sortRender}
          mobileSortToolbar={mobileSortToolbar}
        />
      </div>
      <div>
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13, lineHeight: 1.7 }}>
          排序与全选同时开启：工具栏左侧全选、右侧排序。
        </div>
        <MobileSortWithSelectAll Component={Component} />
      </div>
    </Flex>
  );
};

const CustomMobileRender = ({ Component }) => {
  const [selectKeys, setSelectKeys] = useState([]);
  const [isSelectedAll, setIsSelectedAll] = useState(false);
  const totalAmount = dataSource.reduce((sum, item) => sum + item.amount, 0);
  const selectedAmount = selectKeys.reduce((sum, id) => sum + (dataSource.find(d => d.id === id)?.amount || 0), 0);
  const checkedAll = isSelectedAll || (dataSource.length > 0 && selectKeys.length === dataSource.length);
  const indeterminate = selectKeys.length > 0 && !checkedAll;

  const handleSelectAllChange = e => {
    const checked = e.target.checked;
    if (!checked) {
      setIsSelectedAll(false);
      setSelectKeys([]);
      return;
    }
    setIsSelectedAll(true);
    setSelectKeys(dataSource.map(item => item.id));
  };

  const handleCardCheckChange = (id, checked) => {
    setIsSelectedAll(false);
    setSelectKeys(keys => (checked ? keys.filter(key => key !== id) : [...keys, id]));
  };

  return (
    <div>
      <div style={{ marginBottom: 12, color: '#666', fontSize: 13, lineHeight: 1.7 }}>
        <code>renderMobile</code> 为 function 时完全接管渲染，可自定义主次关系卡片：客户名称作主信息，状态/编号/联系人作次要信息。
        桌面端仍走 <code>render</code>，样式与普通 Table 一致。
      </div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <span>
          已选 <strong>{selectKeys.length}</strong> 个订单，金额 <strong style={{ color: '#52c41a' }}>¥{selectedAmount.toLocaleString()}</strong>
        </span>
      </Flex>
      <Card size="small" title="近期订单" extra={<Tag>桌面 render</Tag>} styles={{ body: { padding: 0 } }}>
        <Flex
          justify="space-between"
          align="center"
          style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
        >
          <Flex gap={8} align="center">
            <Tag color="blue">{dataSource.length} 笔</Tag>
            <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: 13 }}>
              合计 <strong style={{ color: '#52c41a' }}>¥{totalAmount.toLocaleString()}</strong>
            </span>
          </Flex>
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>桌面端 render 自定义外层</span>
        </Flex>
        <Component
          dataSource={dataSource}
          columns={columns}
          controllerOpen={false}
          render={({ renderBody }) => <div style={{ overflowX: 'auto' }}>{renderBody()}</div>}
          renderMobile={() => (
            <div
              style={{
                borderRadius: 12,
                background: '#f5f7fa',
                padding: 16
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Flex justify="space-between" align="center" gap={8} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}>近期订单</div>
                  <Tag color="processing" style={{ margin: 0, flexShrink: 0 }}>
                    renderMobile
                  </Tag>
                </Flex>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                  {dataSource.length} 笔 · 合计 ¥{totalAmount.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  padding: '4px 8px',
                  background: 'var(--bg-color-grey-1, #fafafa)',
                  borderRadius: 8,
                  fontSize: 12
                }}
              >
                <Checkbox checked={checkedAll} indeterminate={indeterminate} onChange={handleSelectAllChange} />
                <span>全选</span>
              </div>
              <Flex vertical gap={12}>
                {dataSource.map(item => {
                  const isChecked = selectKeys.indexOf(item.id) > -1;
                  return (
                    <OrderMobileCard
                      key={item.id}
                      item={item}
                      checked={(isSelectedAll && !item.disabled) || isChecked}
                      disabled={isSelectedAll}
                      onCheckChange={() => handleCardCheckChange(item.id, isChecked)}
                    />
                  );
                })}
              </Flex>
            </div>
          )}
        />
      </Card>
    </div>
  );
};

const PresetStringRender = ({ Component }) => {
  const [selectKeys, setSelectKeys] = useState([]);
  const { sort, sortRender, mobileSortToolbar } = Table.useSort({
    defaultSort: [{ name: 'amount', sort: 'DESC' }]
  });
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <Flex vertical gap={24}>
      <div>
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13, lineHeight: 1.7 }}>
          <code>renderMobile="orderCard"</code>：通过 <code>preset({'{ renderMobile }'})</code> 注册名称对应的渲染函数；
          仅移动端生效，支持全选与选中样式。可配合 <code>mobileSortToolbar</code> 开启排序。
        </div>
        <Component
          dataSource={sortedData}
          columns={columns}
          controllerOpen={false}
          size="large"
          renderMobile="orderCard"
          sortRender={sortRender}
          mobileSortToolbar={mobileSortToolbar}
          rowSelection={{
            type: 'checkbox',
            allowSelectedAll: true,
            selectedRowKeys: selectKeys,
            onChange: keys => setSelectKeys(keys)
          }}
        />
      </div>
      <div>
        <div style={{ marginBottom: 12, color: '#666', fontSize: 13, lineHeight: 1.7 }}>
          <code>renderMobile="notRegistered"</code>：preset 中未注册时视为未开启，移动端仍显示普通表格。
        </div>
        <Component dataSource={dataSource} columns={columns} controllerOpen={false} renderMobile="notRegistered" />
      </div>
    </Flex>
  );
};

const Examples = ({ Component }) => (
  <Flex vertical gap={32}>
    <DefaultMobileCards Component={Component} />
    <MobileSortExample Component={Component} />
    <CustomMobileRender Component={Component} />
    <PresetStringRender Component={Component} />
  </Flex>
);

const BaseExample = () => {
  return (
    <Tabs
      items={[
        { key: 'table', label: 'Table', children: <Examples Component={Table} /> },
        { key: 'table-view', label: 'TableView', children: <Examples Component={TableView} /> }
      ]}
    />
  );
};

render(<BaseExample />);
