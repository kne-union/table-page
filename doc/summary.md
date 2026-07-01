`@kne/table-page` 是一个基于 React 和 Ant Design 的表格页面组件库，提供开箱即用的数据表格解决方案。组件库围绕表格的常见业务场景，封装了数据加载、分页、排序、行选择、列配置、筛选搜索、批量操作等能力，帮助开发者快速构建功能完善的表格管理页面。

### 核心组件

#### TablePage

表格页面主组件，基于 `@kne/react-fetch` 封装数据请求与分页逻辑。内置两种渲染模式：

- **`Table` 模式**（默认）：基于 antd `Table`，支持列宽拖动、字段显示/隐藏、分组表头、粘性表头等
- **`TableView` 模式**：基于 antd Row/Col 栅格布局，适合移动端或卡片式表格场景

通过 `loader` 或 `url` 配置数据源，通过 `dataFormat` 适配不同的接口数据结构。分页器渲染在表格外侧，翻页默认采用 `reload` 方式（不显示全屏 loading）。

同时内置了顶部工具栏（`TableToolbar`），整合筛选、搜索、批量操作三大能力：

- **筛选（filter）**：基于 `@kne/react-filter` 的 `FilterLines`，支持多行多字段组合筛选，筛选值变化时自动 `reload` 并回到第 1 页
- **搜索（search）**：基于 `@kne/react-filter` 的 `SearchInput`，支持关键词搜索与防抖自动提交，与筛选器共享筛选值状态
- **批量操作（batchActions）**：配合 `rowSelection` 和 `useSelectedRow`，提供下拉菜单形式的批量操作（如批量导出、批量通知），未选中时自动禁用
- **已选筛选值展示**：工具栏下方展示当前生效的筛选条件标签，支持快速清除

#### Table

基于 antd `Table` 的表格组件，与 `TableView` 共享相同的 `columns`、`rowSelection` 等 API。额外提供以下增强能力：

- **列宽拖动**：悬停表头列右侧拖动手柄可调整列宽，支持 `min`/`max` 限制
- **列配置面板**：通过表头最后一列的设置图标，可显示/隐藏字段、拖拽排序
- **配置持久化**：设置 `name` 后，列宽和显示状态自动保存到 localStorage
- **分组表头**：通过 `groupHeader` 配置实现多级表头结构
- **浮动横向滚动条**：当表格宽度超出容器时，底部自动显示横向滚动条（通过 `horizontalScroller` 控制）

#### TableView

基于 CSS Grid 的表格视图组件，以 antd Row/Col 布局为基础。相比于 `Table`，它更轻量灵活，适合需要自定义渲染的场景。支持：

- 基于 24 栅格的列宽分配（`span` 属性）
- CSS Grid 自动布局，内容超出时自动撑开
- 行选择（checkbox 多选 / radio 单选）
- 行点击事件
- 通过 `render` 属性自定义渲染，可拆分表头和表体

### 核心 Hooks

#### useSelectedRow

行选择 Hook，支持多选（checkbox）和单选（radio）两种模式。提供：

- `getRowSelection(dataSource)` 生成标准 `rowSelection` 配置，可直接传入 `Table` 或 `TableView`
- `selectedRowKeys` 和 `selectedRows` 追踪选中状态
- `setSelectedRowKeys(keys, dataSource)` 从 key 列表反查完整行数据
- `clearSelectedRows()` 一键清空选择

适用于批量操作（批量删除、批量导出等）和单选场景（详情查看、关联选择等）。

#### useSort

排序 Hook，配合 `Table`/`TableView` 的 `sortRender` 实现表头排序交互。支持：

- **单列排序**（`sort: true` 或 `sort: { single: true }`）：切换列时自动清除其他列的排序
- **多列排序**（`sort: { single: false }`）：允许多列同时排序
- 排序状态循环切换：DESC → ASC → 取消
- `sortDataSource(dataSource, sort, columns)` 工具函数，支持本地排序（包含中文排序）

### 列渲染类型系统

通过 `renderType` 属性，可以用声明式的方式定义列的渲染样式，无需手写 `render` 函数。内置以下 render 类型：

| 类型 | 说明 |
|------|------|
| `main` | 主要内容列，自动省略号，较大宽度 |
| `options` | 操作列，铺满单元格 |
| `enum` | 枚举值渲染，自动映射 color/text |
| `tag` | 标签渲染，单个 Tag 组件 |
| `tagList` | 标签列表渲染，多个 Tag 组件 |
| `amount` | 金额列，右对齐，自动省略号 |
| `list` | 列表渲染，自动省略号 |
| `description` | 描述文本，大宽度，自动省略号 |

支持尺寸修饰符：

- `short`：缩小宽度（约 120px）
- `small`：最小宽度（约 100px）
- `large`：放大宽度（约 300px）

例如 `renderType: "enum-small"` 表示枚举值 + 小尺寸列。维度（width、min、max、ellipsis）可通过 `globalParams.renderTypeSize` 全局定制。

默认导出 `getTagColor`、`renderTagItem`、`renderTagList` 工具函数，用于 Tag 相关渲染。

### 其他导出

| 导出项 | 说明 |
|--------|------|
| `tableLocalApis` | 基于 localStorage 的列配置存取 API，可替换为服务端存储 |
| `useTableConfig` | 列配置 Hook，提供列宽、显示状态的管理能力 |
| `preset` / `globalParams` | 全局参数预设，用于设置 renderType 映射和标签颜色等全局配置 |
| `Ellipsis` | 超出省略组件，基于 antd Typography |
| `label` | 标签组件 |
| `sortDataSource` | 客户端排序工具函数 |

### 使用场景

- **后台管理系统**：订单管理、用户列表、商品管理等 CRUD 页面
- **数据报表**：配合排序、分页、总结栏展示统计数据
- **列表配置页**：需要用户自定义列宽、显示字段的表格场景
- **移动端适配**：使用 `TableView` 模式实现栅格式数据展示
