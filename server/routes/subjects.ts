import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './auth.ts';
import {
  SubjectModel,
  LectureModel,
  ProgressModel,
  createLectureWithSequentialSession,
} from '../models/index.ts';

const router = Router();

// GET /api/subjects - List all subjects (global + user's own) with progress stats
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // Fetch global subjects + subjects created by this user
    const subjects = await SubjectModel.find({
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    })
      .sort({ createdAt: 1 })
      .lean();

    const subjectStats = await Promise.all(
      subjects.map(async (subj) => {
        // Find all lectures for this subject
        const lectures = await LectureModel.find({ subjectId: subj._id })
          .select('_id')
          .lean();
        const totalTopics = lectures.length;
        const lectureIds = lectures.map((l) => l._id);

        let completedTopics = 0;
        if (lectureIds.length > 0) {
          completedTopics = await ProgressModel.countDocuments({
            $or: [{ userId: userObjectId }, { userId: userId }],
            itemType: 'lecture',
            itemId: { $in: lectureIds },
            status: 'completed',
          });
        }

        const isOwner =
          !subj.isGlobal &&
          subj.createdBy &&
          subj.createdBy.toString() === userId.toString();

        return {
          id: subj._id.toString(),
          name: subj.name,
          isGlobal: !!subj.isGlobal,
          isOwner: !!isOwner,
          nextSessionNumber: subj.nextSessionNumber,
          totalTopics,
          completedTopics,
          percent:
            totalTopics > 0
              ? Math.min(100, Math.round((completedTopics / totalTopics) * 100))
              : 0,
        };
      })
    );

    res.json({ subjects: subjectStats });
  } catch (err) {
    console.log('[Subjects GET Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// POST /api/subjects - Create a new subject (name only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Subject name is required' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const newSubject = await SubjectModel.create({
      name: name.trim(),
      createdBy: userObjectId,
      isGlobal: false,
      nextSessionNumber: 1,
    });

    res.status(201).json({
      id: newSubject._id.toString(),
      name: newSubject.name,
      isGlobal: false,
      isOwner: true,
      nextSessionNumber: 1,
      totalTopics: 0,
      completedTopics: 0,
      percent: 0,
    });
  } catch (err) {
    console.log('[Subjects POST Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to create subject' });
  }
});

// GET /api/subjects/:id - Fetch single subject with lectures sorted by session ascending
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const subjectId = req.params.id;

    if (!mongoose.isValidObjectId(subjectId)) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const subject = await SubjectModel.findOne({
      _id: subjectId,
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    }).lean();

    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    // CRITICAL: Always fetch lectures sorted by their "session" field ascending (.sort({ session: 1 }))
    const lectures = await LectureModel.find({ subjectId: subject._id })
      .sort({ session: 1 })
      .lean();

    // Fetch user-specific progress for each lecture
    const lectureIds = lectures.map((l) => l._id);
    const progressRecords = await ProgressModel.find({
      $or: [{ userId: userObjectId }, { userId: userId }],
      itemType: 'lecture',
      itemId: { $in: lectureIds },
    }).lean();

    const progressMap = new Map<
      string,
      { status: string; notes: string; completedAt: Date | null }
    >();
    for (const prog of progressRecords) {
      progressMap.set(prog.itemId.toString(), {
        status: prog.status,
        notes: prog.notes || '',
        completedAt: prog.completedAt || null,
      });
    }

    let completedCount = 0;
    const lectureRows = lectures.map((lec) => {
      const prog = progressMap.get(lec._id.toString());
      const isCompleted = prog?.status === 'completed';
      if (isCompleted) {
        completedCount++;
      }

      const isOwner =
        lec.createdBy && lec.createdBy.toString() === userId.toString();

      return {
        id: lec._id.toString(),
        subjectId: lec.subjectId.toString(),
        session: lec.session,
        title: lec.title,
        videoUrl: lec.videoUrl || '',
        isOwner: !!isOwner,
        completed: isCompleted,
        notes: prog?.notes || '',
        createdAt: lec.createdAt,
      };
    });

    const isSubjectOwner =
      !subject.isGlobal &&
      subject.createdBy &&
      subject.createdBy.toString() === userId.toString();

    res.json({
      subject: {
        id: subject._id.toString(),
        name: subject.name,
        isGlobal: !!subject.isGlobal,
        isOwner: !!isSubjectOwner,
        nextSessionNumber: subject.nextSessionNumber,
      },
      lectures: lectureRows,
      totalTopics: lectureRows.length,
      completedTopics: completedCount,
    });
  } catch (err) {
    console.log('[Subject Detail GET Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to fetch subject details' });
  }
});

