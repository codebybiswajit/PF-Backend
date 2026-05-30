export interface IEducation {
  degree: string;
  institution: string;
  start: string;
  end: string;
  gpa?: string;
}

export interface IExperience {
  title: string;
  company: string;
  start: string;
  end: string;
  desc: string;
}

export interface IProject {
  name: string;
  tech: string;
  desc: string;
  url?: string;
}

export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  skills?: string;
  summary?: string;
  education: IEducation[];
  experience: IExperience[];
  projects: IProject[];
  portfolioSlug?: string;
  createdAt?: Date;
}

export interface IAuthResponse {
  token: string;
  user: Omit<IUser, 'passwordHash'>;
}

export interface JwtPayload {
  userId: string;
  email: string;
}


export interface ResumeData {
  firstName: string;
  lastName: string;
  title: string;
  contact: ResumeContact;
  summary: string;
  skillGroups: ResumeSkillGroup[];
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];

  profilePhoto?: string;
  tagline?: string;
  certifications?: ResumeCertification[];
  languages?: ResumeLanguage[];
  interests?: string[];
  openToWork?: boolean;
  availableFrom?: string;
}
export interface ResumeContact {
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export interface ResumeSkillGroup {
  category: string;
  icon?: string;
  skills: string[];
}

export interface ResumeEducation {
  degree: string;
  field?: string;
  institution: string;
  location?: string;
  start: string;
  end: string;
  gpa?: string;
  honors?: string;
  courses?: string[];
}

export interface ResumeExperience {
  title: string;
  company: string;
  location?: string;
  type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  start: string;
  end: string; // 'Present' or date string
  summary?: string;
  bullets: string[];
  tech?: string[];
}

export interface ResumeProject {
  name: string;
  tagline?: string;
  tech: string[];
  desc: string;
  url?: string;
  repo?: string;
  highlights?: string[];
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  date?: string;
  credentialId?: string;
  url?: string;
}

export interface ResumeLanguage {
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';
}