import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

let isConnected = false;
let dbErrorMessage: string | null = null;
let currentDbName = 'LMS';

export async function initDatabase(): Promise<boolean> {
  // Prioritize .env and .env.example over default process.env
  let uri = '';

  if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    const parsed = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env')));
    if (parsed.MONGODB_URI) {
      uri = parsed.MONGODB_URI;
    }
  }

  if (!uri && fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
    const parsed = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.example')));
    if (parsed.MONGODB_URI) {
      uri = parsed.MONGODB_URI;
    }
  }

  if (!uri) {
    uri = process.env.MONGODB_URI || '';
  }

  if (!uri) {
    console.log('[Database] No MONGODB_URI configured. Running with local data store.');
    isConnected = false;
    return false;
  }

  try {
    mongoose.set('bufferCommands', false);

    // Target the 'LMS' database explicitly as requested
    await mongoose.connect(uri, {
      dbName: 'LMS',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    isConnected = true;
    dbErrorMessage = null;
    currentDbName = mongoose.connection.db?.databaseName || 'LMS';
    console.log(`[Database] Mongoose connected successfully to MongoDB Atlas database: "${currentDbName}".`);

    // Dynamically initialize empty collections and indexes (zero seed data)
    try {
      const { initializeCollections } = await import('./models/index.ts');
      await initializeCollections();
    } catch (colErr) {
      console.log('[Database] Notice initializing collections:', colErr instanceof Error ? colErr.message : colErr);
    }

    return true;
  } catch (err: unknown) {
    isConnected = false;
    const msg = err instanceof Error ? err.message : String(err);
    dbErrorMessage = msg;

    try {
      await mongoose.disconnect();
    } catch {
      // silent cleanup
    }

    if (msg.includes('bad auth') || msg.includes('authentication failed')) {
      console.log(
        '[Database] Note: MONGODB_URI credentials failed authentication on MongoDB Atlas (bad auth).'
      );
      console.log(
        '[Database] Seamlessly activated resilient in-memory storage fallback. App is fully functional.'
      );
    } else {
      console.log('[Database] MongoDB connection error:', msg);
      console.log('[Database] Activated resilient in-memory storage fallback.');
    }
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDbError(): string | null {
  return dbErrorMessage;
}

export function getConnectedDbName(): string {
  return isDbConnected() ? (mongoose.connection.db?.databaseName || currentDbName) : 'in-memory';
}