// POST /api/subjects/:id/lectures - Add a new lecture/topic to this subject
router.post('/:id/lectures', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const subjectId = req.params.id;
    const { title, videoUrl } = req.body;

    if (!mongoose.isValidObjectId(subjectId)) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Topic title is required' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // Verify subject exists and user can add topics
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    });

    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    // Atomic sequential session creation: uses nextSessionNumber, then increments it
    const newLecture = await createLectureWithSequentialSession({
      subjectId: subject._id,
      title: title.trim(),
      videoUrl: typeof videoUrl === 'string' ? videoUrl.trim() : '',
      createdBy: userObjectId,
    });

    res.status(201).json({
      id: newLecture._id.toString(),
      subjectId: newLecture.subjectId.toString(),
      session: newLecture.session,
      title: newLecture.title,
      videoUrl: newLecture.videoUrl,
      isOwner: true,
      completed: false,
      notes: '',
      createdAt: newLecture.createdAt,
    });
  } catch (err) {
    console.log('[Lectures POST Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to create topic' });
  }
});

// POST /api/subjects/:id/lectures/bulk - Bulk add topics to a subject with atomic sequential session numbers
router.post('/:id/lectures/bulk', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const subjectId = req.params.id;
    const { items } = req.body;

    if (!mongoose.isValidObjectId(subjectId)) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items array is required' });
      return;
    }

    if (items.length > 500) {
      res.status(400).json({ message: 'Bulk import is capped at 500 items per batch' });
      return;
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // Verify subject exists and user can add topics
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      $or: [{ createdBy: userObjectId }, { createdBy: userId }, { isGlobal: true }],
    });

    if (!subject) {
      res.status(404).json({ message: 'Subject not found or you do not have permission' });
      return;
    }

    const insertedItems: Array<{ id: string; session: number; title: string }> = [];
    const failedItems: Array<{ index: number; title: string; error: string }> = [];

    // Process sequentially to guarantee strict order and sequential session numbers
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemNumber = i + 1;
      const title = item?.title;
      const videoUrl = item?.videoUrl;

      if (!title || typeof title !== 'string' || !title.trim()) {
        failedItems.push({
          index: itemNumber,
          title: String(title || `Item #${itemNumber}`),
          error: "Missing required 'title'",
        });
        continue;
      }

      try {
        const newLecture = await createLectureWithSequentialSession({
          subjectId: subject._id,
          title: title.trim(),
          videoUrl: typeof videoUrl === 'string' ? videoUrl.trim() : '',
          createdBy: userObjectId,
        });

        insertedItems.push({
          id: newLecture._id.toString(),
          session: newLecture.session,
          title: newLecture.title,
        });
      } catch (itemErr) {
        failedItems.push({
          index: itemNumber,
          title: title.trim(),
          error: itemErr instanceof Error ? itemErr.message : 'Database write failure',
        });
      }
    }

    const success = failedItems.length === 0;
    const statusCode = success ? 201 : insertedItems.length > 0 ? 207 : 500;

    res.status(statusCode).json({
      success,
      message: success
        ? `Successfully imported all ${insertedItems.length} lectures`
        : `Imported ${insertedItems.length} lectures with ${failedItems.length} failures`,
      insertedCount: insertedItems.length,
      failedCount: failedItems.length,
      insertedItems,
      failedItems,
    });
  } catch (err) {
    console.log('[Lectures Bulk POST Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Internal server error during bulk import' });
  }
});

