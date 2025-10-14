
import React, { useMemo, useState } from 'react';
import Button from './ui/Button';
import { type UserResponse } from '../types';

interface CompletionScreenProps {
  onLogout: () => void;
  userResponse: UserResponse;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onLogout, userResponse }) => {
  const [copied, setCopied] = useState(false);

  const responseCode = useMemo(() => {
    try {
      const jsonString = JSON.stringify(userResponse);
      return btoa(jsonString); // Encode to Base64
    } catch (e) {
      console.error("Failed to generate response code:", e);
      return "Erro ao gerar o código.";
    }
  }, [userResponse]);

  const handleCopy = () => {
    navigator.clipboard.writeText(responseCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="text-center transition-opacity duration-300 py-8">
      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-800">Questionário Finalizado!</h1>
      <p className="mt-2 text-gray-600 mb-6 max-w-lg mx-auto">
        Sua participação foi registrada. Por favor, copie o código abaixo e envie-o para o administrador.
      </p>

      <div className="mb-6">
        <textarea
          readOnly
          value={responseCode}
          className="w-full h-32 p-3 font-mono text-xs text-gray-700 bg-gray-100 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Código de Resposta"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button onClick={handleCopy} size="lg" variant="success">
          {copied ? 'Copiado!' : 'Copiar Código'}
        </Button>
        <Button onClick={onLogout} size="lg" variant="secondary">
          Sair
        </Button>
      </div>
    </div>
  );
};

export default CompletionScreen;