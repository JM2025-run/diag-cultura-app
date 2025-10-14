

import React, { useState } from 'react';
import { CVCQ_QUESTIONS } from '../constants';
import { type Scores, type Quadrant } from '../types';
import Button from './ui/Button';

interface CvcqScreenProps {
  onSubmit: (scores: Scores) => void;
}

type Answers = Record<number, number | null>;

const CvcqScreen: React.FC<CvcqScreenProps> = ({ onSubmit }) => {
  const [answers, setAnswers] = useState<Answers>(() => {
    const initial: Answers = {};
    CVCQ_QUESTIONS.forEach((_, index) => {
      initial[index] = null;
    });
    return initial;
  });
  const [error, setError] = useState<string>('');

  const handleRadioChange = (questionIndex: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = () => {
    const allAnswered = Object.values(answers).every(val => val !== null);
    if (!allAnswered) {
      setError('Por favor, responda a todas as perguntas antes de continuar.');
      return;
    }
    setError('');

    const quadrantScores: Record<Quadrant, number[]> = { Clan: [], Adhocracy: [], Market: [], Hierarchy: [] };

    CVCQ_QUESTIONS.forEach((q, index) => {
      const answer = answers[index];
      if (answer !== null) {
        quadrantScores[q.quadrant].push(answer);
      }
    });

    const finalScores: Scores = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    (Object.keys(quadrantScores) as Quadrant[]).forEach(quadrant => {
      const scores = quadrantScores[quadrant];
      const sum = scores.reduce((a, b) => a + b, 0);
      finalScores[quadrant] = scores.length > 0 ? sum / scores.length : 0;
    });

    onSubmit(finalScores);
  };

  return (
    <div className="transition-opacity duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Questionário de Competências de Liderança (CVCQ)</h2>
      <p className="text-gray-600 mb-6">Avalie a sua competência como líder em cada um dos papéis, usando uma escala de <strong>1 (Baixa Competência) a 7 (Alta Competência)</strong>.</p>
      <div className="space-y-6">
        {CVCQ_QUESTIONS.map((q, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-1">Papel: {q.role}</h4>
            <p className="text-sm text-gray-600 mb-3">{q.label}</p>
            <div className="flex items-center justify-between space-x-2">
              <span className="text-sm text-gray-500 hidden sm:inline">1 (Baixa)</span>
              <div className="flex-grow flex justify-between max-w-sm mx-auto">
                {Array.from({ length: 7 }, (_, i) => i + 1).map(val => (
                  <label key={val} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`cvcq-q${index}`}
                      value={val}
                      checked={answers[index] === val}
                      onChange={() => handleRadioChange(index, val)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm font-semibold transition-colors duration-200 hover:bg-gray-200 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600">
                      {val}
                    </div>
                  </label>
                ))}
              </div>
              <span className="text-sm text-gray-500 hidden sm:inline">7 (Alta)</span>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSubmit}>Ver Resultados</Button>
      </div>
    </div>
  );
};

export default CvcqScreen;