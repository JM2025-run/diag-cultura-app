

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { analyzeCvcq, analyzeCross, ConfigurationError } from '../services/geminiService';
import { type Scores, type Quadrant } from '../types';
import { QUADRANT_LABELS, QUADRANT_COLORS } from '../constants';
import Button from './ui/Button';
import LoadingSkeleton from './ui/LoadingSkeleton';
import MarkdownRenderer from './ui/MarkdownRenderer';

interface ResultsScreenProps {
  cvfScores: Scores;
  cvcqScores: Scores;
  onRestart?: () => void;
  onBack?: () => void;
  reportTitle?: string;
  consolidatedCvfAnalysis: string;
}

type Tab = 'cvcq' | 'cross';

// Component to display a prominent configuration error message.
const ConfigurationErrorDisplay: React.FC<{ message: string; onBack?: () => void }> = ({ message, onBack }) => (
    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md my-8 text-center" role="alert">
      <div className="flex flex-col items-center">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <h3 className="text-2xl font-bold mb-2">Erro de Configuração</h3>
        <p className="max-w-md">{message}</p>
        {onBack && (
          <div className="mt-6">
            <Button onClick={onBack} variant="secondary">Voltar ao Painel</Button>
          </div>
        )}
      </div>
    </div>
);


const AnalysisDisplay: React.FC<{ analysis: string; loading: boolean }> = ({ analysis, loading }) => {
  if (loading) {
    return <LoadingSkeleton />;
  }
  if (!analysis) {
    return <p className="text-gray-500 italic">A análise não pôde ser gerada ou não retornou conteúdo.</p>;
  }
  // Check if the analysis content is an error message and style it accordingly.
  if (analysis.toLowerCase().startsWith('ocorreu um erro') || analysis.toLowerCase().startsWith('erro de autenticação')) {
    return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm">
            {analysis}
        </div>
    );
  }
  return (
    <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
      <MarkdownRenderer text={analysis} />
    </div>
  );
};

const AlignmentStatusBadge: React.FC<{ analysisText: string }> = ({ analysisText }) => {
  const match = analysisText.match(/\*\*Diagnóstico de Alinhamento: (.*?)\*\*/);
  const statusText = match ? match[1].trim() : null;
  
  if (!statusText) {
    return null;
  }

  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-300'; // Fallback
  const lowerStatus = statusText.toLowerCase();

  if (lowerStatus.includes('forte alinhamento')) {
    colorClasses = 'bg-green-100 text-green-800 border-green-300';
  } else if (lowerStatus.includes('alinhamento parcial')) {
    colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else if (lowerStatus.includes('desalinhamento crítico')) {
    colorClasses = 'bg-red-100 text-red-800 border-red-300';
  }
  
  return (
    <div className={`p-4 mb-6 rounded-lg border text-center ${colorClasses} transition-all duration-300`}>
      <p className="font-bold text-lg">{statusText}</p>
    </div>
  );
};


// Custom tick for PolarAngleAxis to show quadrant name and score
const renderPolarAngleAxisTick = ({ x, y, payload }: any) => {
  const parts = payload.value.split('\n');
  const angle = Math.atan2(y - 150, x - 225) * 180 / Math.PI; // Approximate center
  
  // FIX: Explicitly define the type for textAnchor to satisfy the SVG 'text' element's 'textAnchor' property.
  let textAnchor: "middle" | "start" | "end" = "middle";
  if (angle > -10 && angle < 10) textAnchor = "start"; // Right
  if (angle > 170 || angle < -170) textAnchor = "end";   // Left

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor={textAnchor} dominantBaseline="central">
        <tspan x="0" dy="-0.6em" fontSize={12} fill="#4A5568">{parts[0]}</tspan>
        {parts[1] && <tspan x="0" dy="1.3em" fontSize={14} fontWeight="bold" fill="#374151">{parts[1]}</tspan>}
      </text>
    </g>
  );
};


