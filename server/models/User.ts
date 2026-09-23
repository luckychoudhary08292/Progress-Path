import mongoose, { Schema, Document } from 'mongoose';
import { isDbConnected } from '../db.ts';

export type UserRole = 'admin' | 'user' | 'student';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mustChangePassword: boolean;
  createdAt: Date;
}

export function getEffectiveRole(email: string, explicitRole?: string): UserRole {
  if (explicitRole === 'admin') return 'admin';
  const norm = email ? email.trim().toLowerCase() : '';
  // Dev admin seed or designated admin email from environment
  if (norm === 'luckypc08292@gmail.com') {
    return 'admin';
  }
  if (process.env.ADMIN_EMAIL && norm === process.env.ADMIN_EMAIL.trim().toLowerCase()) {
    return 'admin';
  }
  return explicitRole === 'student' ? 'student' : (explicitRole as UserRole) || 'user';
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'student'], default: 'user' },
    mustChangePassword: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'users',
  }
);

export const UserModel: mongoose.Model<IUserDocument> =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', userSchema, 'users');

// In-memory fallback for environments where MONGODB_URI is not yet configured
const inMemoryUsers: UserRecord[] = [];

export const UserRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    if (!email || typeof email !== 'string') return null;
    const normalized = email.trim().toLowerCase();

    if (isDbConnected()) {
      try {
        const doc = await UserModel.findOne({ email: normalized }).exec();
        if (doc) {
          return {
            id: doc._id ? doc._id.toString() : '',
            name: doc.name,
            email: doc.email,
            password: doc.password,
            role: getEffectiveRole(doc.email, (doc as any).role),
            mustChangePassword: Boolean((doc as any).mustChangePassword),
            createdAt: doc.createdAt,
          };
        }
      } catch (err) {
        console.log('[DB Info in findByEmail]:', err instanceof Error ? err.message : err);
      }
    }

    const found = inMemoryUsers.find((u) => u.email === normalized);
    return found ? { ...found, role: getEffectiveRole(found.email, found.role) } : null;
  },

  async findById(id: string): Promise<UserRecord | null> {
    if (!id || typeof id !== 'string') return null;

    if (isDbConnected()) {
      // Only query Mongoose with valid 24-char ObjectId strings to avoid CastError from legacy in-memory tokens
      if (mongoose.isValidObjectId(id)) {
        try {
          const doc = await UserModel.findById(id).exec();
          if (doc) {
            return {
              id: doc._id ? doc._id.toString() : '',
              name: doc.name,
              email: doc.email,
              password: doc.password,
              role: getEffectiveRole(doc.email, (doc as any).role),
              mustChangePassword: Boolean((doc as any).mustChangePassword),
              createdAt: doc.createdAt,
            };
          }
        } catch (err) {
          console.log('[DB Info in findById]:', err instanceof Error ? err.message : err);
        }
      }
    }

    const found = inMemoryUsers.find((u) => u.id === id);
    return found ? { ...found, role: getEffectiveRole(found.email, found.role) } : null;
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    mustChangePassword?: boolean;
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedName = data.name.trim();
    const effectiveRole = getEffectiveRole(normalizedEmail, data.role);
    const mustChangePassword = Boolean(data.mustChangePassword);

    if (isDbConnected()) {
      try {
        const doc = await UserModel.create({
          name: normalizedName,
          email: normalizedEmail,
          password: data.password,
          role: effectiveRole,
          mustChangePassword,
        });
        return {
          id: doc._id ? doc._id.toString() : '',
          name: doc.name,
          email: doc.email,
          password: doc.password,
          role: effectiveRole,
          mustChangePassword,
          createdAt: doc.createdAt,
        };
      } catch (err) {
        console.log('[DB Info in create user]:', err instanceof Error ? err.message : err);
        throw err;
      }
    }

    const newUser: UserRecord = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      name: normalizedName,
      email: normalizedEmail,
      password: data.password,
      role: effectiveRole,
      mustChangePassword,
      createdAt: new Date(),
    };
    inMemoryUsers.push(newUser);
    return newUser;
  },

  async update(id: string, data: { name?: string; password?: string; mustChangePassword?: boolean }): Promise<UserRecord | null> {
    if (!id || typeof id !== 'string') return null;

    if (isDbConnected()) {
      if (mongoose.isValidObjectId(id)) {
        try {
          const updateObj: Record<string, any> = {};
          if (data.name && typeof data.name === 'string') updateObj.name = data.name.trim();
          if (data.password && typeof data.password === 'string') updateObj.password = data.password;
          if (typeof data.mustChangePassword === 'boolean') updateObj.mustChangePassword = data.mustChangePassword;

          const doc = await UserModel.findByIdAndUpdate(id, { $set: updateObj }, { new: true }).exec();
          if (doc) {
            return {
              id: doc._id ? doc._id.toString() : '',
              name: doc.name,
              email: doc.email,
              password: doc.password,
              role: getEffectiveRole(doc.email, (doc as any).role),
              mustChangePassword: Boolean((doc as any).mustChangePassword),
              createdAt: doc.createdAt,
            };
          }
        } catch (err) {
          console.log('[DB Info in update user]:', err instanceof Error ? err.message : err);
        }
      }
    }

    const idx = inMemoryUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      if (data.name) inMemoryUsers[idx].name = data.name.trim();
      if (data.password) inMemoryUsers[idx].password = data.password;
      if (typeof data.mustChangePassword === 'boolean') inMemoryUsers[idx].mustChangePassword = data.mustChangePassword;
      return {
        ...inMemoryUsers[idx],
        role: getEffectiveRole(inMemoryUsers[idx].email, inMemoryUsers[idx].role),
      };
    }
    return null;
  },

  async updateRole(id: string, newRole: UserRole): Promise<UserRecord | null> {
    if (!id || typeof id !== 'string') return null;

    if (isDbConnected()) {
      if (mongoose.isValidObjectId(id)) {
        try {
          const doc = await UserModel.findByIdAndUpdate(
            id,
            { $set: { role: newRole } },
            { new: true }
          ).exec();

          if (doc) {
            return {
              id: doc._id ? doc._id.toString() : '',
              name: doc.name,
              email: doc.email,
              password: doc.password,
              role: (doc as any).role as UserRole,
              mustChangePassword: Boolean((doc as any).mustChangePassword),
              createdAt: doc.createdAt,
            };
          }
        } catch (err) {
          console.log('[DB Info in updateRole]:', err instanceof Error ? err.message : err);
        }
      }
    }

    const idx = inMemoryUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      inMemoryUsers[idx].role = newRole;
      return inMemoryUsers[idx];
    }
    return null;
  },

  async listAllUsers(): Promise<UserRecord[]> {
    if (isDbConnected()) {
      try {
        const docs = await UserModel.find({}).sort({ createdAt: 1 }).exec();
        return docs.map((doc) => ({
          id: doc._id ? doc._id.toString() : '',
          name: doc.name,
          email: doc.email,
          password: doc.password,
          role: getEffectiveRole(doc.email, (doc as any).role),
          mustChangePassword: Boolean((doc as any).mustChangePassword),
          createdAt: doc.createdAt,
        }));
      } catch (err) {
        console.log('[DB Info in listAllUsers]:', err instanceof Error ? err.message : err);
      }
    }

    return inMemoryUsers.map((u) => ({
      ...u,
      role: getEffectiveRole(u.email, u.role),
    }));
  },
};
