// A tiny, Express-compatible router that runs in the browser. The route files
// (./routes/*.js) are written against Express's `Router` API; this implements
// just the parts they use: get/post/put/patch/delete/use, `:params`, arrays of
// middleware, `next()` and `next(err)`.

function compile(path) {
  const keys = [];
  const pattern = path
    .replace(/\/+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, (c) => `\\${c}`)
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${pattern}/?$`), keys };
}

class RouterImpl {
  constructor() {
    this.layers = [];
  }

  use(...handlers) {
    this.layers.push({ method: null, handlers: handlers.flat() });
    return this;
  }

  add(method, path, handlers) {
    this.layers.push({ method, match: compile(path), handlers: handlers.flat() });
    return this;
  }

  get(path, ...h) { return this.add('GET', path, h); }
  post(path, ...h) { return this.add('POST', path, h); }
  put(path, ...h) { return this.add('PUT', path, h); }
  patch(path, ...h) { return this.add('PATCH', path, h); }
  delete(path, ...h) { return this.add('DELETE', path, h); }

  // Runs the middleware + first matching route for `subPath`.
  // Resolves false when no route matched.
  async handle(req, res, subPath) {
    const chain = [];
    for (const layer of this.layers) {
      if (!layer.method) {
        chain.push(...layer.handlers.map((fn) => ({ fn, params: {} })));
        continue;
      }
      if (layer.method !== req.method) continue;
      const m = layer.match.regex.exec(subPath);
      if (!m) continue;
      const params = Object.fromEntries(layer.match.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      chain.push(...layer.handlers.map((fn) => ({ fn, params })));
      await runChain(chain, req, res);
      return true;
    }
    return false;
  }
}

async function runChain(chain, req, res) {
  for (const { fn, params } of chain) {
    if (res.finished) return;
    req.params = params;
    let nextCalled = false;
    let nextErr;
    await fn(req, res, (err) => {
      nextCalled = true;
      nextErr = err;
    });
    if (nextErr) throw nextErr;
    if (!nextCalled) return; // the handler responded
  }
}

// Like Express, `Router()` works with or without `new`.
export function Router() {
  return new RouterImpl();
}

export default { Router };
