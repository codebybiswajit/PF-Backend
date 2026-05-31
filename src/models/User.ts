import { Schema, model, Document } from "mongoose";
import { IUser, IEducation, IExperience, IProject } from "../types";

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IEducationDocument extends IEducation, Document {}
export interface IExperienceDocument extends IExperience, Document {}
export interface IProjectDocument extends IProject, Document {}
export interface IUserDocument extends Omit<IUser, "_id">, Document {}

// ─── Sub-document schemas ─────────────────────────────────────────────────────

const EducationSchema = new Schema<IEducationDocument>(
  {
    degree: { type: String, required: true, trim: true },
    field: { type: String, trim: true },
    institution: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true },
    gpa: { type: String, trim: true },
    honors: { type: String, trim: true },
    courses: { type: [String], default: [] },
  },
  { _id: true },
);

const ExperienceSchema = new Schema<IExperienceDocument>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    type: { type: String, trim: true },
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true },
    desc: { type: String, trim: true },
    summary: { type: String, trim: true },
    bullets: { type: [String], default: [] },
    tech: { type: [String], default: [] },
  },
  { _id: true },
);

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    tech: { type: Schema.Types.Mixed, required: true },
    desc: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
    repo: { type: String, trim: true },
    highlights: { type: [String], default: [] },
  },
  { _id: true },
);

const ContactSchema = new Schema(
  {
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    twitter: { type: String, trim: true },
  },
  { _id: false }
);

const SkillGroupSchema = new Schema(
  {
    category: { type: String, trim: true },
    name: { type: String, trim: true },
    icon: { type: String, trim: true },
    skills: { type: [String], default: [] },
  },
  { _id: false }
);

const LanguageSchema = new Schema(
  {
    language: { type: String, trim: true },
    proficiency: { type: String, trim: true },
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, trim: true },
    issuer: { type: String, trim: true },
    date: { type: String, trim: true },
    credentialId: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

// ─── Main User schema ─────────────────────────────────────────────────────────

const UserSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    title: { type: String, trim: true },
    phone: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    twitter: { type: String, trim: true },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    skills: { type: String, trim: true },
    summary: { type: String, trim: true },
    education: { type: [EducationSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    portfolioSlug: { type: String, unique: true, sparse: true, trim: true },

    // Rich resume integrations
    tagline: { type: String, trim: true },
    profilePhoto: { type: String, trim: true },
    contact: { type: ContactSchema },
    skillGroups: { type: [SkillGroupSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    languages: { type: [LanguageSchema], default: [] },
    interests: { type: [String], default: [] },
    openToWork: { type: Boolean, default: false },
    availableFrom: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

export default model<IUserDocument>("PFUsers", UserSchema, "PFUsers");
