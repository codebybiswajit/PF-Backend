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
