import mongoose, { Schema, Document } from 'mongoose';
import { SubjectModel } from './Subject.ts';

export interface ILectureDocument extends Document {
  subjectId: mongoose.Types.ObjectId;
  session: number;
  title: string;
  videoUrl: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export const lectureSchema = new Schema<ILectureDocument>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    session: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'lectures',
  }
);

export const LectureModel: mongoose.Model<ILectureDocument> =
  (mongoose.models.Lecture as mongoose.Model<ILectureDocument>) ||
  mongoose.model<ILectureDocument>('Lecture', lectureSchema, 'lectures');

/**
 * Creates a lecture where the session number is guaranteed sequential and unique
 * by atomically incrementing the parent Subject's nextSessionNumber, NOT counting existing lectures.
 */
export async function createLectureWithSequentialSession(data: {
  subjectId: string | mongoose.Types.ObjectId;
  title: string;
  videoUrl?: string;
  createdBy: string | mongoose.Types.ObjectId;
}): Promise<ILectureDocument> {
  // Atomically get current nextSessionNumber and increment it by 1
  const subject = await SubjectModel.findByIdAndUpdate(
    data.subjectId,
    { $inc: { nextSessionNumber: 1 } },
    { returnDocument: 'before' }
  ).exec();

  if (!subject) {
    throw new Error('Parent subject not found');
  }

  const sessionNumber = subject.nextSessionNumber || 1;

  const lecture = await LectureModel.create({
    subjectId: data.subjectId,
    session: sessionNumber,
    title: data.title.trim(),
    videoUrl: (data.videoUrl || '').trim(),
    createdBy: data.createdBy,
  });

  return lecture;
}
