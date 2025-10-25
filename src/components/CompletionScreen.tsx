import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import { type UserResponse } from '../types';
import { authService } from '../auth/authService';

interface CompletionScreenProps {
  userResponse: Omit<UserResponse, 'id' | 'username'>;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ userResponse }) => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const saveResponse = async () => {
      try {
        await authService.saveUserResponse(userResponse);
        setSaveStatus('saved');
      } catch (error) {
        console.error("Failed to save response:", error);
        if (error instanceof Error) {
            setErrorMessage(error.message);
        } else {
            setErrorMessage("Ocorreu um erro desconhecido ao salvar.");
        }
        setSaveStatus('error');
      } finally {
        // Use a small delay to make the transition smoother if saving is too fast
        setTimeout(() => setShowLogout(true), 500);
      }
    };
    saveResponse();
  }, [userResponse]);


  const handleLogout = async () => {
    await authService.logout();
    window.location.reload(); // Reload the page to reset the app state
  }

  return (
    <div className="text-center transition-opacity duration-300 py-8">
      {saveStatus === 'saved' && (
        <>
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-800">Questionário Finalizado!</h1>
            <p className="mt-2 text-gray-600 mb-6 max-w-lg mx-auto">
                Obrigado pela sua participação! Sua resposta foi registrada com sucesso.
            </p>
        </>
      )}

      {saveStatus === 'saving' && (
        <>
            <div className="flex justify-center items-center mb-4">
              <svg className="animate-spin h-12 w-12 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">Salvando sua resposta...</h1>
            <p className="mt-2 text-gray-600 mb-6 max-w-lg mx-auto">
                Por favor, aguarde um momento.
            </p>
        </>
      )}

      {saveStatus === 'error' && (
         <>
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-800">Erro ao Salvar</h1>
            <p className="mt-2 text-gray-600 mb-6 max-w-lg mx-auto">
                {errorMessage || 'Não foi possível registrar sua resposta. Por favor, verifique sua conexão com a internet e tente novamente ou contate o administrador.'}
            </p>
        </>
      )}
      
      {showLogout && (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Button onClick={handleLogout} size="lg" variant="secondary">
            Sair
            </Button>
        </div>
      )}
    </div>
  );
};

export default CompletionScreen;
