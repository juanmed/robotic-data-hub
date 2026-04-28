const _queues: Record<string, Array<unknown>> = {};
export const callLog: Array<{ method: string; args: unknown[] }> = [];

export function pushResult(method: string, result: unknown) {
  (_queues[method] ??= []).push(result);
}

function pop(method: string, fallback: unknown): unknown {
  const q = _queues[method];
  return q?.length ? q.shift() : fallback;
}

export function resetMocks() {
  for (const k of Object.keys(_queues)) delete _queues[k];
  callLog.length = 0;
}

export function assertQueueExhausted() {
  for (const [k, q] of Object.entries(_queues)) {
    if (q.length > 0) throw new Error(`Unconsumed mock results for "${k}": ${q.length} remaining`);
  }
}

class QueryBuilder {
  private _filters: Record<string, unknown> = {};
  private _selectCols?: string;

  constructor(private readonly _table: string) {}

  select(cols?: string): this {
    this._selectCols = cols;
    return this;
  }

  eq(col: string, val: unknown): this {
    this._filters[col] = val;
    return this;
  }

  in(col: string, vals: unknown[]): this {
    this._filters[col] = vals;
    return this;
  }

  limit(_n: number): this {
    return this;
  }

  order(_col: string): this {
    return this;
  }

  maybeSingle(): Promise<any> {
    const key = `from(${this._table}).maybeSingle`;
    callLog.push({ method: key, args: [{ ...this._filters }] });
    return Promise.resolve(pop(key, { data: null, error: null }));
  }

  single(): Promise<any> {
    const key = `from(${this._table}).single`;
    callLog.push({ method: key, args: [{ ...this._filters }] });
    return Promise.resolve(pop(key, { data: null, error: null }));
  }

  insert(row: unknown): any {
    const key = `from(${this._table}).insert`;
    callLog.push({ method: key, args: [row] });
    const basePromise = Promise.resolve(pop(key, { error: null }));
    return Object.assign(basePromise, {
      select: (_cols?: string) => ({
        single: () => Promise.resolve(pop(`${key}.select.single`, { data: null, error: null })),
      }),
    });
  }

  update(row: unknown): any {
    const key = `from(${this._table}).update`;
    callLog.push({ method: key, args: [row] });
    return {
      eq: (_col: string, _val: unknown) => Promise.resolve(pop(key, { error: null })),
    };
  }

  delete(): any {
    const key = `from(${this._table}).delete`;
    callLog.push({ method: key, args: [{ ...this._filters }] });
    return {
      eq: (_col: string, _val: unknown) => Promise.resolve(pop(key, { error: null })),
    };
  }

  then(resolve: (v: any) => unknown, reject?: (e: unknown) => unknown): Promise<unknown> {
    const key = `from(${this._table}).select`;
    callLog.push({ method: key, args: [this._selectCols, { ...this._filters }] });
    return Promise.resolve(pop(key, { data: [], error: null })).then(resolve, reject);
  }
}

class StorageMock {
  private _bucket = "";

  from(bucket: string): this {
    this._bucket = bucket;
    return this;
  }

  remove(paths: string[]): Promise<any> {
    const key = `storage(${this._bucket}).remove`;
    callLog.push({ method: key, args: [paths] });
    return Promise.resolve(pop(key, { error: null }));
  }

  list(folder: string, opts?: unknown): Promise<any> {
    const key = `storage(${this._bucket}).list`;
    callLog.push({ method: key, args: [folder, opts] });
    return Promise.resolve(pop(key, { data: [], error: null }));
  }

  createSignedUrls(paths: string[], exp: number): Promise<any> {
    const key = `storage(${this._bucket}).createSignedUrls`;
    callLog.push({ method: key, args: [paths, exp] });
    return Promise.resolve(pop(key, {
      data: paths.map((_, i) => ({ signedUrl: `https://mock-signed-${i}` })),
      error: null,
    }));
  }

  createSignedUploadUrl(path: string): Promise<any> {
    const key = `storage(${this._bucket}).createSignedUploadUrl`;
    callLog.push({ method: key, args: [path] });
    return Promise.resolve(pop(key, { data: { signedUrl: "https://mock-upload-url" }, error: null }));
  }
}

class MockAuthClient {
  getUser(): Promise<any> {
    callLog.push({ method: "auth.getUser", args: [] });
    return Promise.resolve(pop("auth.getUser", { data: { user: null }, error: { message: "no mock" } }));
  }
}

class MockClient {
  auth = new MockAuthClient();
  storage = new StorageMock();

  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }
}

export function createClient(_url: string, _key: string, _opts?: unknown): any {
  return new MockClient();
}
