import { GoogleGenAI } from "@google/genai";
import { type Scores } from "../types";
import { QUADRANT_LABELS } from "../constants";

// Custom error for configuration issues, allowing the UI to display a specific message.
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// FIX: Correctly access the Gemini API key from Vite's environment variables.
// `process.env` is not available in a browser environment and causes the app to crash (white screen).
// `import.meta.env` is the standard way to access env vars in Vite.
// We use `(import.meta as any)` to align with the pattern in `supabaseClient.ts`
// and avoid potential TypeScript errors in this environment.
// Modern lazy initialization pattern to capture the Vite environment variables
// without causing a module-load time crash.
let aiInstance: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI => {
  if (aiInstance) return aiInstance;
  const key = (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new ConfigurationError("VITE_GEMINI_API_KEY variables are missing. Please add VITE_GEMINI_API_KEY to your environment/Secrets settings.");
  }
  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
};


const generateAnalysis = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && /API key not valid/i.test(error.message)) {
        throw new Error("Erro de Autenticação: A chave da API do Gemini é inválida. Por favor, contate o administrador.");
    }
    throw new Error("Ocorreu um erro ao comunicar com o serviço de IA. Por favor, tente novamente mais tarde.");
  }
};

const formatScores = (scores: Scores): string => {
  return Object.entries(scores)
    .map(([key, value]) => `- ${QUADRANT_LABELS[key as keyof Scores]}: ${(value as number).toFixed(2)}`)
    .join('\n');
};

export const analyzeCvf = (scores: Scores): Promise<string> => {
  const prompt = `
    Você é um especialista em gestão organizacional e cultura empresarial, com profundo conhecimento da metodologia Competing Values Framework (CVF).
    Analise os seguintes resultados de um questionário CVF. A pontuação varia de 0 a 100.
    
    Resultados da Cultura (CVF):
    ${formatScores(scores)}

    Sua tarefa é fornecer uma análise concisa e objetiva. Responda ESTRITAMENTE no seguinte formato, sem usar numeração:

    **Cultura Predominante:**
    Identifique a cultura com a maior pontuação.

    **Características Principais:**
    * Liste em 3 a 4 bullet points as características mais marcantes desta cultura.
    
    **Análise Crítica:**
    Em um único parágrafo curto, explique a principal implicação prática (ponto forte ou desafio) desta cultura para a empresa.
    
    Seja direto e foque nos insights mais importantes.
  `;
  return generateAnalysis(prompt);
};

export const analyzeCvcq = (scores: Scores): Promise<string> => {
  const prompt = `
    Você é um especialista em desenvolvimento de liderança e coach executivo.
    Analise os seguintes resultados de uma autoavaliação de competências de liderança (CVCQ), baseada nos papéis do Mentor, Facilitador (Clã), Inovador, Negociador (Adhocracia), Produtor, Diretor (Mercado), Coordenador e Monitor (Hierarquia). A pontuação é uma média de 1 (Baixa Competência) a 7 (Alta Competência).
    
    Resultados das Competências de Liderança (CVCQ):
    ${formatScores(scores)}
    
    Sua tarefa é criar um ranking claro das competências por quadrante. Responda ESTRITAMENTE no seguinte formato, sem usar numeração:
    
    **Ranking de Competências:**
    * Apresente uma lista dos quadrantes, do maior para o menor em pontuação. Para cada um, inclua a pontuação e uma descrição de uma frase sobre o que essa competência significa na prática para o líder. Use o formato: \`**Nome do Quadrante** (Pontuação: X.XX) - Descrição.\`
    
    **Resumo do Perfil de Liderança:**
    Em um único parágrafo curto, descreva o estilo de liderança predominante que emerge desses resultados.
    
    Seja claro, objetivo e foque em uma análise fácil de entender.
  `;
  return generateAnalysis(prompt);
};

