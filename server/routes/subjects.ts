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

// Helper to extract YouTube playlist ID
function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{12,64}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const list = url.searchParams.get('list');
    if (list) return list;
  } catch {}
  const match = trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

// POST /api/subjects/extract-youtube-playlist - Extract titles and URLs from a YouTube playlist
router.post('/extract-youtube-playlist', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ message: 'YouTube playlist URL is required' });
      return;
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      res.status(400).json({
        message: 'Invalid YouTube playlist URL. Make sure it contains a playlist ID (e.g. list=PL...).',
      });
      return;
    }

    const targetUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
    const ytRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!ytRes.ok) {
      res.status(502).json({
        message: `Failed to fetch playlist from YouTube (HTTP ${ytRes.status}). The playlist might be private or deleted.`,
      });
      return;
    }

    const html = await ytRes.text();
    const startIdx = html.indexOf('var ytInitialData =');
    let playlistTitle = 'YouTube Playlist';
    const extractedVideos: Array<{
      videoId: string;
      title: string;
      videoUrl: string;
      thumbnail: string;
    }> = [];

    if (startIdx !== -1) {
      const endIdx = html.indexOf(';</script>', startIdx);
      if (endIdx !== -1) {
        try {
          const jsonStr = html.slice(startIdx + 'var ytInitialData ='.length, endIdx).trim();
          const data = JSON.parse(jsonStr);

          // Check if YouTube returned an error alert
          if (Array.isArray(data.alerts)) {
            const errorAlert = data.alerts.find(
              (a: any) => a?.alertRenderer?.type === 'ERROR'
            );
            if (errorAlert) {
              const alertMsg =
                errorAlert.alertRenderer?.text?.runs?.[0]?.text ||
                errorAlert.alertRenderer?.text?.simpleText ||
                'This playlist is private or does not exist.';
              res.status(404).json({ message: alertMsg });
              return;
            }
          }

          // Playlist Title
          const title =
            data?.metadata?.playlistMetadataRenderer?.title ||
            data?.header?.playlistHeaderRenderer?.title?.simpleText ||
            data?.header?.playlistHeaderRenderer?.title?.runs?.[0]?.text;
          if (title) {
            playlistTitle = title;
          }

          // Traverse to find videos
          const seen = new Set<string>();
          function searchNodes(obj: any) {
            if (!obj || typeof obj !== 'object') return;
            // 1. YouTube lockupViewModel (modern layout)
            if (obj.lockupViewModel) {
              const lvm = obj.lockupViewModel;
              const contentId = lvm.contentId;
              const videoTitle = lvm.metadata?.lockupMetadataViewModel?.title?.content;
              if (contentId && videoTitle && !seen.has(contentId)) {
                seen.add(contentId);
                extractedVideos.push({
                  videoId: contentId,
                  title: videoTitle.trim(),
                  videoUrl: `https://www.youtube.com/watch?v=${contentId}`,
                  thumbnail: `https://img.youtube.com/vi/${contentId}/mqdefault.jpg`,
                });
              }
            }
            // 2. YouTube playlistVideoRenderer (classic layout)
            if (obj.playlistVideoRenderer) {
              const pvr = obj.playlistVideoRenderer;
              const videoId = pvr.videoId;
              const videoTitle = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText;
              if (videoId && videoTitle && !seen.has(videoId)) {
                seen.add(videoId);
                extractedVideos.push({
                  videoId,
                  title: videoTitle.trim(),
                  videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                  thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                });
              }
            }
            for (const key of Object.keys(obj)) {
              searchNodes(obj[key]);
            }
          }
          searchNodes(data);
        } catch (parseErr) {
          console.error('[YouTube Playlist Parse Error]:', parseErr);
        }
      }
    }

    // Fallback: If 0 videos found via web scraping, attempt RSS feed
    if (extractedVideos.length === 0) {
      try {
        const rssRes = await fetch(
          `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`
        );
        if (rssRes.ok) {
          const xml = await rssRes.text();
          const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            playlistTitle = titleMatch[1].trim();
          }

          const entryRegex =
            /<entry>[\s\S]*?<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<media:title>([^<]+)<\/media:title>[\s\S]*?<\/entry>/g;
          let entryMatch;
          while ((entryMatch = entryRegex.exec(xml)) !== null) {
            const vId = entryMatch[1];
            const vTitle = entryMatch[2];
            extractedVideos.push({
              videoId: vId,
              title: vTitle.trim(),
              videoUrl: `https://www.youtube.com/watch?v=${vId}`,
              thumbnail: `https://img.youtube.com/vi/${vId}/mqdefault.jpg`,
            });
          }
        }
      } catch (rssErr) {
        console.error('[YouTube RSS Fallback Error]:', rssErr);
      }
    }

    if (extractedVideos.length === 0) {
      res.status(404).json({
        message:
          'No public videos could be extracted from this playlist. Please ensure the playlist is Public or Unlisted (not Private).',
      });
      return;
    }

    const numberedVideos = extractedVideos.map((item, idx) => ({
      session: idx + 1,
      title: item.title,
      videoUrl: item.videoUrl,
      videoId: item.videoId,
      thumbnail: item.thumbnail,
    }));

    res.json({
      success: true,
      playlistId,
      playlistTitle,
      totalVideos: numberedVideos.length,
      videos: numberedVideos,
    });
  } catch (err) {
    console.error('[Extract YouTube Playlist Error]:', err);
    res.status(500).json({ message: 'Internal server error while extracting YouTube playlist' });
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
