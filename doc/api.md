### TablePage

表格页面组件，基于 `@kne/react-fetch` 的 `withFetch` 封装数据请求逻辑，内部使用 `Table` 渲染列表，并内置分页能力。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| loader | function | - | 数据加载函数，参数为 fetch 请求上下文，需返回 `{ pageData, totalCount }` 或自定义结构（配合 `dataFormat`） |
| url | string | - | 请求地址，与 `loader` 二选一，透传给 `@kne/react-fetch` |
| data | object | - | POST 请求体，默认分页参数挂在 `data.currentPage`、`data.perPage` |
| dataFormat | function | `(data) => ({ list: data.pageData, total: data.totalCount })` | 将接口数据转为 `{ list, total }` 供表格使用 |
| pagination | object | 见下方 | 分页配置 |
| name | string | - | 表格唯一标识，用于列配置持久化，同 `Table` 的 `name` |
| columns | array \| function | - | 列配置，见 TableView 的 columns 说明；也可传入函数 `(data) => columns` |
| getColumns | function | - | 根据接口数据动态生成列配置 |
| sticky | boolean | - | 是否启用粘性表头，仅 `renderType="Table"` 时生效 |
| scrollTopInset | number \| string | - | 滚动容器顶部占位高度（如固定导航高度），用于吸顶表头 `top` 偏移、`scroll-margin-top` 与翻页滚回；支持 `56` / `'56px'` |
| getScrollContainer | function | - | 页面级滚动容器；用于吸顶表头 `getContainer`、浮动横向滚动条定位与翻页滚回 |
| renderType | `'Table'` \| `'TableView'` | `'Table'` | 表格渲染类型 |
| horizontalScroller | boolean | `true` | 是否启用底部浮动横向滚动条（仅 `renderType="Table"` 且表格存在横向滚动时生效） |
| summary | function | - | 总结栏，回调参数包含 `data`、`requestParams`、`refresh`、`reload` 等 fetch 上下文 |
| columnRenderProps | object | `{}` | 列渲染扩展属性，会合并进列 `render` 的 context |
| filter | object | - | 顶部筛选器配置，基于 `@kne/react-filter` 的 `FilterLines`，见下方 |
| search | object | - | 顶部搜索框配置，基于 `@kne/react-filter` 的 `SearchInput`，见下方 |
| tab | object | - | 顶部 Tab 分类切换，选中值写入 filter value，见下方 |
| tabProps | object | - | 透传给 antd `Tabs` 的额外属性（如 `tabBarExtraContent`） |
| batchActions | array | - | 批量操作下拉菜单项，需配合 `rowSelection` 使用，见下方 |
| selectedRows | array | - | 已选行数据，传给 `batchActions` 的 `onClick` 上下文 |
| className | string | - | 自定义类名 |
| ...fetchProps | - | - | 其余属性透传给 `@kne/react-fetch`（如 `url`、`params`、`auto` 等） |
| ...tableProps | - | - | 其余属性透传给内部 `Table` / `TableView`（如 `rowKey`、`rowSelection`、`scroll`、`size`、`renderMobile`、`sortRender`、`mobileSortToolbar`） |

#### pagination

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| open | boolean | `true` | 是否开启分页 |
| paramsType | string | `'data'` | 分页参数挂载的请求参数类型 |
| currentName | string | `'currentPage'` | 当前页参数字段名 |
| pageSizeName | string | `'perPage'` | 每页条数字段名 |
| requestType | `'reload'` \| `'refresh'` | `'reload'` | 翻页时的请求方式，`reload` 不切换 loading，`refresh` 会重新 loading |
| showSizeChanger | boolean | `true` | 是否展示每页条数切换 |
| showQuickJumper | boolean | `true` | 是否展示快速跳转 |
| hideOnSinglePage | boolean | `false` | 仅一页时是否隐藏分页器 |
| pageSizeOptions | array | - | 每页条数选项 |
| pageSize | number | `50` | 默认每页条数，会持久化到 localStorage |
| showTotal | function | - | 自定义总数展示 `(total) => ReactNode` |
| onChange | function | - | 自定义翻页回调 `(page, size) => void`，传入后覆盖默认请求逻辑 |
| onShowSizeChange | function | - | 每页条数变化回调，组件内部已处理持久化 |

