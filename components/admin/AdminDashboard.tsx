import React, { useState, useEffect, useMemo } from 'react';
import { authService } from '../../auth/authService';
import { type UserResponse, type Scores, type Quadrant } from '../../types';
import Button from '../ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { QUADRANT_LABELS, QUADRANT_COLORS } from '../../constants';
import { analyzeCvf, analyzeDetailedCvfDistribution } from '../../services/geminiService';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import MarkdownRenderer from '../ui/MarkdownRenderer';

interface AdminDashboardProps {
  onSelectResponse: (response: UserResponse) => void;
  onResponsesChange: (responses: UserResponse[]) => void;
  consolidatedCvfScores: Scores | null;
  onCvfAnalysisComplete: (analysis: string) => void;
}

const getDominantProfile = (scores?: Scores | null): Quadrant => {
    if (!scores) return 'Clan';
    return (Object.keys(scores) as Quadrant[]).reduce((a, b) => (scores[a] || 0) > (scores[b] || 0) ? a : b, 'Clan');
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

// Simple inline Markdown to HTML translator for the download file to display markdown cleanly.
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inCode = false;

  for (let line of lines) {
    let trimmed = line.trim();

    // Code block
    if (trimmed.startsWith('```')) {
      if (inCode) {
        html += '</pre>\n';
        inCode = false;
      } else {
        html += '<pre class="bg-slate-50 p-4 rounded-lg text-xs font-mono my-4 overflow-x-auto text-slate-700 border border-slate-150">\n';
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html += trimmed + '\n';
      continue;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h1 class="text-2xl font-extrabold text-slate-800 mt-8 mb-4">${trimmed.substring(2)}</h1>\n`;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3 border-b pb-2">${trimmed.substring(3)}</h2>\n`;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h3 class="text-lg font-bold text-slate-800 mt-5 mb-2">${trimmed.substring(4)}</h3>\n`;
      continue;
    }

    // Bullet list items
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="list-disc list-inside ml-4 my-3 space-y-1.5 text-slate-700">\n';
        inList = true;
      }
      let content = trimmed.substring(2);
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
      html += `<li class="text-sm leading-relaxed">${content}</li>\n`;
      continue;
    }

    // End list if we find a non-list item
    if (inList && trimmed === '') {
      html += '</ul>\n';
      inList = false;
    }

    // Empty line
    if (trimmed === '') {
      html += '<div class="h-2"></div>\n';
      continue;
    }

    // Standard paragraph
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
    let content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
    html += `<p class="text-sm text-slate-700 leading-relaxed mb-3">${content}</p>\n`;
  }

  if (inList) {
    html += '</ul>\n';
  }
  if (inCode) {
    html += '</pre>\n';
  }

  return html;
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectResponse, onResponsesChange, consolidatedCvfScores, onCvfAnalysisComplete }) => {
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  
  const [cvfAnalysis, setCvfAnalysis] = useState('');
  const [loadingCvfAnalysis, setLoadingCvfAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState('');

  // States for detailed distribution analysis
  const [detailedAnalysis, setDetailedAnalysis] = useState('');
  const [loadingDetailedAnalysis, setLoadingDetailedAnalysis] = useState(true);
  const [detailedAnalysisError, setDetailedAnalysisError] = useState('');

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

  // Compute profile distributions
  const distributions = useMemo(() => {
    const cvfDist: Record<Quadrant, number> = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    const cvcqDist: Record<Quadrant, number> = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    
    responses.forEach(res => {
      cvfDist[getDominantProfile(res.cvfScores)]++;
      cvcqDist[getDominantProfile(res.cvcqScores)]++;
    });

    return { cvfDist, cvcqDist };
  }, [responses]);

  // Advanced analysis based on detailed participant profile distributions
  useEffect(() => {
    if (consolidatedCvfScores && responses.length > 0) {
        setLoadingDetailedAnalysis(true);
        setDetailedAnalysisError('');
        analyzeDetailedCvfDistribution(
          consolidatedCvfScores, 
          distributions.cvfDist, 
          distributions.cvcqDist, 
          responses.length
        )
        .then(analysis => {
            setDetailedAnalysis(analysis);
        })
        .catch(err => {
            console.error("Failed to analyze detailed distributions:", err);
            setDetailedAnalysisError(err instanceof Error ? err.message : "Erro ao gerar análise crítica detalhada.");
        })
        .finally(() => {
            setLoadingDetailedAnalysis(false);
        });
    } else if (!loadingResponses) {
        setDetailedAnalysis('');
        setLoadingDetailedAnalysis(false);
    }
  }, [consolidatedCvfScores, distributions, responses.length, loadingResponses]);

  // Calculate Leadership Alignment Index (Índice de Acoplamento de Liderança - IAL)
  const alignmentMetrics = useMemo(() => {
    if (!consolidatedCvfScores || responses.length === 0) return { percent: 0, count: 0, text: 'N/A', badgeClass: '' };
    
    const dominantCulture = getDominantProfile(consolidatedCvfScores);
    let matchedCount = 0;

    responses.forEach(res => {
      const dominantLeadership = getDominantProfile(res.cvcqScores);
      if (dominantLeadership === dominantCulture) {
        matchedCount++;
      }
    });

    const percent = (matchedCount / responses.length) * 100;
    
    let text = '';
    let badgeClass = '';
    if (percent >= 70) {
      text = 'Sinergia Forte';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (percent >= 35) {
      text = 'Alinhamento Moderado';
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    } else {
      text = 'Desalinhamento Crítico';
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
    }

    return {
      percent: parseFloat(percent.toFixed(1)),
      count: matchedCount,
      text,
      badgeClass,
      dominantCulture
    };
  }, [consolidatedCvfScores, responses]);

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

  const renderDistributionBar = (label: string, count: number, total: number, color: string) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-500 font-medium">{count} colaborador(es) ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-150">
          <div 
            className="h-full rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    );
  };

  // Generate and download full HTML report
  const handleDownloadReport = () => {
    if (!consolidatedCvfScores || responses.length === 0) return;

    const todayStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const cvfProgressHtml = (Object.keys(consolidatedCvfScores) as Quadrant[]).map(key => {
      const score = consolidatedCvfScores[key];
      const color = QUADRANT_COLORS[key];
      const label = QUADRANT_LABELS[key];
      return `
        <div class="mb-4">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>${label}</span>
            <span>${score.toFixed(2)}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div class="h-full rounded-full transition-all duration-500" style="width: ${score}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');

    const cvfDistHtml = (Object.keys(distributions.cvfDist) as Quadrant[]).map(key => {
      const count = distributions.cvfDist[key];
      const percent = ((count / responses.length) * 100).toFixed(1);
      const color = QUADRANT_COLORS[key];
      const label = QUADRANT_LABELS[key].split(' ')[0];
      return `
        <div class="mb-3">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>${label}</span>
            <span>${count} Colaborador(es) (${percent}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="h-full rounded-full" style="width: ${percent}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');

    const cvcqDistHtml = (Object.keys(distributions.cvcqDist) as Quadrant[]).map(key => {
      const count = distributions.cvcqDist[key];
      const percent = ((count / responses.length) * 100).toFixed(1);
      const color = QUADRANT_COLORS[key];
      const label = QUADRANT_LABELS[key].split(' ')[0];
      return `
        <div class="mb-3">
          <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>${label}</span>
            <span>${count} Líder(es) (${percent}%)</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div class="h-full rounded-full" style="width: ${percent}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');

    const participantRows = responses.map((res, index) => {
      const cvfDom = getDominantProfile(res.cvfScores);
      const cvcqDom = getDominantProfile(res.cvcqScores);
      const cvfColor = QUADRANT_COLORS[cvfDom];
      const cvcqColor = QUADRANT_COLORS[cvcqDom];
      return `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100">
          <td class="px-4 py-3 text-xs font-semibold text-slate-800 break-words" style="word-break: break-word;">${res.fullName}</td>
          <td class="px-4 py-3 text-xs text-slate-500 break-words" style="word-break: break-word;">${res.position}</td>
          <td class="px-4 py-3 text-xs">
            <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style="background-color: ${cvfColor};">
              ${QUADRANT_LABELS[cvfDom].split(' ')[0]}
            </span>
          </td>
          <td class="px-4 py-3 text-xs">
            <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style="background-color: ${cvcqColor};">
              ${QUADRANT_LABELS[cvcqDom].split(' ')[0]}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    // Native SVG Radar Chart
    const clanS = consolidatedCvfScores.Clan;
    const adhocS = consolidatedCvfScores.Adhocracy;
    const marketS = consolidatedCvfScores.Market;
    const hierS = consolidatedCvfScores.Hierarchy;

    const svgRadar = `
      <svg viewBox="0 0 400 400" class="w-full max-w-sm mx-auto my-4 font-sans">
        <!-- Concentric Diamonds Grid -->
        ${[20, 40, 60, 80, 100].map(level => `
          <polygon points="
            200,${200 - 1.5 * level} 
            ${200 + 1.5 * level},200 
            200,${200 + 1.5 * level} 
            ${200 - 1.5 * level},200" 
            fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2,2" />
          <text x="205" y="${200 - 1.5 * level + 4}" fill="#94a3b8" font-size="9">${level}</text>
        `).join('')}

        <!-- Axes lines -->
        <line x1="200" y1="50" x2="200" y2="350" stroke="#cbd5e1" stroke-width="1" />
        <line x1="50" y1="200" x2="350" y2="200" stroke="#cbd5e1" stroke-width="1" />

        <!-- Labels -->
        <text x="200" y="35" text-anchor="middle" font-weight="bold" font-size="11" fill="#475569">Clã (Colaborar) [${clanS.toFixed(1)}]</text>
        <text x="360" y="204" text-anchor="start" font-weight="bold" font-size="11" fill="#475569">Adhocracia (Criar) [${adhocS.toFixed(1)}]</text>
        <text x="200" y="375" text-anchor="middle" font-weight="bold" font-size="11" fill="#475569">Mercado (Competir) [${marketS.toFixed(1)}]</text>
        <text x="40" y="204" text-anchor="end" font-weight="bold" font-size="11" fill="#475569">Hierarquia (Controlar) [${hierS.toFixed(1)}]</text>

        <!-- Data Polygon -->
        <polygon points="
          200,${200 - 1.5 * clanS} 
          ${200 + 1.5 * adhocS},200 
          200,${200 + 1.5 * marketS} 
          ${200 - 1.5 * hierS},200" 
          fill="#4b6a9e" fill-opacity="0.35" stroke="#4b6a9e" stroke-width="3" />

        <!-- Data points -->
        <circle cx="200" cy="${200 - 1.5 * clanS}" r="4" fill="#6a8e87" stroke="#fff" stroke-width="1.5" />
        <circle cx="${200 + 1.5 * adhocS}" cy="200" r="4" fill="#f7a53e" stroke="#fff" stroke-width="1.5" />
        <circle cx="200" cy="${200 + 1.5 * marketS}" r="4" fill="#e54a41" stroke="#fff" stroke-width="1.5" />
        <circle cx="${200 - 1.5 * hierS}" cy="200" r="4" fill="#4b6a9e" stroke="#fff" stroke-width="1.5" />
      </svg>
    `;

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Alinhamento Cultural e Liderança - Guideway</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: white !important;
        padding: 0 !important;
      }
      .print-card {
        border: 1px solid #e2e8f0 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        margin-bottom: 2rem;
      }
      table {
        table-layout: fixed !important;
        width: 100% !important;
      }
      th, td {
        word-wrap: break-word !important;
        white-space: normal !important;
      }
    }
  </style>
</head>
<body class="text-slate-800 antialiased p-4 sm:p-8">

  <div class="max-w-4xl mx-auto space-y-8">
    
    <!-- HEADER -->
    <div class="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden print-card">
      <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="inline-block text-xs font-bold tracking-widest uppercase bg-emerald-700/50 border border-emerald-500/30 px-3 py-1 rounded-full mb-3">
            Diagnóstico Corporativo Avançado
          </span>
          <h1 class="text-3xl font-extrabold tracking-tight">Relatório de Alinhamento de Cultura e Liderança</h1>
          <p class="text-teal-100 text-sm mt-2 font-medium">Análise Metodológica: CVF (Competing Values Framework) & CVCQ</p>
        </div>
        <div class="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-right md:min-w-[200px]">
          <p class="text-[11px] text-teal-200 uppercase tracking-wider font-semibold">Emitido em</p>
          <p class="text-sm font-bold mt-0.5">${todayStr}</p>
          <p class="text-[11px] text-teal-200 mt-1.5 uppercase tracking-wider font-semibold">Participantes</p>
          <p class="text-sm font-bold mt-0.5">${responses.length} colaboradores</p>
        </div>
      </div>
      <div class="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl"></div>
    </div>

    <!-- ACTIONS (NO-PRINT) -->
    <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
      <span class="text-xs text-slate-500 font-medium">Você pode imprimir este documento diretamente ou salvá-lo como PDF.</span>
      <button onclick="window.print()" class="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center shadow transition-all cursor-pointer">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
        </svg>
        Imprimir / Exportar para PDF
      </button>
    </div>

    <!-- METRICS CARD -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm print-card text-center">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cultura Predominante</p>
        <p class="text-lg font-bold text-slate-800 mt-2">${QUADRANT_LABELS[alignmentMetrics.dominantCulture].split(' ')[0]}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm print-card text-center">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Índice de Acoplamento (IAL)</p>
        <p class="text-3xl font-extrabold text-emerald-700 mt-1">${alignmentMetrics.percent}%</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm print-card text-center">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status do Alinhamento</p>
        <p class="text-sm font-bold mt-2.5 px-3 py-1 rounded-full inline-block bg-slate-50 border text-slate-700">${alignmentMetrics.text}</p>
      </div>
    </div>

    <!-- SECTION 1: CULTURA CONSOLIDADA -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print-card">
      <h2 class="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center">
        <span class="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
        1. Cultura Consolidada da Empresa (Média CVF)
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-150 flex items-center justify-center">
          ${svgRadar}
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Valores Médios Consolidados</h3>
          <div class="space-y-4">
            ${cvfProgressHtml}
          </div>
        </div>
      </div>

      <div class="mt-8 border-t border-slate-100 pt-6">
        <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Análise da Cultura Consolidada (AI)</h3>
        <div class="prose prose-slate max-w-none">
          ${markdownToHtml(cvfAnalysis)}
        </div>
      </div>
    </div>

    <!-- SECTION 2: DISTRIBUIÇÃO DE PERFIS -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print-card">
      <h2 class="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center">
        <span class="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
        2. Distribuição Detalhada de Perfis Dominantes
      </h2>

      <p class="text-sm text-slate-500 mb-6 leading-relaxed">
        Esta seção detalha quantos participantes foram mapeados em cada quadrante de forma dominante, comparando a percepção individual sobre a cultura atual (CVF) com a autoavaliação de suas competências individuais de liderança (CVCQ).
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- CVF Dist -->
        <div class="bg-slate-50/70 p-5 rounded-xl border border-slate-150">
          <h3 class="text-sm font-bold text-slate-700 mb-4 flex items-center">
            <svg class="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            Percepção Cultural Dominante (CVF)
          </h3>
          <div class="space-y-4">
            ${cvfDistHtml}
          </div>
        </div>

        <!-- CVCQ Dist -->
        <div class="bg-slate-50/70 p-5 rounded-xl border border-slate-150">
          <h3 class="text-sm font-bold text-slate-700 mb-4 flex items-center">
            <svg class="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Competências de Liderança Dominantes (CVCQ)
          </h3>
          <div class="space-y-4">
            ${cvcqDistHtml}
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 3: ANÁLISE CRÍTICA IA AVANÇADA -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print-card">
      <h2 class="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center">
        <span class="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
        3. Análise Crítica do Consultor de Inteligência Artificial
      </h2>
      
      <div class="prose prose-slate max-w-none">
        ${markdownToHtml(detailedAnalysis || '<em>Análise detalhada não disponível. Certifique-se de que a IA processou as distribuições antes de exportar.</em>')}
      </div>
    </div>

    <!-- SECTION 4: LISTA DE PARTICIPANTES -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-card">
      <div class="p-5 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-800 flex items-center">
          <span class="w-2 h-5 bg-emerald-700 rounded-full mr-2.5"></span>
          4. Matriz de Respostas de Participantes
        </h2>
      </div>
      <div class="w-full overflow-hidden">
        <table class="w-full table-fixed divide-y divide-slate-200" style="table-layout: fixed; width: 100%;">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="w-[28%] px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider break-words" style="word-break: break-word;">Colaborador</th>
              <th scope="col" class="w-[24%] px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider break-words" style="word-break: break-word;">Cargo</th>
              <th scope="col" class="w-[24%] px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider break-words" style="word-break: break-word;">Cultura Predominante</th>
              <th scope="col" class="w-[24%] px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider break-words" style="word-break: break-word;">Liderança Predominante</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            ${participantRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="text-center text-xs text-slate-400 py-6 border-t border-slate-200">
      <p class="font-semibold text-slate-500">Relatório emitido pela plataforma Culture & Leadership Analyzer</p>
      <p class="mt-1">Guideway &copy; ${new Date().getFullYear()} &bull; Operações Inteligentes</p>
    </div>

  </div>

</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Alinhamento_Guideway_${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Painel de Análise Consolidada</h2>
          <p className="text-sm text-gray-500 mt-1">Visão geral do diagnóstico organizacional de cultura e competências.</p>
        </div>
        {responses.length > 0 && consolidatedCvfScores && (
          <button
            onClick={handleDownloadReport}
            disabled={loadingCvfAnalysis || loadingDetailedAnalysis}
            className="inline-flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar Relatório Completo (HTML)
          </button>
        )}
      </div>

      {loadingResponses ? (
          <LoadingSkeleton />
      ) : responses.length > 0 && consolidatedCvfScores ? (
        <div className="space-y-8">
          
          {/* CONSULTING METRICS STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cultura Predominante</span>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {QUADRANT_LABELS[alignmentMetrics.dominantCulture]}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-3">Baseado na média consolidada de {responses.length} respostas.</p>
            </div>

            <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Índice de Acoplamento (IAL)</span>
                <div className="flex items-baseline mt-1 gap-2">
                  <span className="text-3xl font-extrabold text-emerald-700">{alignmentMetrics.percent}%</span>
                  <span className="text-xs font-semibold text-emerald-600">({alignmentMetrics.count}/{responses.length})</span>
                </div>
              </div>
              <p className="text-xs text-emerald-600/80 mt-3 font-medium">Liderança correspondente à cultura dominante.</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sinergia Estratégica</span>
                <div className="mt-2.5">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${alignmentMetrics.badgeClass}`}>
                    {alignmentMetrics.text}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Análise do alinhamento liderança vs cultura.</p>
            </div>
          </div>

          {/* MAIN RADAR CHART AND CONSOLIDATED CULTURE */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <span className="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
                Cultura Consolidada (Média CVF - {responses.length} Respostas)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
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
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Resultados por Quadrante</h4>
                  <div className="space-y-4">
                    {(Object.keys(consolidatedCvfScores) as Quadrant[]).map(key => {
                      const score = consolidatedCvfScores[key];
                      const color = QUADRANT_COLORS[key];
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                            <span>{QUADRANT_LABELS[key]}</span>
                            <span>{score.toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Análise Narrativa de Cultura Consolidada</h4>
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

          {/* NEW SECTION: DISTRIBUTION OF DOMINANT PROFILES */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
                Distribuição Detalhada de Perfis por Colaborador
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Mapeamento individual mostrando como cada participante percebe a cultura organizacional hoje contra o estilo individual de liderança que exerce.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-6">
                {/* CVF Distribution column */}
                <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-150">
                  <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Percepção Cultural Dominante (CVF)
                  </h4>
                  <div className="space-y-1">
                    {renderDistributionBar("Clã (Colaborar)", distributions.cvfDist.Clan, responses.length, QUADRANT_COLORS.Clan)}
                    {renderDistributionBar("Adhocracia (Criar)", distributions.cvfDist.Adhocracy, responses.length, QUADRANT_COLORS.Adhocracy)}
                    {renderDistributionBar("Mercado (Competir)", distributions.cvfDist.Market, responses.length, QUADRANT_COLORS.Market)}
                    {renderDistributionBar("Hierarquia (Controlar)", distributions.cvfDist.Hierarchy, responses.length, QUADRANT_COLORS.Hierarchy)}
                  </div>
                </div>

                {/* CVCQ Distribution column */}
                <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-150">
                  <h4 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Liderança Competente Dominante (CVCQ)
                  </h4>
                  <div className="space-y-1">
                    {renderDistributionBar("Clã (Mentoria/Coesão)", distributions.cvcqDist.Clan, responses.length, QUADRANT_COLORS.Clan)}
                    {renderDistributionBar("Adhocracia (Inovação/Agilidade)", distributions.cvcqDist.Adhocracy, responses.length, QUADRANT_COLORS.Adhocracy)}
                    {renderDistributionBar("Mercado (Competição/Produtor)", distributions.cvcqDist.Market, responses.length, QUADRANT_COLORS.Market)}
                    {renderDistributionBar("Hierarquia (Controle/Monitor)", distributions.cvcqDist.Hierarchy, responses.length, QUADRANT_COLORS.Hierarchy)}
                  </div>
                </div>
              </div>
          </div>

          {/* NEW SECTION: AI DETAILED CRITICAL DISTRIBUTION ANALYSIS */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
                Análise Crítica da IA (Distribuição & Alinhamento)
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Análise aprofundada gerada por Inteligência Artificial sobre a homogeneidade das percepções de cultura e correspondência de competências de liderança na equipe.
              </p>
              <div className="border-t pt-6">
                {loadingDetailedAnalysis ? (
                    <LoadingSkeleton />
                ) : detailedAnalysisError ? (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">
                        {detailedAnalysisError}
                    </div>
                ) : detailedAnalysis ? (
                    <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
                        <MarkdownRenderer text={detailedAnalysis} />
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-sm text-center">Incapaz de gerar análise crítica. Por favor, adicione mais dados.</p>
                )}
              </div>
          </div>

        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-2.5 h-6 bg-emerald-700 rounded-full mr-3"></span>
          Análise de Alinhamento Individual
        </h3>
        {loadingResponses ? (
          <LoadingSkeleton />
        ) : responses.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">Nenhuma resposta foi registrada ainda. Crie usuários e peça para que respondam o questionário.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {responses.map((response) => {
              const dominantProfile = getDominantProfile(response.cvcqScores);
              const profileLabel = QUADRANT_LABELS[dominantProfile].split(' ')[0];
              const profileColor = QUADRANT_COLORS[dominantProfile];
              const textColorClass = dominantProfile === 'Adhocracy' ? 'text-gray-800' : 'text-white';

              return (
                <div 
                  key={response.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-250 flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => onSelectResponse(response)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectResponse(response)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="font-semibold text-gray-800 block">{response.fullName}</span>
                    <p className="text-xs text-gray-500 mb-2">
                      {response.position} (Login: {response.username})
                    </p>
                    <span 
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${textColorClass}`}
                      style={{ backgroundColor: profileColor }}
                    >
                      Estilo Líder: {profileLabel}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 ml-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelectResponse(response); }}
                        className="text-xs text-emerald-700 font-bold hover:underline px-2 py-1 flex items-center cursor-pointer"
                        aria-label={`Ver relatório de ${response.fullName}`}
                    >
                        Relatório →
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResponse(response.id, response.fullName);
                        }}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors cursor-pointer"
                        aria-label={`Excluir resposta de ${response.fullName}`}
                    >
                        <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor">
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
