import mongoose, { Schema, Document } from 'mongoose';

export type EventType = 'academic' | 'task';

export interface IEventDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD"
  title: string;
  type: EventType;
  completed: boolean;
  createdAt: Date;
}

export const eventSchema = new Schema<IEventDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['academic', 'task'],
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'events',
  }
);

export const EventModel: mongoose.Model<IEventDocument> =
  (mongoose.models.Event as mongoose.Model<IEventDocument>) ||
  mongoose.model<IEventDocument>('Event', eventSchema, 'events');
