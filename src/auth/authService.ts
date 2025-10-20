import { supabase } from '../services/supabaseClient';
import { type User, type UserDetails, type UserResponse } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return null;
    }

    if (data.user) {
      // After login, fetch profile to get role and details
      return await authService.getCurrentUser();
    }
    
    return null;
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }

    const { user: authUser } = session;

    // Fetch user profile from 'profiles' table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, full_name, position')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error.message);
      // Still return basic user info if profile fetch fails
      return {
        id: authUser.id,
        email: authUser.email || '',
        role: 'USER', // default role
      };
    }
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      role: profile.role,
      fullName: profile.full_name,
      position: profile.position,
    };
  },

  saveUserDetails: async (userId: string, details: UserDetails): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: details.fullName,
        position: details.position,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user details:', error.message);
    }

    // Refetch user to get updated state
    return await authService.getCurrentUser();
  },

  saveUserResponse: async (response: Omit<UserResponse, 'id'>): Promise<void> => {
    const { error } = await supabase.from('responses').insert({
      user_id: response.user_id,
      username: response.username,
      full_name: response.fullName,
      position: response.position,
      cvf_scores: response.cvfScores,
      cvcq_scores: response.cvcqScores,
    });

    if (error) {
      console.error('Error saving user response:', error.message);
      throw new Error('Failed to save user response.');
    }
  },

  getAllResponses: async (): Promise<UserResponse[]> => {
    const { data, error } = await supabase
      .from('responses')
      .select('*');

    if (error) {
      console.error('Error fetching all responses:', error.message);
      return [];
    }

    // Map DB fields (e.g., full_name) to camelCase fields (e.g., fullName)
    return data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        username: item.username,
        fullName: item.full_name,
        position: item.position,
        cvfScores: item.cvf_scores,
        cvcqScores: item.cvcq_scores,
    }));
  },
};