import defaultRender from './default';
import main from './main';
import amount from './amount';
import tag from './tag';
import tagList from './tagList';
import list from './list';
import options from './options';
import enumRender from './enum';
import description from './description';
import { globalParams } from '../globalParams';

const renderType = {
  default: defaultRender,
  main,
  amount,
  tag,
  tagList,
  list,
  options,
  enum: enumRender,
  description
};

globalParams.renderType = renderType;

export default renderType;

export { getTagColor, normalizeTagItem, renderTagItem, renderTagList } from './tagUtils';
