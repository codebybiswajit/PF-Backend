import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const router = Router();

// ─── GET /api/resume (Public or Authenticated) ──────────────────────────────
// If authenticated: get own resume
// If not authenticated: get public resume (via portfolioSlug or userId from query)

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let userId: string | undefined;

    // Check if authenticated (via optional Bearer token in request header)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (token && secret) {
        try {
          const decoded = jwt.verify(token, secret) as JwtPayload;
          userId = decoded.userId;
        } catch (e) {
          // Token invalid or expired; fallback to public query parameters
        }
      }
    }

    const { slug, userId: queryUserId } = req.query;

    let user;
    if (userId) {
      // Authenticated user - get their own profile
      user = await User.findById(userId).select('-passwordHash');
    } else if (slug) {
      // Public slug lookup
      user = await User.findOne({ portfolioSlug: String(slug).toLowerCase().trim() }).select('-passwordHash');
    } else if (queryUserId) {
      // Public userId query lookup
      user = await User.findById(String(queryUserId)).select('-passwordHash');
    } else {
      res.status(400).json({ message: 'Please provide slug or userId, or authenticate' });
      return;
    }

    if (!user) {
      res.status(404).json({ message: 'Resume profile not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/resume (Public / Authenticated) ─────────────────────────────
// Create or update resume
// Optional authentication: can be updated via userId in request, JWT token, or contact email lookup

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const resumeData = req.body;
    let targetUserId = req.body.userId;

    // Fallback: check JWT token in Authorization header
    if (!targetUserId) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (token && secret) {
          try {
            const decoded = jwt.verify(token, secret) as JwtPayload;
            targetUserId = decoded.userId;
          } catch (e) {
            // Token invalid or expired
          }
        }
      }
    }

    let user;
    if (targetUserId) {
      user = await User.findById(targetUserId);
    }

    const contactEmail = resumeData.contact?.email || resumeData.email || 'founder@example.com';

    if (!user && contactEmail) {
      // Find user by contact email to support passwordless updates
      user = await User.findOne({ email: contactEmail.toLowerCase().trim() });
    }

    if (!user) {
      // First-time creation: Create new User document for founder/resume
      user = new User({
        firstName: resumeData.firstName || 'Founder',
        lastName: resumeData.lastName || 'User',
        email: contactEmail.toLowerCase().trim(),
        passwordHash: '$2b$10$founderdefaultpasswordhashplaceholder', // secure dummy hash
      });
    }

    // Save/Update the rich resume fields directly on the User model
    user.firstName = resumeData.firstName || user.firstName;
    user.lastName = resumeData.lastName || user.lastName;
    user.title = resumeData.title || user.title;
    user.tagline = resumeData.tagline || user.tagline;
    user.summary = resumeData.summary || user.summary;
    user.contact = resumeData.contact || user.contact;
    user.openToWork = resumeData.openToWork !== undefined ? resumeData.openToWork : user.openToWork;
    user.availableFrom = resumeData.availableFrom || user.availableFrom;
    user.interests = resumeData.interests || user.interests;
    user.skillGroups = resumeData.skillGroups || user.skillGroups;
    user.languages = resumeData.languages || user.languages;
    user.certifications = resumeData.certifications || user.certifications;
    user.education = resumeData.education || user.education;
    user.experience = resumeData.experience || user.experience;
    user.projects = resumeData.projects || user.projects;

    // Sync legacy/flat fields for maximum backwards compatibility:
    if (resumeData.contact) {
      if (resumeData.contact.phone !== undefined) user.phone = resumeData.contact.phone;
      if (resumeData.contact.linkedin !== undefined) user.linkedin = resumeData.contact.linkedin;
      if (resumeData.contact.github !== undefined) user.github = resumeData.contact.github;
      if (resumeData.contact.location !== undefined) user.location = resumeData.contact.location;
      if (resumeData.contact.website !== undefined) user.website = resumeData.contact.website;
      if (resumeData.contact.twitter !== undefined) user.twitter = resumeData.contact.twitter;
    }

    if (resumeData.skillGroups && Array.isArray(resumeData.skillGroups)) {
      // Flatten all skills into the single skills string
      const flatSkills = resumeData.skillGroups
        .flatMap((g: any) => g.skills || [])
        .filter(Boolean)
        .join(', ');
      user.skills = flatSkills;
    }

    // Auto-generate portfolio URL slug if not configured
    if (!user.portfolioSlug) {
      const cleanFirst = (user.firstName || 'founder').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = (user.lastName || 'portfolio').toLowerCase().replace(/[^a-z0-9]/g, '');
      user.portfolioSlug = `${cleanFirst}-${cleanLast}`;
    }

    await user.save();

    res.status(200).json({ message: 'Resume saved successfully', resume: user });
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
