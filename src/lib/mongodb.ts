import { MongoClient } from 'mongodb';

// Lazy initialisation: connecting at import time used to crash `next build`
// because page-data collection runs without env vars present. We defer the
// actual connection until the first method call on the promise.

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set — add it to .env.local');
  }

  if (process.env.NODE_ENV === 'development') {
    // Reuse the connection across HMR reloads.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  // In production we still want one client per process (cold start once,
  // reused while the lambda/instance is warm). The driver pools internally.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise;
}

// What existing call sites do is `const client = await clientPromise`.
// A Proxy that resolves to the real promise on first access keeps that API
// while still deferring connection until needed.
const clientPromise: Promise<MongoClient> = new Proxy({} as Promise<MongoClient>, {
  get(_target, prop) {
    const real = getClientPromise();
    const value = (real as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export default clientPromise;
