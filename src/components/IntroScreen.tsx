import React from 'react';
import Button from './ui/Button';

interface IntroScreenProps {
  onStart: () => void;
  username: string;
  fullName?: string;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart, username, fullName }) => {
  return (
    <div className="text-center transition-opacity duration-300">
      <p className="text-gray-600 mb-2">Bem-vindo(a), <span className="font-bold text-gray-800">{fullName || username}</span>!</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Análise Integrada de Cultura e Liderança</h1>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Utilize as metodologias <strong>Competing Values Framework (CVF)</strong> e <strong>Competing Values Competency Questionnaire (CVCQ)</strong> para avaliar o alinhamento entre a cultura da sua empresa e as competências de sua liderança.
      </p>
      <Button onClick={onStart} size="lg">
        Iniciar Questionário
      </Button>
    </div>
  );
};

export default IntroScreen;