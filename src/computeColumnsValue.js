import get from 'lodash/get';
import formatView from './formatView';

const computeColumnsValue = ({ columns, emptyIsPlaceholder, valueIsEmpty, removeEmpty = true, dataSource, context }) => {
  return (output => (removeEmpty ? output.filter(item => !!item) : output))(
    columns.map(item => {
      const itemValue = typeof item.getValueOf === 'function' ? item.getValueOf(dataSource, { column: item, context }) : get(dataSource, item.name);
      const displayValue = (value => {
        if (typeof item.format === 'function') {
          return item.format(value, { dataSource, column: item, context });
        }
        if (typeof item.format === 'string') {
          const formatValue = formatView(value, item.format, { dataSource, column: item, context });
          if (formatValue) {
            return formatValue;
          }
        }
        return value;
      })(itemValue);

      const itemIsEmpty = (item.valueIsEmpty || valueIsEmpty)(itemValue);

      if (
        item.display === false ||
        (typeof item.display === 'function' &&
          item.display(itemValue, {
            dataSource,
            column: item,
            context
          }) === false)
      ) {
        return null;
      }

      if (!(item.hasOwnProperty('emptyIsPlaceholder') ? item.emptyIsPlaceholder : emptyIsPlaceholder) && itemIsEmpty) {
        return null;
      }

      return Object.assign({}, item, { isEmpty: itemIsEmpty, value: displayValue });
    })
  );
};

export const computeDisplay = ({ column, dataSource, placeholder, context }) => {
  return column.isEmpty
    ? typeof column.renderPlaceholder === 'function'
      ? column.renderPlaceholder({
          column: column,
          dataSource,
          placeholder,
          context
        })
      : column.placeholder || placeholder
    : typeof column.render === 'function'
      ? column.render(column.value, {
          column,
          dataSource,
          context
        })
      : column.value;
};

export const computeColumnsDisplay = ({ columns, emptyIsPlaceholder, valueIsEmpty, removeEmpty, dataSource, placeholder, context }) => {
  return computeColumnsValue({ columns, emptyIsPlaceholder, valueIsEmpty, removeEmpty, dataSource, context }).map(column => {
    return computeDisplay({ column, placeholder, dataSource, context });
  });
};

computeColumnsValue.computeDisplay = computeDisplay;
computeColumnsValue.computeColumnsDisplay = computeColumnsDisplay;

export default computeColumnsValue;
