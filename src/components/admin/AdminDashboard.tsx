import React, { useState, useEffect, useMemo } from 'react';
import { authService } from '../../auth/authService';
import { type UserResponse, type Scores, type Quadrant } from '../../types';
import Button from '../ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { QUADRANT_LABELS, QUADRANT_COLORS } from '../../constants';
import { analyzeCvf } from '../../services/geminiService';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import MarkdownRenderer from '../ui/MarkdownRenderer';


interface AdminDashboardProps {
  onSelectResponse: (response: UserResponse) => void;
  onResponsesChange: (responses: UserResponse[]) => void;
  consolidatedCvfScores: Scores | null;
  onCvfAnalysisComplete: (analysis: string) => void;
}

const getDominantProfile = (scores: Scores): Quadrant => {
    return (Object.keys(scores) as Quadrant[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
};

const renderPolarAngleAxisTick = ({ x, y, payload }: any) => {
    const parts = payload.value.split('\n');
    const centerX = 224;
    const centerY = 160;
    const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
  
    let textAnchor: "middle" | "start" | "end" = "middle";
    if (angle > -10 && angle < 10) textAnchor = "start";
    if (angle > 170 || angle < -170) textAnchor = "end";
  
    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor={textAnchor} dominantBaseline="central">
          <tspan x="0" dy="-0.6em" fontSize={12} fill="#4A5568">{parts[0]}</tspan>
          {parts[1] && <tspan x="0" dy="1.3em" fontSize={14} fontWeight="bold" fill="#374151">{parts[1]}</tspan>}
        </text>
      </g>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectResponse, onResponsesChange, consolidatedCvfScores, onCvfAnalysisComplete }) => {
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  
  const [cvfAnalysis, setCvfAnalysis] = useState('');
  const [loadingCvfAnalysis, setLoadingCvfAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState('');


  useEffect(() => {
    const fetchResponses = async () => {
        setLoadingResponses(true);
        try {
            const allResponses = await authService.getAllResponses();
            setResponses(allResponses);
            onResponsesChange(allResponses);
        } catch (error) {
            console.error("Failed to fetch responses:", error);
        } finally {
            setLoadingResponses(false);
        }
    };
    fetchResponses();
  }, [onResponsesChange]);

  useEffect(() => {
    if (consolidatedCvfScores) {
        setLoadingCvfAnalysis(true);
        setAnalysisError('');
        analyzeCvf(consolidatedCvfScores)
            .then(analysis => {
                setCvfAnalysis(analysis);
                onCvfAnalysisComplete(analysis);
            })
            .catch(err => {
                console.error("Failed to analyze consolidated CVF:", err);
                const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro ao gerar a análise da cultura consolidada.";
                setAnalysisError(errorMessage);
                onCvfAnalysisComplete(errorMessage); 
            })
            .finally(() => {
                setLoadingCvfAnalysis(false);
            });
    } else if (!loadingResponses) {
        setCvfAnalysis('');
        onCvfAnalysisComplete('');
        setLoadingCvfAnalysis(false);
    }
  }, [consolidatedCvfScores, onCvfAnalysisComplete, loadingResponses]);

  const handleDeleteResponse = async (responseId: number, responseName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a resposta de ${responseName}? Esta ação não pode ser desfeita.`)) {
        try {
            await authService.deleteUserResponse(responseId);
            const updatedResponses = responses.filter(r => r.id !== responseId);
            setResponses(updatedResponses);
            onResponsesChange(updatedResponses);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            alert(`Erro ao excluir: ${errorMessage}`);
        }
    }
  };

  const consolidatedChartData = useMemo(() => {
    if (!consolidatedCvfScores) return [];
    return (Object.keys(consolidatedCvfScores) as (keyof Scores)[]).map(key => {
        const score = parseFloat(consolidatedCvfScores[key].toFixed(2));
        return {
            quadrant: `${QUADRANT_LABELS[key]}\n(${score.toFixed(2)})`,
            score: score,
        };
    });
  }, [consolidatedCvfScores]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Painel de Análise Consolidada</h2>

      {loadingResponses ? (
          <LoadingSkeleton />
      ) : responses.length > 0 && consolidatedCvfScores ? (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Cultura Consolidada (Média CVF - {responses.length} Respostas)</h3>
            <div className="h-80 w-full max-w-md mx-auto">
                 <ResponsiveContainer width="100%" height="100%">
                     <RadarChart cx="50%" cy="50%" outerRadius="65%" data={consolidatedChartData}>
                         <PolarGrid />
                         <PolarAngleAxis dataKey="quadrant" tick={renderPolarAngleAxisTick} />
                         <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} tick={false} axisLine={false} />
                         <Radar name="Cultura Média (CVF)" dataKey="score" stroke={QUADRANT_COLORS.Hierarchy} fill={QUADRANT_COLORS.Hierarchy} fillOpacity={0.6} />
                         <Tooltip />
                         <Legend wrapperStyle={{fontSize: "14px", paddingTop: "24px"}}/>
                     </RadarChart>
                 </ResponsiveContainer>
            </div>
            <div className="mt-8 border-t pt-6">
              {loadingCvfAnalysis ? (
                  <LoadingSkeleton />
              ) : analysisError ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">
                      {analysisError}
                  </div>
              ) : cvfAnalysis ? (
                  <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
                      <MarkdownRenderer text={cvfAnalysis} />
                  </div>
              ) : null}
            </div>
        </div>
      ) : null}

      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Análise de Alinhamento Individual</h3>
        {loadingResponses ? (
          <LoadingSkeleton />
        ) : responses.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">Nenhuma resposta foi registrada ainda. Crie usuários e peça para que respondam o questionário.</p>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => {
              const dominantProfile = getDominantProfile(response.cvcqScores);
              const profileLabel = QUADRANT_LABELS[dominantProfile].split(' ')[0];
              const profileColor = QUADRANT_COLORS[dominantProfile];
              const textColorClass = dominantProfile === 'Adhocracy' ? 'text-gray-800' : 'text-white';

              return (
                <div 
                  key={response.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-center"
                >
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => onSelectResponse(response)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectResponse(response)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="font-medium text-gray-800">{response.fullName}</span>
                    <p className="text-xs text-gray-500 mb-2">
                      {response.position} (Login: {response.username})
                    </p>
                    <span 
                      className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${textColorClass}`}
                      style={{ backgroundColor: profileColor }}
                    >
                      Perfil Dominante: {profileLabel}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelectResponse(response); }}
                        className="text-sm text-green-700 font-semibold hover:underline px-2 py-1"
                        aria-label={`Ver relatório de ${response.fullName}`}
                    >
                        Ver Relatório →
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResponse(response.id, response.fullName);
                        }}
                        className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                        aria-label={`Excluir resposta de ${response.fullName}`}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;