#### filter

顶部筛选器配置，传入后会在表格上方渲染筛选行（中间区域宽度撑满）。筛选值变化时自动 `reload` 并回到第 1 页，参数通过 `getFilterValue` 合并进 `data`。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| list | `Array<Array>` | - | 传给 `FilterLines` 的筛选项配置 |
| displayLine | number | `1` | 默认展示行数 |
| value | array | - | 受控筛选值 |
| defaultValue | array | `[]` | 默认筛选值，会合并进首次请求参数 |
| onChange | function | - | 筛选值变化回调 `(value) => void` |
| mapFilterValue | function | - | 自定义参数转换，默认 `getFilterValue` |

#### search

顶部关键词搜索配置，基于 `SearchInput`，与 `filter` 共享筛选值状态。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | - | 必填，写入筛选值的字段名 |
| label | string | - | 已选展示标签 |
| placeholder | string | - | 占位符 |
| searchDelay | number | `500` | 自动提交防抖时间（毫秒） |

#### tab

顶部 Tab 分类切换。默认选中「全部」（不写入筛选值）；切换到具体项时，将 `{ name, label, value: { value, label } }` 写入 filter value，并触发 `reload` 回到第 1 页。桌面端显示在表格边框外侧上方；移动端（含 `renderMobile`）显示在 `SearchInput` 下方。选中值会出现在已选筛选标签中，清除标签会回到「全部」。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | - | 必填，写入筛选值的字段名 |
| label | string | - | 筛选字段标签 |
| list | `Array<{ label, value }>` | - | Tab 选项列表 |

#### tabProps

透传给 antd `Tabs` 的额外属性。内部会覆盖 `activeKey`、`onChange`、`items`，其余如 `tabBarExtraContent`、`type` 等可自由传入。

```jsx
<TablePage
  tab={{
    name: 'position',
    label: '职位',
    list: [
      { label: '工程师', value: '工程师' },
      { label: '经理', value: '经理' }
    ]
  }}
  tabProps={{
    tabBarExtraContent: <Button type="link">新增职位</Button>
  }}
  search={{ name: 'keyword', label: '关键词' }}
  loader={...}
  columns={...}
/>
```

#### batchActions

批量操作下拉菜单，需配合 `rowSelection`（通常来自 `Table.useSelectedRow`）使用。

| 属性 | 类型 | 说明 |
|------|------|------|
| key | string | 菜单项 key |
| label | string | 菜单文案 |
| disabled | boolean | 是否禁用，默认无选中行时禁用 |
| danger | boolean | 危险操作样式 |
| onClick | function | `({ selectedRowKeys, selectedRows, reload, refresh, requestParams, ... }) => void` |

#### ref 方法

通过 `ref` 可调用 `@kne/react-fetch` 暴露的方法：

| 方法 | 说明 |
|------|------|
| reload | 重新请求，请求完成前保留当前内容 |
| refresh | 重新请求，请求期间显示 loading |
| setData | 直接修改当前数据 |
| send | 发送自定义请求 |

#### 与 Table 分页的差异

`TablePage` 的分页器渲染在表格外侧（`antd Pagination`），不会出现在 `Table` 边框内部。表格本身始终设置 `pagination={false}`。

#### renderType

通过 `renderType` 选择内部使用的表格组件，默认为 `Table`：

```jsx
<TablePage renderType="TableView" loader={...} columns={...} />
```

#### 示例

