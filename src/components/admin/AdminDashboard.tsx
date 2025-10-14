
import React, { useState, useEffect, useMemo } from 'react';
import { authService } from '../../auth/authService';
import { type UserResponse, type Scores, type Quadrant } from '../../types';
import Button from '../ui/Button';
// FIX: Import `PolarRadiusAxis` from `recharts` to resolve the 'Cannot find name' error.
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { QUADRANT_LABELS, QUADRANT_COLORS } from '../../constants';
import { analyzeCvf } from '../../services/geminiService';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import MarkdownRenderer from '../ui/MarkdownRenderer';


interface AdminDashboardProps {
  onSelectResponse: (response: UserResponse) => void;
  onLogout: () => void;
  onResponsesChange: (responses: UserResponse[]) => void;
  consolidatedCvfScores: Scores | null;
  onCvfAnalysisComplete: (analysis: string) => void;
}

// Helper function to determine the dominant quadrant from a set of scores.
const getDominantProfile = (scores: Scores): Quadrant => {
    return (Object.keys(scores) as Quadrant[]).reduce((a, b) => scores[a] > scores[b] ? a : b);
};

// Custom tick for PolarAngleAxis to show quadrant name and score in multiple lines, preventing cutoff.
const renderPolarAngleAxisTick = ({ x, y, payload }: any) => {
    const parts = payload.value.split('\n');
    
    // Approximate center of the chart container (h-80 -> 320px high, max-w-md -> 448px wide)
    const centerX = 224;
    const centerY = 160;
    const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
  
    // Adjust text anchor based on position to avoid overlap with the chart
    let textAnchor: "middle" | "start" | "end" = "middle";
    if (angle > -10 && angle < 10) textAnchor = "start"; // Right side
    if (angle > 170 || angle < -170) textAnchor = "end";   // Left side
  
    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor={textAnchor} dominantBaseline="central">
          <tspan x="0" dy="-0.6em" fontSize={12} fill="#4A5568">{parts[0]}</tspan>
          {parts[1] && <tspan x="0" dy="1.3em" fontSize={14} fontWeight="bold" fill="#374151">{parts[1]}</tspan>}
        </text>
      </g>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectResponse, onLogout, onResponsesChange, consolidatedCvfScores, onCvfAnalysisComplete }) => {
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [pastedCode, setPastedCode] = useState('');
  const [error, setError] = useState('');
  
  const [cvfAnalysis, setCvfAnalysis] = useState('');
  const [loadingCvfAnalysis, setLoadingCvfAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState('');


  useEffect(() => {
    const allResponses = authService.getAllResponses();
    setResponses(allResponses);
    onResponsesChange(allResponses);
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
                // Also pass up the error as "analysis" to ensure consistency
                onCvfAnalysisComplete(errorMessage); 
            })
            .finally(() => {
                setLoadingCvfAnalysis(false);
            });
    } else {
        // Reset if scores are cleared
        setCvfAnalysis('');
        onCvfAnalysisComplete('');
    }
  }, [consolidatedCvfScores, onCvfAnalysisComplete]);

  const handleAddResponse = () => {
    setError('');
    if (!pastedCode.trim()) {
      setError('O campo de código não pode estar vazio.');
      return;
    }
    try {
      const jsonString = atob(pastedCode); // Decode from Base64
      const newResponse = JSON.parse(jsonString) as UserResponse;

      // Validation for the new structure
      if (!newResponse.username || !newResponse.fullName || !newResponse.position || !newResponse.cvfScores || !newResponse.cvcqScores) {
        throw new Error("Código inválido ou com dados faltando.");
      }
      
      authService.saveUserResponse(newResponse);
      
      const allResponses = authService.getAllResponses();
      setResponses(allResponses);
      onResponsesChange(allResponses);
      setPastedCode(''); // Clear textarea on success
    } catch (e) {
      console.error("Failed to decode or save response:", e);
      setError("Código inválido. Verifique se o código foi copiado corretamente.");
    }
  };

  const consolidatedChartData = useMemo(() => {
    if (!consolidatedCvfScores) return [];
    return Object.keys(consolidatedCvfScores).map(key => {
        const score = parseFloat(consolidatedCvfScores[key as keyof Scores].toFixed(2));
        return {
            quadrant: `${QUADRANT_LABELS[key as keyof Scores]}\n(${score.toFixed(2)})`,
            score: score,
        };
    });
  }, [consolidatedCvfScores]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-800">Painel do Administrador</h2>
        <Button onClick={onLogout} variant="secondary">Sair</Button>
      </div>

      {/* Seção para adicionar nova resposta */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-3">Adicionar Nova Resposta</h3>
        <p className="text-sm text-gray-600 mb-4">Cole o código recebido do usuário para adicioná-lo à análise.</p>
        <textarea
          value={pastedCode}
          onChange={(e) => setPastedCode(e.target.value)}
          className="w-full h-24 p-2 font-mono text-xs text-gray-700 bg-gray-50 border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cole o código aqui..."
          aria-label="Campo para colar código de resposta"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="text-right mt-4">
          <Button onClick={handleAddResponse}>Adicionar Resposta</Button>
        </div>
      </div>

      {/* Seção de Cultura Consolidada */}
      {responses.length > 0 && consolidatedCvfScores && (
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
      )}

      {/* Seção de Respostas Individuais */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Análise de Alinhamento Individual</h3>
        {responses.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">Nenhuma resposta foi registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => {
              const dominantProfile = getDominantProfile(response.cvcqScores);
              const profileLabel = QUADRANT_LABELS[dominantProfile].split(' ')[0]; // e.g., "Clã"
              const profileColor = QUADRANT_COLORS[dominantProfile];
              // Ensure text has good contrast against the background color (especially for yellow).
              const textColorClass = dominantProfile === 'Adhocracy' ? 'text-gray-800' : 'text-white';

              return (
                <div 
                  key={response.username}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onSelectResponse(response)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectResponse(response)}
                >
                  <div>
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
                  <span className="text-sm text-blue-600 font-semibold">Ver Relatório →</span>
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