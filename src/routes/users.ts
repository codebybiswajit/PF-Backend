import { Router, Request, Response } from "express";
import User from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── PUT /:id/profile (protected) ────────────────────────────────────────────

router.put(
  "/:id/profile",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;

      // Ensure the authenticated user can only update their own profile
      if (authReq.userId !== id) {
        res.status(403).json({
          message: "Forbidden: You can only update your own profile.",
        });
        return;
      }

      // Extract allowed fields — email and password changes are not permitted here
      const {
        firstName,
        lastName,
        title,
        phone,
        linkedin,
        github,
        skills,
        summary,
        education,
        experience,
        projects,
        portfolioSlug,
      } = req.body as {
        firstName?: string;
        lastName?: string;
        title?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        skills?: string;
        summary?: string;
        education?: any[];
        experience?: any[];
        projects?: any[];
        portfolioSlug?: string;
      };

      // Build update object with only defined fields
      const updateFields: Record<string, unknown> = {};
      if (firstName !== undefined) updateFields.firstName = firstName;
      if (lastName !== undefined) updateFields.lastName = lastName;
      if (title !== undefined) updateFields.title = title;
      if (phone !== undefined) updateFields.phone = phone;
      if (linkedin !== undefined) updateFields.linkedin = linkedin;
      if (github !== undefined) updateFields.github = github;
      if (skills !== undefined) updateFields.skills = skills;
      if (summary !== undefined) updateFields.summary = summary;
      if (education !== undefined) updateFields.education = education;
      if (experience !== undefined) updateFields.experience = experience;
      if (projects !== undefined) updateFields.projects = projects;

      if (portfolioSlug !== undefined) {
        const cleanSlug = portfolioSlug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
        if (!cleanSlug) {
          res.status(400).json({ message: "Portfolio URL slug cannot be empty." });
          return;
        }

        const duplicate = await User.findOne({ portfolioSlug: cleanSlug, _id: { $ne: id } });
        if (duplicate) {
          res.status(409).json({ message: "This custom URL is already in use by another user." });
          return;
        }
        updateFields.portfolioSlug = cleanSlug;
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true },
      ).select("-passwordHash");

      if (!updatedUser) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      res.status(200).json({ user: updatedUser });
    } catch (err: any) {
      console.error("[PUT /users/:id/profile]", err);
      res.status(500).json({
        message: "Server error updating profile.",
        error: err.message,
      });
    }
  },
);

// ─── GET /:id/resume (public) ─────────────────────────────────────────────────

router.get(
  "/:id/resume",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-passwordHash");

      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }

      res.status(200).json({ user });
    } catch (err: any) {
      console.error("[GET /users/:id/resume]", err);
      res.status(500).json({
        message: "Server error fetching resume data.",
        error: err.message,
      });
    }
  },
);

// ─── GET /public/:slug (public deep-linking lookup) ───────────────────────────

router.get(
  "/public/:slug",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const slugStr = typeof slug === 'string' ? slug : String(slug);

      const user = await User.findOne({ portfolioSlug: slugStr.toLowerCase().trim() }).select("-passwordHash");

      if (!user) {
        res.status(404).json({ message: "Portfolio not found." });
        return;
      }

      res.status(200).json({ user });
    } catch (err: any) {
      console.error("[GET /users/public/:slug]", err);
      res.status(500).json({
        message: "Server error fetching portfolio data.",
        error: err.message,
      });
    }
  },
);
// ─── GET / (public) ────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (err: any) {
    console.error("[GET /users]", err);
    res
      .status(500)
      .json({ message: "Server error fetching users.", error: err.message });
  }
});

export default router;
