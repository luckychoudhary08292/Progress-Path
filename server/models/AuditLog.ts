import mongoose, { Schema, Document } from 'mongoose';
import { isDbConnected } from '../db.ts';

export interface IAuditLogDocument extends Document {
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: 'create_admin' | 'promote_admin' | 'revoke_admin' | 'bootstrap_initial_admin' | 'first_login_password_changed' | string;
  targetUserId?: string;
  targetEmail?: string;
  details: string;
  timestamp: Date;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  details: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: String, required: true },
    actorName: { type: String, required: true, trim: true },
    actorEmail: { type: String, default: '', lowercase: true, trim: true },
    action: { type: String, required: true },
    targetUserId: { type: String, default: '' },
    targetEmail: { type: String, default: '', lowercase: true, trim: true },
    details: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  {
    collection: 'audit_logs',
  }
);

auditLogSchema.index({ timestamp: -1 });

export const AuditLogModel: mongoose.Model<IAuditLogDocument> =
  (mongoose.models.AuditLog as mongoose.Model<IAuditLogDocument>) ||
  mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema, 'audit_logs');

// In-memory fallback for environments without active MongoDB connection
const inMemoryAuditLogs: AuditLogRecord[] = [];

export const AuditLogRepository = {
  async log(data: {
    actorId: string;
    actorName: string;
    actorEmail?: string;
    action: string;
    targetUserId?: string;
    targetEmail?: string;
    details: string;
    timestamp?: Date;
  }): Promise<AuditLogRecord> {
    const timestamp = data.timestamp || new Date();

    if (isDbConnected()) {
      try {
        const doc = await AuditLogModel.create({
          actorId: data.actorId,
          actorName: data.actorName,
          actorEmail: data.actorEmail || '',
          action: data.action,
          targetUserId: data.targetUserId || '',
          targetEmail: data.targetEmail || '',
          details: data.details,
          timestamp,
        });

        return {
          id: doc._id ? doc._id.toString() : '',
          actorId: doc.actorId,
          actorName: doc.actorName,
          actorEmail: doc.actorEmail,
          action: doc.action,
          targetUserId: doc.targetUserId,
          targetEmail: doc.targetEmail,
          details: doc.details,
          timestamp: doc.timestamp,
        };
      } catch (err) {
        console.log('[AuditLog DB error]:', err instanceof Error ? err.message : err);
      }
    }

    const newRecord: AuditLogRecord = {
      id: 'audit_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      actorId: data.actorId,
      actorName: data.actorName,
      actorEmail: data.actorEmail || '',
      action: data.action,
      targetUserId: data.targetUserId || '',
      targetEmail: data.targetEmail || '',
      details: data.details,
      timestamp,
    };

    inMemoryAuditLogs.unshift(newRecord);
    return newRecord;
  },

  async listRecent(limit = 100): Promise<AuditLogRecord[]> {
    if (isDbConnected()) {
      try {
        const docs = await AuditLogModel.find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .exec();

        return docs.map((doc) => ({
          id: doc._id ? doc._id.toString() : '',
          actorId: doc.actorId,
          actorName: doc.actorName,
          actorEmail: doc.actorEmail,
          action: doc.action,
          targetUserId: doc.targetUserId,
          targetEmail: doc.targetEmail,
          details: doc.details,
          timestamp: doc.timestamp,
        }));
      } catch (err) {
        console.log('[AuditLog DB list error]:', err instanceof Error ? err.message : err);
      }
    }

    return inMemoryAuditLogs.slice(0, limit);
  },
};
