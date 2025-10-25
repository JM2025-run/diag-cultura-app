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
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: details.fullName,
        position: details.position,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user details:', error);
      // Check for a specific RLS error to provide a more targeted message
      if (error.code === '42501' || error.message.includes('row level security')) {
         throw new Error('Não foi possível salvar: Permissão negada pela política de segurança (RLS) do banco de dados. Por favor, contate o administrador para aplicar as permissões corretas.');
      }
      throw new Error(`Erro ao salvar perfil: ${error.message}`);
    }


    // Refetch user to get updated state
    return await authService.getCurrentUser();
  },

  saveUserResponse: async (response: Omit<UserResponse, 'id' | 'username'>): Promise<void> => {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new Error("Usuário não autenticado");

    const responseData = {
        user_id: response.user_id,
        username: currentUser.email,
        full_name: response.fullName,
        position: response.position,
        cvf_scores: response.cvfScores,
        cvcq_scores: response.cvcqScores,
    };

    // 1. Verifique se já existe uma resposta para este usuário
    const { data: existingResponse, error: selectError } = await supabase
        .from('responses')
        .select('id')
        .eq('user_id', response.user_id)
        .maybeSingle();

    if (selectError) {
        console.error('Erro ao verificar resposta existente:', selectError.message);
        throw new Error(`Erro ao verificar resposta existente: ${selectError.message}`);
    }

    let error;

    if (existingResponse) {
        // 2. Se existir, atualize-a
        const { error: updateError } = await supabase
            .from('responses')
            .update(responseData)
            .eq('user_id', response.user_id);
        error = updateError;
    } else {
        // 3. Se não existir, insira uma nova
        const { error: insertError } = await supabase
            .from('responses')
            .insert(responseData);
        error = insertError;
    }

    if (error) {
      console.error('Erro ao salvar resposta do usuário:', error.message);
       // Verifica um erro específico de RLS para fornecer uma mensagem mais direcionada
      if (error.code === '42501' || error.message.includes('row level security')) {
         throw new Error('Não foi possível salvar: Permissão negada pela política de segurança (RLS). Verifique se as permissões de INSERT e UPDATE estão habilitadas para a tabela de respostas.');
      }
      throw new Error(`Erro ao salvar resposta: ${error.message}`);
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

    // Mapeia os campos do BD (ex: full_name) para campos camelCase (ex: fullName)
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

  deleteUserResponse: async (responseId: number): Promise<void> => {
    const { error } = await supabase
      .from('responses')
      .delete()
      .eq('id', responseId);

    if (error) {
      console.error('Error deleting response:', error.message);
      if (error.code === '42501' || error.message.includes('row level security')) {
        throw new Error('Permissão negada: Verifique se a política de segurança (RLS) para exclusão (DELETE) está habilitada para administradores na tabela de respostas.');
      }
      throw new Error(`Erro ao excluir resposta: ${error.message}`);
    }
  },
};