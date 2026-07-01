import { createWithIntlProvider } from '@kne/react-intl';
import filterZhCN from '@kne/react-filter/dist/locale/zh-CN';
import filterEnUS from '@kne/react-filter/dist/locale/en-US';
import zhCN from './locale/zh-CN';
import enUS from './locale/en-US';

const withLocale = createWithIntlProvider({
  defaultLocale: 'zh-CN',
  messages: {
    'zh-CN': { ...filterZhCN, ...zhCN },
    'en-US': { ...filterEnUS, ...enUS }
  },
  namespace: 'table-page'
});

export default withLocale;
