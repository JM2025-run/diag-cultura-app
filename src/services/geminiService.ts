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

// FIX: Reverted to use `import.meta.env` which is the correct way to access
// environment variables in a Vite project. `process.env.API_KEY` is for Node.js
// environments and was causing a "ReferenceError: process is not defined" in the browser,
// leading to the white screen.
const apiKey = import.meta.env.VITE_API_KEY;

// Initialize the AI client only if the API key is available.
let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else {
    // This message will be visible in the browser's developer console.
    console.error("VITE_API_KEY is not defined. Please create a .env file in the root of your project and add VITE_API_KEY=your_key_here");
}

const generateAnalysis = async (prompt: string): Promise<string> => {
  // Check if the AI client was initialized. If not, the API key is missing.
  if (!ai) {
    throw new ConfigurationError(
        "Erro de Configuração: A chave da API do Gemini não foi encontrada. Por favor, contate o administrador para configurar a chave da API no ambiente."
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Propagate a more user-friendly error message to the UI layer.
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