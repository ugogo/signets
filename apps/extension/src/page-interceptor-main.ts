import { installPageInterceptor } from './page-interceptor.js';

const bridgeSecret = document.documentElement?.dataset.signetsBridge;
if (bridgeSecret) {
  installPageInterceptor(bridgeSecret);
}