const ResultsScreen: React.FC<ResultsScreenProps> = ({ cvfScores, cvcqScores, onRestart, onBack, reportTitle = "Relatório de Análise", consolidatedCvfAnalysis }) => {
  const [cvcqAnalysis, setCvcqAnalysis] = useState<string>('');
  const [crossAnalysis, setCrossAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('cvcq');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoading(true);
      setConfigError(null);
      
      try {
        const results = await Promise.allSettled([
          analyzeCvcq(cvcqScores),
          analyzeCross(cvfScores, cvcqScores)
        ]);

        const getResultValue = (result: PromiseSettledResult<string>): string => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            // A critical configuration error should halt all rendering and be displayed prominently.
            if (result.reason instanceof ConfigurationError) {
              throw result.reason;
            }
            console.error("Analysis generation failed:", result.reason);
            // For other API errors, return the message to be displayed inline.
            return result.reason instanceof Error ? result.reason.message : 'Ocorreu um erro desconhecido.';
        }

        setCvcqAnalysis(getResultValue(results[0]));
        setCrossAnalysis(getResultValue(results[1]));
        
      } catch (error) {
        if (error instanceof ConfigurationError) {
          setConfigError(error.message);
        } else {
          setConfigError("Ocorreu um erro inesperado ao carregar as análises.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [cvfScores, cvcqScores]);

  const formatChartData = (scores: Scores, dataKey: string) => {
    // FIX: Property 'toFixed' does not exist on type 'unknown'.
    // By casting Object.keys, `key` becomes a typed key of Scores, allowing safe access.
    return (Object.keys(scores) as (keyof Scores)[]).map(key => {
        const score = parseFloat(scores[key].toFixed(2));
        return {
            quadrant: `${QUADRANT_LABELS[key as keyof Scores]}\n(${score.toFixed(2)})`,
            [dataKey]: score,
        };
    });
  };

  const cvcqData = formatChartData(cvcqScores, 'score');
  
  const generateReportText = useCallback(() => {
    const cvfLabel = "Cultura Consolidada (CVF)";
    // FIX: Cast `s` to a number before calling `toFixed`, as `Object.entries` infers its type as `unknown`.
    const cvfScoresText = Object.entries(cvfScores).map(([q, s]) => `${QUADRANT_LABELS[q as keyof Scores]}: ${(s as number).toFixed(2)}`).join('; ');
    // FIX: Cast `s` to a number before calling `toFixed`, as `Object.entries` infers its type as `unknown`.
    const cvcqScoresText = Object.entries(cvcqScores).map(([q, s]) => `${QUADRANT_LABELS[q as keyof Scores]}: ${(s as number).toFixed(2)}`).join('; ');
    
    return `
Relatório de Análise Integrada de Cultura e Liderança
=====================================================

**${cvfLabel}**
-----------------------------------------
Pontuações: ${cvfScoresText}

Análise:
${consolidatedCvfAnalysis}


**Perfil de Competências de Liderança (CVCQ)**
---------------------------------------------
Pontuações: ${cvcqScoresText}

Análise:
${cvcqAnalysis}


**Análise Cruzada de Alinhamento**
-----------------------------------
${crossAnalysis}
    `.trim().replace(/ \n/g, '\n'); // Cleanup potential markdown artifacts
  }, [cvfScores, cvcqScores, consolidatedCvfAnalysis, cvcqAnalysis, crossAnalysis]);

  const handleCopyReport = useCallback(() => {
    const reportText = generateReportText();
    navigator.clipboard.writeText(reportText).then(() => {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    });
  }, [generateReportText]);

  if (configError) {
    return <ConfigurationErrorDisplay message={configError} onBack={onBack} />;
  }

  const tabBaseStyle = "px-4 py-2 font-semibold text-sm sm:text-base rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2";
  const activeTabStyle = "bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm";
  const inactiveTabStyle = "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50";
  
  const TABS: { id: Tab; label: string }[] = [
    { id: 'cvcq', label: 'Liderança (CVCQ)' },
    { id: 'cross', label: 'Análise de Alinhamento' },
  ];

  return (
    <div ref={reportRef}>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{reportTitle}</h2>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${tabBaseStyle} ${activeTab === tab.id ? activeTabStyle : inactiveTabStyle}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="transition-opacity duration-300">
        {activeTab === 'cvcq' && (
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="h-96 w-full max-w-lg mx-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={cvcqData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="quadrant" tick={renderPolarAngleAxisTick} />
                            <PolarRadiusAxis angle={30} domain={[1, 7]} tickCount={7} tick={false} axisLine={false}/>
                            <Radar name="Liderança (CVCQ)" dataKey="score" stroke={QUADRANT_COLORS.Adhocracy} fill={QUADRANT_COLORS.Adhocracy} fillOpacity={0.6} />
                            <Tooltip />
                            <Legend wrapperStyle={{fontSize: "14px", paddingTop: "24px"}}/>
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="mt-8">
                   <AnalysisDisplay analysis={cvcqAnalysis} loading={loading} />
                </div>
          </div>
        )}

        {activeTab === 'cross' && (
           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              { !loading && crossAnalysis && <AlignmentStatusBadge analysisText={crossAnalysis} />}
              <AnalysisDisplay analysis={crossAnalysis} loading={loading} />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
        {onBack ? (
          <Button onClick={onBack} variant="secondary">Voltar ao Painel</Button>
        ) : onRestart ? (
          <Button onClick={onRestart} variant="secondary">Refazer Questionário</Button>
        ) : null}
        <Button onClick={handleCopyReport} variant="success" disabled={loading}>Copiar Relatório Completo</Button>
      </div>

       {toastVisible && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded-md shadow-lg transition-transform duration-300 transform animate-bounce">
          Relatório copiado para a área de transferência!
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;