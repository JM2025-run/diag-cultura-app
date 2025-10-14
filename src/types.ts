
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
  username: string;
  role: 'ADMIN' | 'USER';
  fullName?: string;
  position?: string;
}

export interface UserDetails {
  fullName: string;
  position: string;
}

export interface UserResponse {
  username: string;
  fullName: string;
  position: string;
  cvfScores: Scores;
  cvcqScores: Scores;
}