```jsx
<TablePage
  name="order-list"
  loader={({ data }) => {
    const { currentPage = 1, perPage = 20 } = data || {};
    return fetchOrders({ currentPage, perPage });
  }}
  dataFormat={data => ({
    list: data.pageData,
    total: data.totalCount
  })}
  columns={[
    { name: 'id', title: '订单编号', width: 160 },
    { name: 'customerName', title: '客户名称', width: 200 }
  ]}
  pagination={{
    open: true,
    pageSizeOptions: ['10', '20', '50', '100']
  }}
/>
```

完整示例见文档 `TablePage`。

### TableView

表格视图组件，基于 Ant Design 的 Row/Col 布局实现，支持列配置、行选择等能力。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataSource | array | - | 表格数据源 |
| columns | array | - | 列配置，见下方 columns 说明 |
| rowKey | string \| function | `'id'` | 行唯一标识字段名或取值函数 |
| rowSelection | object | - | 行选择配置，见下方 rowSelection 说明 |
| placeholder | string | `'-'` | 空值占位符 |
| emptyIsPlaceholder | boolean | `true` | 空值是否显示占位符 |
| empty | ReactNode | `<Empty />` | 无数据时的展示内容 |
| headerStyle | object | - | 表头自定义样式，仅在 `render` 自定义渲染时作用于 `header` |
| onRowSelect | function | - | 行点击回调 `(item, { columns, dataSource }) => void` |
| render | function | - | 自定义渲染 `(props) => ReactNode`，可获取 `header` 和 `renderBody` |
| renderMobile | boolean \| function \| string | `true` | 仅移动端生效。`true` 使用默认卡片 List（不再渲染 antd Table）；为 function 时签名与 `render` 一致，且优先级高于 `render`，完全接管渲染；为 string 时从 `preset({ renderMobile })` 按名称取渲染函数，未注册则视为未开启 |
| sortRender | function | - | 排序按钮渲染，由 `useSort` 提供（桌面端表头） |
| mobileSortToolbar | function | - | 移动端排序工具栏，由 `useSort` 提供 |
| size | `'small'` \| `'large'` | - | 单元格内边距：默认 `8px`，`small` 为 `4px`，`large` 为 `14px 8px`；可通过 CSS 变量覆盖 |

单元格 padding 由 CSS 变量控制，可在外层覆盖：

```css
.info-page-table {
  --kne-table-cell-padding-default: 8px;
  --kne-table-cell-padding-small: 4px;
  --kne-table-cell-padding-large: 14px 8px;
  /* 或直接覆盖当前生效值：--kne-table-cell-padding: 10px; */
}
```

#### columns

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | - | 字段名，对应 dataSource 中的属性 |
| title | ReactNode | - | 列标题 |
| width | number \| string | - | 列最小宽度，支持数字（如 `50`，视为 50px）或字符串（如 `'50px'`），参与列宽计算，内容超出时会自动撑开 |
| span | number | - | 列占比（基于 24 栅格），未设置时自动均分剩余栅格 |
| align | string | `'top'` | 垂直对齐方式 |
| justify | string | `'flex-start'` | 水平对齐方式 |
| format | string \| function | - | 值格式化 |
| render | function | - | 自定义单元格渲染 `(value, { column, dataSource, context }) => ReactNode`；与 `renderType` 同时存在时优先级最高 |
| renderType | string | - | 声明式列渲染类型；存在 `render` 时仅保留列宽等维度，不参与单元格渲染 |
| sort | boolean \| object | - | 是否支持排序，`{ single: true }` 为单列排序 |
| ellipsis | boolean \| object | `false` | 超出省略，基于 antd Typography；`true` 开启省略与 tooltip，`{ showTitle: false }` 关闭 tooltip |
| display | boolean \| function | - | 是否显示该列 |
| emptyIsPlaceholder | boolean | - | 该列空值是否显示占位符 |
| placeholder | string | - | 该列空值占位符 |
| renderPlaceholder | function | - | 自定义空值渲染 |

