import { installPageInterceptor } from './page-interceptor.js';

declare const __SIGNETS_PAGE_INTERCEPTOR_IMPL__: string;

const BRIDGE_SECRET = crypto.randomUUID();

function injectPageInterceptor(): void {
  const script = document.createElement('script');
  script.textContent = `${__SIGNETS_PAGE_INTERCEPTOR_IMPL__}\nSignetsPageInterceptor.installPageInterceptor(${JSON.stringify(BRIDGE_SECRET)});`;
  (document.documentElement ?? document.head).appendChild(script);
  script.remove();
}

injectPageInterceptor();

export { BRIDGE_SECRET };
