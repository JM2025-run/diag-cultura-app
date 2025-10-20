export type Quadrant = 'Clan' | 'Adhocracy' | 'Market' | 'Hierarchy';

export interface CvfQuestion {
  title: string;
  options: {
    label: string;
    value: Quadrant;
  }[];
}

export interface CvcqQuestion {
  role: string;
  quadrant: Quadrant;
  label: string;
}

export interface Scores {
  Clan: number;
  Adhocracy: number;
  Market: number;
  Hierarchy: number;
}

export interface User {
  id: string; // Supabase user ID (UUID)
  email: string;
  role: 'ADMIN' | 'USER';
  fullName?: string;
  position?: string;
}

export interface UserDetails {
  fullName: string;
  position: string;
}

export interface UserResponse {
  id?: number; // DB primary key
  user_id: string; // Foreign key to user
  username: string; // User's email for display
  fullName: string;
  position: string;
  cvfScores: Scores;
  cvcqScores: Scores;
}