// PATCH /api/subjects/:id/lectures/:lectureId/progress - Update progress (checklist / notes) for this user only
router.patch(
  '/:id/lectures/:lectureId/progress',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      const { lectureId } = req.params;
      const { completed, notes } = req.body;

      if (!mongoose.isValidObjectId(lectureId)) {
        res.status(404).json({ message: 'Lecture not found' });
        return;
      }

      const userObjectId = mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;
      const lectureObjectId = new mongoose.Types.ObjectId(lectureId);

      // Verify lecture exists
      const lectureExists = await LectureModel.findById(lectureObjectId).select('_id');
      if (!lectureExists) {
        res.status(404).json({ message: 'Lecture not found' });
        return;
      }

      // Prepare progress update
      const updateDoc: any = {};
      if (typeof completed === 'boolean') {
        updateDoc.status = completed ? 'completed' : 'todo';
        updateDoc.completedAt = completed ? new Date() : null;
      }
      if (typeof notes === 'string') {
        updateDoc.notes = notes;
      }

      // Upsert into Progress collection - strictly for this user, never modifying the shared lecture
      const progress = await ProgressModel.findOneAndUpdate(
        {
          userId: userObjectId,
          itemType: 'lecture',
          itemId: lectureObjectId,
        },
        {
          $set: updateDoc,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      res.json({
        lectureId,
        completed: progress.status === 'completed',
        notes: progress.notes || '',
      });
    } catch (err) {
      console.log('[Lecture Progress PATCH Error]:', err instanceof Error ? err.message : err);
      res.status(500).json({ message: 'Failed to update topic progress' });
    }
  }
);

// DELETE /api/subjects/:id/lectures/:lectureId - Delete lecture if owner (NEVER renumber remaining lectures)
router.delete(
  '/:id/lectures/:lectureId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      const { lectureId } = req.params;

      if (!mongoose.isValidObjectId(lectureId)) {
        res.status(404).json({ message: 'Lecture not found' });
        return;
      }

      const lectureObjectId = new mongoose.Types.ObjectId(lectureId);
      const userObjectId = mongoose.isValidObjectId(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

      // Find lecture
      const lecture = await LectureModel.findById(lectureObjectId);
      if (!lecture) {
        res.status(404).json({ message: 'Lecture not found' });
        return;
      }

      // Only allow delete if current user created this lecture
      if (lecture.createdBy.toString() !== userId.toString()) {
        res.status(403).json({ message: 'You can only delete lectures you created' });
        return;
      }

      // Delete the lecture document
      await LectureModel.findByIdAndDelete(lectureObjectId);

      // Clean up progress entries associated with this lecture
      await ProgressModel.deleteMany({ itemId: lectureObjectId });

      // CRITICAL: Do NOT renumber the remaining lectures! Gaps are intentional.
      res.json({ message: 'Lecture deleted successfully', deletedId: lectureId });
    } catch (err) {
      console.log('[Lecture DELETE Error]:', err instanceof Error ? err.message : err);
      res.status(500).json({ message: 'Failed to delete lecture' });
    }
  }
);

// DELETE /api/subjects/:id - Delete subject if owner or admin
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const subjectObjectId = new mongoose.Types.ObjectId(id);
    const subject = await SubjectModel.findById(subjectObjectId);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const isOwner = subject.createdBy && subject.createdBy.toString() === userId.toString();
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'You can only delete subjects you created' });
      return;
    }

    const lectures = await LectureModel.find({ subjectId: subjectObjectId });
    const lectureIds = lectures.map((l) => l._id);
    if (lectureIds.length > 0) {
      await ProgressModel.deleteMany({ itemId: { $in: lectureIds } });
    }
    await LectureModel.deleteMany({ subjectId: subjectObjectId });
    await SubjectModel.findByIdAndDelete(subjectObjectId);

    res.json({ message: 'Subject deleted successfully', deletedId: id });
  } catch (err) {
    console.log('[Subject DELETE Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

export default router;
