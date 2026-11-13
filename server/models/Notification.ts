import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'task-reminder' | 'task-completed' | 'system';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

export const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['task-reminder', 'task-completed', 'system'],
      default: 'task-reminder',
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: 'notifications',
  }
);

export const NotificationModel: mongoose.Model<INotificationDocument> =
  (mongoose.models.Notification as mongoose.Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', notificationSchema, 'notifications');
