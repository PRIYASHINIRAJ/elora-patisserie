import axios, { AxiosError } from 'axios';

// The whole API runs in the browser (src/backend) — there is no server to call.
// This adapter hands each request to it instead of sending it over the network.
async function browserAdapter(config) {
  const { handleRequest } = await import('../backend/app.js');
  const url = api.getUri(config).replace(/^\/api/, '') || '/';
  const { status, data } = await handleRequest({ method: config.method || 'get', path: url, data: config.data });
  const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 200 && status < 300) return response;
  throw new AxiosError(
    data?.error || `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    null,
    response
  );
}

const api = axios.create({
  baseURL: '/api',
  adapter: browserAdapter,
});

export default api;
