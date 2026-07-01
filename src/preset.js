import merge from 'lodash/merge';
import './renderType';
import { globalParams } from './globalParams';

const preset = props => {
  const next = merge({}, globalParams, props);
  merge(globalParams, props);
  return next;
};

export { globalParams };
export default preset;
