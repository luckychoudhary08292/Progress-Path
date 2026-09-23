import { Router, Request, Response } from 'express';
import { authenticateToken } from './auth.ts';
import {
  SubjectRepository,
  LectureRepository,
  ProgressRepository,
} from '../repositories.ts';
import { sanitizeHtml } from '../middleware/security.ts';

const router = Router();

// GET /api/subjects - List all subjects (global + user's own) with progress stats
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    const subjects = await SubjectRepository.listForUser(userId);

    const subjectStats = await Promise.all(
      subjects.map(async (subj) => {
        const lectures = await LectureRepository.listForSubject(subj.id, userId);
        const totalTopics = lectures.length;
        const lectureIds = lectures.map((l) => l.id);

        let completedTopics = 0;
        if (lectureIds.length > 0) {
          completedTopics = await ProgressRepository.countCompleted(userId, 'lecture', lectureIds);
        }

        return {
          id: subj.id,
          name: subj.name,
          isGlobal: !!subj.isGlobal,
          isOwner: !!subj.isOwner,
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
    const { name } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Subject name is required' });
      return;
    }

    const cleanName = sanitizeHtml(name.trim());
    const newSubject = await SubjectRepository.create(cleanName, userId);

    res.status(201).json(newSubject);
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

    if (!subjectId) {
      res.status(400).json({ message: 'Subject ID is required' });
      return;
    }

    const subject = await SubjectRepository.findById(subjectId, userId);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const lectures = await LectureRepository.listForSubject(subject.id, userId);
    const lectureIds = lectures.map((l) => l.id);
    const progressMap = await ProgressRepository.getStatusMap(userId, 'lecture', lectureIds);

    let completedCount = 0;
    const lectureRows = lectures.map((lec) => {
      const prog = progressMap.get(lec.id);
      const isCompleted = prog?.status === 'completed';
      if (isCompleted) {
        completedCount++;
      }

      const isOwner = Boolean(userId) && (lec.createdBy ? lec.createdBy === String(userId) : false);

      return {
        id: lec.id,
        subjectId: lec.subjectId,
        session: lec.session,
        title: lec.title,
        videoUrl: lec.videoUrl || '',
        isOwner: !!isOwner,
        completed: isCompleted,
        notes: prog?.notes || '',
        createdAt: lec.createdAt,
      };
    });

    const maxSession = lectures.reduce((max, l) => Math.max(max, l.session), 0);
    const userNextSessionNumber = Math.max(subject.nextSessionNumber || 1, maxSession + 1);

    res.json({
      subject: {
        id: subject.id,
        name: subject.name,
        isGlobal: !!subject.isGlobal,
        isOwner: !!subject.isOwner,
        nextSessionNumber: subject.isGlobal ? userNextSessionNumber : subject.nextSessionNumber,
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
    const { title, videoUrl } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ message: 'Topic title is required' });
      return;
    }

    const subject = await SubjectRepository.findById(subjectId, userId);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    const cleanTitle = sanitizeHtml(title.trim());
    const cleanUrl = typeof videoUrl === 'string' ? videoUrl.trim() : '';

    const newLecture = await LectureRepository.createSequential({
      subjectId: subject.id,
      title: cleanTitle,
      videoUrl: cleanUrl,
      createdBy: userId,
    });

    res.status(201).json({
      id: newLecture.id,
      subjectId: newLecture.subjectId,
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
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items array is required' });
      return;
    }

    if (items.length > 500) {
      res.status(400).json({ message: 'Bulk import is capped at 500 items per batch' });
      return;
    }

    const subject = await SubjectRepository.findById(subjectId, userId);
    if (!subject) {
      res.status(404).json({ message: 'Subject not found or you do not have permission' });
      return;
    }

    const insertedItems: Array<{ id: string; session: number; title: string }> = [];
    const failedItems: Array<{ index: number; title: string; error: string }> = [];

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
        const cleanTitle = sanitizeHtml(title.trim());
        const cleanUrl = typeof videoUrl === 'string' ? videoUrl.trim() : '';

        const newLecture = await LectureRepository.createSequential({
          subjectId: subject.id,
          title: cleanTitle,
          videoUrl: cleanUrl,
          createdBy: userId,
        });

        insertedItems.push({
          id: newLecture.id,
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
      const { completed, notes } = req.body || {};

      if (!lectureId) {
        res.status(400).json({ message: 'Lecture ID is required' });
        return;
      }

      const cleanNotes = typeof notes === 'string' ? sanitizeHtml(notes) : undefined;
      const result = await ProgressRepository.updateProgress(userId, 'lecture', lectureId, {
        completed: typeof completed === 'boolean' ? completed : undefined,
        notes: cleanNotes,
      });

      res.json({
        lectureId,
        completed: result.completed,
        notes: result.notes,
      });
    } catch (err) {
      console.log('[Lecture Progress PATCH Error]:', err instanceof Error ? err.message : err);
      res.status(500).json({ message: 'Failed to update topic progress' });
    }
  }
);

// DELETE /api/subjects/:id/lectures/:lectureId - Delete lecture if owner
router.delete(
  '/:id/lectures/:lectureId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      const { lectureId } = req.params;

      const deleted = await LectureRepository.delete(lectureId, userId);
      if (deleted === null) {
        res.status(403).json({ message: 'You can only delete lectures you created' });
        return;
      }
      if (!deleted) {
        res.status(404).json({ message: 'Lecture not found' });
        return;
      }

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

    const isAdmin = user.role === 'admin';
    const deleted = await SubjectRepository.delete(id, userId, isAdmin);

    if (deleted === null) {
      res.status(403).json({ message: 'You can only delete subjects you created' });
      return;
    }
    if (!deleted) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }

    res.json({ message: 'Subject deleted successfully', deletedId: id });
  } catch (err) {
    console.log('[Subject DELETE Error]:', err instanceof Error ? err.message : err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

export default router;
