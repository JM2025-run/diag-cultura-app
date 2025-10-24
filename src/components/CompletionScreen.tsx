import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import { type UserResponse } from '../types';
import { authService } from '../auth/authService';

interface CompletionScreenProps {
  onLogout: () => void;
  userResponse: Omit<UserResponse, 'id' | 'username'>;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onLogout, userResponse }) => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
      }
    };
    saveResponse();
  }, [userResponse]);


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
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-800">Salvando sua resposta...</h1>
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
      
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button onClick={onLogout} size="lg" variant="secondary">
          Sair
        </Button>
      </div>
    </div>
  );
};

export default CompletionScreen;