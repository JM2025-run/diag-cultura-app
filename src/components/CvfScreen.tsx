import React, { useState, useMemo } from 'react';
import { CVF_QUESTIONS } from '../constants';
import { type Scores, type Quadrant } from '../types';
import Button from './ui/Button';

interface CvfScreenProps {
  onSubmit: (scores: Scores) => void;
}

type Answers = Record<number, Record<Quadrant, number>>;

const CvfScreen: React.FC<CvfScreenProps> = ({ onSubmit }) => {
  const [answers, setAnswers] = useState<Answers>(() => {
    const initial: Answers = {};
    CVF_QUESTIONS.forEach((_, index) => {
      initial[index] = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    });
    return initial;
  });
  const [error, setError] = useState<string>('');

  const totals = useMemo(() => {
    return Object.keys(answers).map(key => {
        const index = parseInt(key, 10);
        return Object.values(answers[index]).reduce((sum, val) => sum + Number(val), 0);
    });
  }, [answers]);

  const handleInputChange = (questionIndex: number, quadrant: Quadrant, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        [quadrant]: Math.max(0, Math.min(100, numValue)),
      },
    }));
  };

  const handleSubmit = () => {
    const allValid = totals.every(total => total === 100);
    if (!allValid) {
      setError('A soma de cada categoria deve ser exatamente 100 pontos.');
      return;
    }
    setError('');

    const finalScores: Scores = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    Object.values(answers).forEach(questionAnswers => {
      (Object.keys(questionAnswers) as Quadrant[]).forEach(quadrant => {
        finalScores[quadrant] += questionAnswers[quadrant];
      });
    });

    const numQuestions = CVF_QUESTIONS.length;
    (Object.keys(finalScores) as Quadrant[]).forEach(quadrant => {
      finalScores[quadrant] /= numQuestions;
    });

    onSubmit(finalScores);
  };

  return (
    <div className="transition-opacity duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Questionário de Cultura Organizacional (CVF)</h2>
      <p className="text-gray-600 mb-6">Distribua <strong>100 pontos</strong> entre as quatro opções para cada categoria, de acordo com o que melhor descreve sua empresa.</p>
      <div className="space-y-6">
        {CVF_QUESTIONS.map((q, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">{index + 1}. {q.title}</h4>
            <div className="space-y-2">
              {q.options.map(option => (
                <div key={option.value} className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={answers[index][option.value]}
                    onChange={(e) => handleInputChange(index, option.value, e.target.value)}
                    className="w-20 px-2 py-1 border rounded-md text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                  />
                  <label className="text-sm text-gray-700">{option.label}</label>
                </div>
              ))}
            </div>
            <div className={`text-right mt-2 font-bold ${totals[index] === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totals[index]} / 100
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="flex justify-end mt-6">
        <Button onClick={handleSubmit}>Próxima Etapa</Button>
      </div>
    </div>
  );
};

export default CvfScreen;