export const analyzeCross = (cvfScores: Scores, cvcqScores: Scores): Promise<string> => {
  const prompt = `
    Você é um consultor sênior de estratégia e gestão, especialista em alinhar cultura (CVF) e liderança (CVCQ).
    
    Abaixo estão os resultados de uma empresa:
    Resultados da Cultura (CVF - escala 0 a 100):
    ${formatScores(cvfScores)}
    Resultados das Competências de Liderança (CVCQ - escala 1 a 7):
    ${formatScores(cvcqScores)}

    Sua tarefa é realizar uma análise de alinhamento direta e acionável. Responda ESTRITAMENTE no seguinte formato:
    
    **Diagnóstico de Alinhamento: [STATUS]**
    Onde [STATUS] é uma das seguintes opções: Forte Alinhamento, Alinhamento Parcial com Pontos de Atenção, ou Desalinhamento Crítico. A frase de status deve estar na mesma linha que o título, dentro do negrito.
    
    **Pontos Fortes e Sinergias**
    * Liste em 2 ou 3 bullet points as áreas onde a liderança reforça positivamente a cultura atual.
    
    **Pontos Fracos e Riscos**
    * Liste em 2 ou 3 bullet points as áreas de desalinhamento ou onde as competências da liderança podem criar atrito com a cultura.
    
    **Recomendações para Alinhamento**
    * Forneça 2 a 3 recomendações acionáveis em bullet points para fortalecer o alinhamento ou corrigir o desalinhamento.
  `;
  return generateAnalysis(prompt);
};

export const analyzeDetailedCvfDistribution = (
  scores: Scores,
  cvfDistribution: Record<Quadrant, number>,
  cvcqDistribution: Record<Quadrant, number>,
  total: number
): Promise<string> => {
  const cvfDistStr = Object.entries(cvfDistribution)
    .map(([key, value]) => `- ${QUADRANT_LABELS[key as keyof Scores]}: ${value} colaborador(es) (${((value / total) * 100).toFixed(1)}%)`)
    .join('\n');

  const cvcqDistStr = Object.entries(cvcqDistribution)
    .map(([key, value]) => `- ${QUADRANT_LABELS[key as keyof Scores]}: ${value} colaborador(es) (${((value / total) * 100).toFixed(1)}%)`)
    .join('\n');

  const prompt = `
    Você é um consultor organizacional sênior e psicólogo corporativo especializado na metodologia Competing Values Framework (CVF) e no Competing Values Competency Questionnaire (CVCQ).
    Analise os resultados consolidados e a distribuição detalhada de perfis de uma organização com ${total} participantes.

    Média Consolidada da Cultura da Empresa (CVF - Escala 0 a 100):
    ${formatScores(scores)}

    Distribuição da Percepção de Cultura Dominante por Colaborador (CVF):
    ${cvfDistStr}

    Distribuição de Competência de Liderança Dominante por Colaborador (CVCQ):
    ${cvcqDistStr}

    Sua tarefa é produzir um relatório de análise crítica altamente estratégico e acionável. Escreva em português do Brasil (pt-BR). Use formatação Markdown clara e elegante. O relatório deve conter as seguintes seções estruturadas:

    ### 1. Diagnóstico da Coesão Cultural
    Analise a dispersão ou concentração na percepção da cultura. Uma alta concentração (ex: maioria percebe Clã) indica alinhamento forte; uma dispersão (vários perfis percebidos) indica fragmentação ou subculturas. Explique os impactos práticos disso.

    ### 2. Sinergia entre Cultura e Competências de Liderança
    Cruze a distribuição da percepção de cultura (CVF) com as competências de liderança declaradas (CVCQ). A liderança predominante estimula a cultura percebida ou há um descompasso (ex: cultura vista como Clã, mas líderes com perfil predominante de Mercado ou Hierarquia)? 

    ### 3. Principais Riscos e Pontos Cegos Organizacionais
    Destaque de 2 a 3 riscos críticos baseados nos desvios entre o que a cultura consolidada exige e o estilo de liderança dos colaboradores (ex: risco de estagnação por excesso de Clã, ou risco de descontrole por falta de processos organizados).

    ### 4. Recomendações Estratégicas para Desenvolvimento
    Forneça recomendações acionáveis em bullet points divididas em curto prazo (ajustes imediatos ou workshops) e médio/longo prazo (processos de desenvolvimento ou contratações).

    Mantenha um tom profissional, analítico, focado em insights agregadores para quem está conduzindo a consultoria.
  `;
  return generateAnalysis(prompt);
};