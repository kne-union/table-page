import dayjs from 'dayjs';
import { isEmpty } from '@kne/is-empty';
import groupBy from 'lodash/groupBy';
import get from 'lodash/get';
import transform from 'lodash/transform';

export const calcArgs = (args, template) => {
  const { attr, normal } = groupBy(args, item => (/^.+:.+$/.test(item) ? 'attr' : 'normal'));
  const output = {};

  const typeTransform = (value, type) => {
    if (type === 'string') {
      return String(value);
    }
    if (type === 'number') {
      return Number(value);
    }
    if (type === 'boolean') {
      return value === 'true';
    }
    return value;
  };

  (normal || []).forEach((target, index) => {
    const currentTemplate = Object.assign({}, { type: 'string', defaultValue: '' }, get(template, index));
    if (currentTemplate.name && target) {
      output[currentTemplate.name] = typeTransform(target, currentTemplate.type);
    }
  });

  (attr || []).forEach(target => {
    const [key, value] = target.split(':');
    const currentTemplate = template.find(item => item.name === key);
    if (!currentTemplate) {
      return;
    }
    const { name, type } = Object.assign({}, { type: 'string', defaultValue: '' }, currentTemplate);
    output[name] = typeTransform(value, type);
  });

  return Object.assign(
    {},
    transform(
      template,
      (result, value) => {
        if (value.name && value.hasOwnProperty('defaultValue')) {
          result[value.name] = value.defaultValue;
        }
      },
      {}
    ),
    output
  );
};

export const defaultFormat = {
  date: (value, { args }) => {
    const template = args[0] || 'YYYY-MM-DD';
    return dayjs(value).format(template);
  },
  datetime: (value, { args }) => {
    const template = args[0] || 'YYYY-MM-DD HH:mm:ss';
    return dayjs(value).format(template);
  },
  dateRange: (value, { args }) => {
    const template = args[0] || 'YYYY-MM-DD',
      allowNull = args[1];
    if (!isEmpty(value[0]) && !isEmpty(value[1])) {
      return `${dayjs(value[0]).format(template)}~${dayjs(value[1]).format(template)}`;
    }
    if (allowNull === 'allow' && !isEmpty(value[0])) {
      return `${dayjs(value[0]).format(template)}以后`;
    }
    if (allowNull === 'allow' && !isEmpty(value[1])) {
      return `${dayjs(value[1]).format(template)}以前`;
    }
    return '';
  },
  boolean: (value, { args }) => {
    const trueValue = args[0] || 'true';
    if ((value || '').toString() === trueValue) {
      return '是';
    }
    return '否';
  },
  number: (value, { args }) => {
    const { style, unit, maximumFractionDigits, useGrouping, roundingMode, suffix } = calcArgs(args, [
      {
        name: 'style',
        type: 'string',
        defaultValue: 'decimal'
      },
      {
        name: 'unit',
        type: 'number',
        defaultValue: 1
      },
      {
        name: 'maximumFractionDigits',
        type: 'number',
        defaultValue: 2
      },
      {
        name: 'useGrouping',
        type: 'boolean',
        defaultValue: true
      },
      {
        name: 'roundingMode',
        type: 'string',
        defaultValue: 'halfExpand'
      },
      {
        name: 'suffix',
        type: 'string',
        defaultValue: ''
      }
    ]);

    return (
      new Intl.NumberFormat(
        {},
        {
          style,
          maximumFractionDigits,
          roundingMode,
          useGrouping
        }
      ).format(value / unit) + suffix
    );
  },
  money: (value, { args }) => {
    const unit = args[0] || '元';
    return `${value}${unit}`;
  }
};

const formatView = (value, format, context) => {
  if (!format) {
    return value;
  }
  const formatList = format.split(' ').filter(item => !!item);
  if (formatList.length > 0) {
    return formatList.reduce((value, format) => {
      const [name, ...args] = format.split('-');
      if (typeof defaultFormat[name] === 'function') {
        return defaultFormat[name](
          value,
          Object.assign({}, context, {
            args: args.map(item => {
              return item && item.replace(/\(\)/g, ' ').replace(/\(_\)/g, '-');
            })
          })
        );
      }
      return value;
    }, value);
  }
};

export default formatView;
