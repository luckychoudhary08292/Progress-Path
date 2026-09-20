import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { UserRepository } from '../models/User.ts';
import { AuditLogRepository } from '../models/AuditLog.ts';
import { isDbConnected, getConnectedDbName } from '../db.ts';
import {
  SubjectRepository,
  LectureRepository,
  ProblemRepository,
  EventRepository,
  ProgressRepository,
} from '../repositories.ts';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-jwt-key-2026';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[Security Warning]: JWT_SECRET is not defined in environment variables! Please set JWT_SECRET in your Render dashboard.');
}

interface JwtPayload {
  userId: string;
  email: string;
}

// Middleware to authenticate JWT token
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      res.status(401).json({ message: 'Invalid or expired session token' });
      return;
    }

    const payload = decoded as JwtPayload;
    try {
      const user = await UserRepository.findById(payload.userId);
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
      (req as any).user = user;
      next();
    } catch {
      res.status(500).json({ message: 'Internal server error validating user' });
    }
  });
}

// Middleware to enforce Admin role (403 if not admin)
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
    return;
  }

  next();
}

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body || {};
    const fieldErrors: Record<string, string> = {};

    // Validate Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      fieldErrors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      fieldErrors.name = 'Name must be at least 2 characters';
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !email.trim()) {
      fieldErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      fieldErrors.email = 'Please enter a valid email address';
    }

    // Validate Password
    if (!password || typeof password !== 'string') {
      fieldErrors.password = 'Password is required';
    } else if (password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters long';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({ fieldErrors });
      return;
    }

    // Check duplicate email
    const existing = await UserRepository.findByEmail(email.trim());
    if (existing) {
      res.status(400).json({
        fieldErrors: {
          email: 'An account with this email address already exists',
        },
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (Public signup ALWAYS creates role 'user', never admin)
    const newUser = await UserRepository.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: 'user',
      mustChangePassword: false,
    });

    // Sign JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mustChangePassword: Boolean(newUser.mustChangePassword),
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Signup error]:', error);
    res.status(500).json({ message: 'Server error creating account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    const fieldErrors: Record<string, string> = {};

    // Validate fields
    if (!email || typeof email !== 'string' || !email.trim()) {
      fieldErrors.email = 'Email address is required';
    }

    if (!password || typeof password !== 'string') {
      fieldErrors.password = 'Password is required';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({ fieldErrors });
      return;
    }

    // Check user existence
    const user = await UserRepository.findByEmail(email.trim());
    if (!user) {
      res.status(400).json({
        fieldErrors: {
          email: 'No account found with this email address',
        },
      });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        fieldErrors: {
          password: 'Incorrect password. Please try again.',
        },
      });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: Boolean(user.mustChangePassword),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Login error]:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me (Protected Route)
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: Boolean(user.mustChangePassword),
      createdAt: user.createdAt,
    },
    databaseStatus: isDbConnected() ? 'connected_mongodb' : 'memory_fallback',
    databaseName: getConnectedDbName(),
    collectionName: 'users',
  });
});

// GET /api/auth/profile (Protected Route)
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    // Fetch user-centric analytics safely using repositories
    const subjectsCount = await SubjectRepository.countForUser(userId);
    const userSubjectsCreated = await SubjectRepository.countCreatedByUser(userId);

    const totalLectures = await LectureRepository.countTotal();
    const lecturesCompleted = await ProgressRepository.countCompleted(userId, 'lecture');

    const totalProblems = await ProblemRepository.countTotal();
    const problemsSolved = await ProgressRepository.countCompleted(userId, 'problem');

    const eventsCount = await EventRepository.countForUser(userId);

    // Compute readiness score
    const lectureRate = totalLectures > 0 ? (lecturesCompleted / totalLectures) * 50 : 0;
    const problemRate = totalProblems > 0 ? (problemsSolved / totalProblems) * 50 : 0;
    const overallReadinessPercent = Math.min(100, Math.round(lectureRate + problemRate));

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: Boolean(user.mustChangePassword),
        createdAt: user.createdAt,
      },
      stats: {
        subjectsCount,
        userSubjectsCreated,
        totalLectures,
        lecturesCompleted,
        totalProblems,
        problemsSolved,
        eventsCount,
        overallReadinessPercent,
      },
    });
  } catch (error) {
    console.error('[Profile fetch error]:', error);
    res.status(500).json({ message: 'Server error retrieving user profile' });
  }
});

// PUT /api/auth/profile (Update Name and/or Password)
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, currentPassword, newPassword } = req.body || {};
    const fieldErrors: Record<string, string> = {};

    let updatedName = user.name;
    let updatedPasswordHash: string | undefined = undefined;

    // Validate Name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        fieldErrors.name = 'Full name cannot be empty';
      } else if (name.trim().length < 2) {
        fieldErrors.name = 'Full name must be at least 2 characters';
      } else {
        updatedName = name.trim();
      }
    }

    // Validate Password update if requested
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        fieldErrors.currentPassword = 'Current password is required to set a new password';
      } else {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          fieldErrors.currentPassword = 'Current password is incorrect';
        }
      }

      if (!newPassword || typeof newPassword !== 'string') {
        fieldErrors.newPassword = 'New password is required';
      } else if (newPassword.length < 6) {
        fieldErrors.newPassword = 'New password must be at least 6 characters';
      } else {
        updatedPasswordHash = await bcrypt.hash(newPassword, 10);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({ fieldErrors });
      return;
    }

    const updated = await UserRepository.update(user.id, {
      name: updatedName,
      password: updatedPasswordHash,
    });

    if (!updated) {
      res.status(404).json({ message: 'User not found to update' });
      return;
    }

    res.status(200).json({
      message: 'Profile successfully updated',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        mustChangePassword: Boolean(updated.mustChangePassword),
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('[Profile update error]:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// POST /api/auth/change-first-password
// Enforces that new admins provisioned with a temporary password set their own secure password
router.post('/change-first-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body || {};
    const fieldErrors: Record<string, string> = {};

    if (!currentPassword || typeof currentPassword !== 'string') {
      fieldErrors.currentPassword = 'Temporary or current password is required';
    } else {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        fieldErrors.currentPassword = 'The temporary password provided is incorrect';
      }
    }

    if (!newPassword || typeof newPassword !== 'string') {
      fieldErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      fieldErrors.newPassword = 'New password must be at least 6 characters';
    } else if (currentPassword && newPassword === currentPassword) {
      fieldErrors.newPassword = 'New password cannot be identical to the temporary password';
    }

    if (Object.keys(fieldErrors).length > 0) {
      res.status(400).json({ fieldErrors });
      return;
    }

    const newHashed = await bcrypt.hash(newPassword, 10);
    const updated = await UserRepository.update(user.id, {
      password: newHashed,
      mustChangePassword: false,
    });

    if (!updated) {
      res.status(404).json({ message: 'User account not found' });
      return;
    }

    await AuditLogRepository.log({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      action: 'first_login_password_changed',
      targetUserId: user.id,
      targetEmail: user.email,
      details: `User ${user.name} (${user.email}) changed their initial temporary password.`,
    });

    // Sign a fresh token with updated claims
    const token = jwt.sign(
      { userId: updated.id, email: updated.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Password successfully updated. Temporary password requirement resolved.',
      token,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        mustChangePassword: false,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error('[Change first password error]:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

export default router;
