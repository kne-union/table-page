import get from 'lodash/get';
import { buildTreeKeyMaps, collectExpandableKeys, isTreeDataType, normalizeTreeData, nodeCanExpand, toggleExpandedKey } from '@kne/table-view';

/** 叶子去掉空 children，懒加载节点保留 []，避免 antd 把所有节点当成可展开 */
export const prepareAntdTreeNodes = (nodes, { childrenKey = 'children', hasChildrenKey = 'hasChildren' } = {}) =>
  (nodes || []).map(item => {
    const children = get(item, childrenKey);
    const next = Object.assign({}, item);
    if (Array.isArray(children) && children.length > 0) {
      next[childrenKey] = prepareAntdTreeNodes(children, { childrenKey, hasChildrenKey });
      return next;
    }
    if (get(item, hasChildrenKey) === true) {
      next[childrenKey] = [];
      return next;
    }
    if (Object.prototype.hasOwnProperty.call(next, childrenKey)) {
      delete next[childrenKey];
    }
    return next;
  });

export const prepareAntdTreeData = (dataSource, { dataType = 'list', rowKey = 'id', parentKey = 'parentId', childrenKey = 'children', hasChildrenKey = 'hasChildren' } = {}) => {
  const isTree = isTreeDataType(dataType);
  if (!isTree) {
    return { isTree: false, treeData: dataSource, expandableKeys: [], treeKeyMaps: null };
  }
  const tree = normalizeTreeData(dataSource, { dataType, rowKey, parentKey, childrenKey });
  const treeData = prepareAntdTreeNodes(tree, { childrenKey, hasChildrenKey });
  const expandableKeys = collectExpandableKeys(treeData, { rowKey, childrenKey, hasChildrenKey });
  const treeKeyMaps = buildTreeKeyMaps(treeData, { rowKey, childrenKey });
  return { isTree: true, treeData, expandableKeys, treeKeyMaps };
};

export const resolveExpandedRowKeys = (expandedKeys, expandableKeys = []) => {
  if (expandedKeys === true) {
    return expandableKeys.slice();
  }
  if (expandedKeys === false || expandedKeys == null) {
    return [];
  }
  return Array.isArray(expandedKeys) ? expandedKeys.slice() : [];
};

export const shouldLoadTreeChildren = (item, { key, childrenKey = 'children', hasChildrenKey = 'hasChildren', loadingKeys, loadedKeys }) => {
  if (get(item, hasChildrenKey) !== true) {
    return false;
  }
  const children = get(item, childrenKey);
  if (Array.isArray(children) && children.length > 0) {
    return false;
  }
  if (loadingKeys?.has?.(key) || loadedKeys?.has?.(key)) {
    return false;
  }
  return nodeCanExpand(item, { childrenKey, hasChildrenKey });
};

export { isTreeDataType, toggleExpandedKey };
