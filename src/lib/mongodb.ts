import { MongoClient } from 'mongodb';

// Lazy initialisation so this module is safe to import at build time.
// Throwing at import time used to crash `next build`'s page-data collection
// whenever MONGODB_URI wasn't present in the build environment.

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

  return new MongoClient(uri).connect();
}

// Resolved on first access; this is what existing call sites already `await`.
const clientPromise: Promise<MongoClient> = new Proxy({} as Promise<MongoClient>, {
  get(_target, prop) {
    const real = getClientPromise();
    const value = (real as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export default clientPromise;
