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
    institution: { type: String, required: true, trim: true },
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true },
    gpa: { type: String, trim: true },
  },
  { _id: true },
);

const ExperienceSchema = new Schema<IExperienceDocument>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    tech: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
  },
  { _id: true },
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
    skills: { type: String, trim: true },
    summary: { type: String, trim: true },
    education: { type: [EducationSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
  },
  {
    timestamps: true,
  },
);

export default model<IUserDocument>("PFUsers", UserSchema, "PFUsers");
