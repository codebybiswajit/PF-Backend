import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { JwtPayload } from '../types';

const router = Router();

// ─── Helper: strip passwordHash from user object ──────────────────────────────

function sanitizeUser(user: any) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
}

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────

function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// ─── POST /register ───────────────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      title,
      phone,
      linkedin,
      github,
      skills,
      summary,
      education,
      experience,
      projects,
    } = req.body as {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      title?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      skills?: string;
      summary?: string;
      education?: any[];
      experience?: any[];
      projects?: any[];
    };

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        message: 'firstName, lastName, email, and password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: 'An account with that email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique portfolioSlug
    const slugBase = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const portfolioSlug = `${slugBase}-${randomSuffix}`;

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      title,
      phone,
      linkedin,
      github,
      skills,
      summary,
      education: education ?? [],
      experience: experience ?? [],
      projects: projects ?? [],
      portfolioSlug,
    });

    const token = signToken({ userId: String(user._id), email: user.email });

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('[POST /auth/register]', err);
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Backfill missing portfolioSlug on login if not already present
    if (!user.portfolioSlug) {
      const slugBase = `${user.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${user.lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      user.portfolioSlug = `${slugBase}-${randomSuffix}`;
      await user.save();
    }

    const token = signToken({ userId: String(user._id), email: user.email });

    res.status(200).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('[POST /auth/login]', err);
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
});

// ─── GET /me (protected) ──────────────────────────────────────────────────────

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await User.findById(authReq.userId).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({ user });
  } catch (err: any) {
    console.error('[GET /auth/me]', err);
    res.status(500).json({ message: 'Server error fetching user.', error: err.message });
  }
});

// ─── POST /chat (protected) ──────────────────────────────────────────────────

router.post('/chat', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as { messages: any[] };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ message: 'messages array is required.' });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: 'Groq API key is not configured on the server.' });
      return;
    }

    const fetchFn = (globalThis as any).fetch;
    if (!fetchFn) {
      res.status(500).json({ message: 'Node.js global fetch is not available in this environment.' });
      return;
    }

    const response = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Groq API Error]', errText);
      res.status(response.status).json({
        message: 'Error communicating with Groq API.',
        error: errText,
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err: any) {
    console.error('[POST /auth/chat]', err);
    res.status(500).json({ message: 'Server error during chat.', error: err.message });
  }
});

export default router;
