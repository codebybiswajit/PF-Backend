import mongoose, { Document, Schema } from 'mongoose';
const ResumeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    title: { type: String, required: true },
    contact: {
      email:String,
      phone: String,
      location: String,
      website: String,
      linkedin: String,
      github: String,
      twitter: String
    },
    summary: { type: String, required: true },
    skillGroups: [
      { name: String, skills: [String] },
    ],
    education: [
      {
        degree: String,
        field: String,
        institution: String,
        location: String,
        start: String,
        end: String,
        gpa: String,
        honors: String,
        courses: [String]
      }
    ],
    experience: [
      {
        title: String,
        company: String,
        start: String,
        end: String,
        desc: String
      }
    ],
    projects: [
      {
        name: String,
        tech: String,
        desc: String,
        url: String
      }
    ],
    profilePhoto: String,
    tagline: String,
    certifications: [
      {
        name: String,
        issuer: String,
        date: String
      }
    ],
    languages: [
      {
        language: String,
        proficiency: String
      }
    ],
    interests: [String],
    openToWork: Boolean,
    availableFrom: String,
    portfolioSlug: { type: String, unique: true, sparse: true }
  },
  { timestamps: true }
);

export default mongoose.model('PFResume', ResumeSchema,'PFResume');