#### rowSelection

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| type | `'checkbox'` \| `'radio'` | - | 选择类型 |
| selectedRowKeys | array | - | 已选中的行 key 列表 |
| onChange | function | - | 选中变化回调 `(selectedRowKeys, id, { context, checked }) => void` |
| allowSelectedAll | boolean | - | 是否允许全选（仅 checkbox 模式） |
| isSelectedAll | boolean | - | 是否全选状态 |
| onIsSelectAllChange | function | - | 全选状态变化回调 |

### useSelectedRow

行选择 Hook，用于配合 `Table` / `TableView` 的 `rowSelection`，API 参考 `@kne/components-core` 同名 Hook。

#### 参数

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| rowKey | string \| function | `'id'` | 行唯一标识 |
| type | `'checkbox'` \| `'radio'` | `'checkbox'` | 选择类型 |

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| selectedRowKeys | array | 已选行 key 列表 |
| selectedRows | array | 已选行数据 |
| onSelect | function | `(item, checked) => void` |
| onSelectAll | function | `(checked, selected, items) => void` |
| setSelectedRows | function | 直接设置已选行数据 |
| setSelectedRowKeys | function | `(keys, dataSource) => void` |
| clearSelectedRows | function | 清空选择 |
| getRowSelection | function | `(dataSource, extra?) => rowSelection` 生成 `rowSelection` 配置 |

#### 示例

```jsx
const { selectedRowKeys, getRowSelection, clearSelectedRows } = Table.useSelectedRow({ rowKey: 'id' });

<Table
  dataSource={dataSource}
  columns={columns}
  rowSelection={getRowSelection(dataSource)}
/>;
```

### useSort

排序 Hook，配合 `Table` / `TableView` 的 `sortRender` 实现表头排序。

#### 参数

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sort | array | - | 受控排序值 `[{ name, sort: 'ASC' \| 'DESC' }]` |
| defaultSort | array | `[]` | 默认排序 |
| onSortChange | function | - | 排序变化回调 `(sort) => void` |

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| sort | array | 当前排序配置 |
| setSort | function | 设置排序 |
| sortRender | function | `({ name, single }) => ReactNode`，传给 Table / TableView 表头 |
| mobileSortToolbar | function | `({ columns }) => ReactNode`，传给 Table / TableView 移动端工具栏右侧 |

#### columns.sort

| 值 | 说明 |
|----|------|
| `true` | 开启排序，默认单列模式 |
| `{ single: true }` | 单列排序，切换列时清除其他列 |
| `{ single: false }` | 多列排序 |

#### sortDataSource

本地排序工具函数：`sortDataSource(dataSource, sort, columns)`。

#### 示例

```jsx
const { sort, sortRender, mobileSortToolbar } = Table.useSort({ onSortChange: console.log });
const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort, dataSource]);

<Table dataSource={sortedData} columns={columns} sortRender={sortRender} mobileSortToolbar={mobileSortToolbar} />;
```

### Table

表格组件，以 antd `Table` 作为展示层，外层 API 与 `TableView` 保持一致，可直接复用相同的 `columns`、`rowSelection` 等配置。此外支持透传 antd Table 的原生属性（如 `scroll`、`pagination`、`bordered` 等）。

#### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataSource | array | - | 表格数据源 |
| columns | array | - | 列配置，见 TableView 的 columns 说明 |
| rowKey | string \| function | `'id'` | 行唯一标识字段名或取值函数 |
| rowSelection | object | - | 行选择配置，见 TableView 的 rowSelection 说明 |
| placeholder | string | `'-'` | 空值占位符 |
| emptyIsPlaceholder | boolean | `true` | 空值是否显示占位符 |
| empty | ReactNode | `<Empty />` | 无数据时的展示内容 |
| sticky | boolean | - | 是否启用粘性表头 |
| scrollTopInset | number \| string | - | 滚动容器顶部占位高度，用于吸顶表头偏移与滚回定位；`stickyOffset` 为兼容别名 |
| stickyOffset | number \| string | - | **已废弃**，请使用 `scrollTopInset` |
| getStickyContainer | function | - | 页面级滚动容器，等同 TablePage 的 `getScrollContainer` |
| headerStyle | object | - | 表头自定义样式 |
| onRowSelect | function | - | 行点击回调 `(item, { columns, dataSource }) => void` |
| render | function | - | 自定义渲染 `(props) => ReactNode`，`header` 为 `null`，`renderBody` 返回 antd Table |
| renderMobile | boolean \| function \| string | `true` | 仅移动端生效。`true` 使用默认卡片 List（不再渲染 antd Table）；为 function 时签名与 `render` 一致，且优先级高于 `render`，完全接管渲染；为 string 时从 `preset({ renderMobile })` 按名称取渲染函数，未注册则视为未开启 |
| sortRender | function | - | 排序按钮渲染，由 `useSort` 提供（桌面端表头） |
| mobileSortToolbar | function | - | 移动端排序工具栏，由 `useSort` 提供 |
| pagination | boolean \| object | `false` | 分页配置，默认不显示；传入对象时使用 antd 分页 |
| name | string | - | 表格唯一标识，用于持久化列配置 |
| controllerOpen | boolean | `true` | 是否开启列宽拖动与列配置面板 |
| tableServerApis | object | - | 自定义列配置存储 API，默认使用 `localStorage` |
| size | `'small'` \| `'large'` | - | 单元格内边距：默认 `8px`，`small` 为 `4px`，`large` 为 `14px 8px`；可通过 CSS 变量覆盖（同 TableView） |
| ...antdTableProps | - | - | 其余属性透传给 antd `Table`（如 `scroll`、`bordered`） |

#### 与 TableView 的差异

| 项目 | TableView | Table |
|------|-----------|-------|
| 展示层 | Row/Col 自定义布局 | antd `Table` |
| `columns.span` | 基于 24 栅格分配列宽 | 不生效，请使用 `width` |
| 单选展示 | 右侧勾选图标 | antd 左侧 radio 列 |
| 列宽拖动 / 字段显示隐藏 | 不支持 | 支持，见下方说明 |
| 扩展能力 | 自定义 `render` 拆分表头/表体 | 支持 antd 原生 `scroll`、`pagination` 等 |

#### columns 扩展（仅 Table）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| hidden | boolean | `false` | 默认隐藏该列，可在列配置面板中重新显示 |
| min | number | `80` | 列最小宽度（px），拖动调整列宽时的下限，无需手动配置 |
| max | number | `600` | 列最大宽度（px），拖动调整列宽时的上限，无需手动配置 |
| fixed | `'left'` \| `'right'` \| boolean | - | 固定列，固定列不可隐藏或拖动排序 |
| groupHeader | array | - | 分组表头配置，见下方 groupHeader 说明 |

#### groupHeader

在列配置中通过 `groupHeader` 声明该列所属的分组表头，支持多级嵌套。相同分组路径的列会自动合并为 antd 嵌套表头（仅 `Table` 支持，`TableView` 不生效）。

| 属性 | 类型 | 说明 |
|------|------|------|
| name | string | 分组唯一标识 |
| title | ReactNode | 分组标题 |

完整示例见文档 `group header`。

#### 列宽拖动与字段显示/隐藏

设置 `name` 开启列配置持久化；`controllerOpen` 控制是否显示拖动手柄与设置面板（默认 `true`）。列只需配置 `width`，`min` / `max` 有默认值（80 / 600），一般无需手动指定。

```jsx
<Table
  name="order-list"
  dataSource={dataSource}
  columns={[
    { name: 'id', title: '订单编号', width: 160, min: 120, max: 240, fixed: 'left' },
    { name: 'customerName', title: '客户名称', width: 200, min: 140, max: 360 },
    { name: 'remark', title: '备注', width: 200, hidden: true }
  ]}
/>
```

- 悬停表头列右侧拖动手柄可调整列宽
- 点击最后一列表头设置图标可显示/隐藏列、拖拽排序
- `hidden: true` 的列默认隐藏，可在面板中重新显示
- `fixed` 列固定显示且不可隐藏

完整示例见文档 `column config`。
