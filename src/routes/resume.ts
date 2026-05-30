import { Router, Request, Response } from 'express';
import Resume from '../models/Resume';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// ─── GET /api/resume (Public or Authenticated) ──────────────────────────────
// If authenticated: get own resume
// If not authenticated: get public resume (via portfolioSlug or userId from query)

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    let resume;

    if (authReq.userId) {
      // Authenticated user - get their own resume
      resume = await Resume.findOne({ userId: authReq.userId });
      if (!resume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
      }
    } else {
      // Public access - get via portfolioSlug or userId from query
      const { slug, userId } = req.query;

      if (slug) {
        resume = await Resume.findOne({ portfolioSlug: slug });
      } else if (userId) {
        resume = await Resume.findOne({ userId });
      } else {
        res.status(400).json({ message: 'Please provide slug or userId' });
        return;
      }

      if (!resume) {
        res.status(404).json({ message: 'Resume not found' });
        return;
      }
    }

    res.status(200).json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/resume (Protected) ───────────────────────────────────────────
// Create or update resume - only for authenticated users

router.post('/api/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { userId } = authReq;
    const resumeData = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Find existing resume or create new one
    let resume = await Resume.findOne({ userId });

    if (resume) {
      // Update existing resume
      Object.assign(resume, resumeData);
      await resume.save();
      res.status(200).json({ message: 'Resume updated successfully', resume });
    } else {
      // Create new resume
      resume = new Resume({
        userId,
        ...resumeData
      });
      await resume.save();
      res.status(201).json({ message: 'Resume created successfully', resume });
    }
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
