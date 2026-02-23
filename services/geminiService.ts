
import { GoogleGenAI } from "@google/genai";
import { Occurrence, Student } from "../types";

export const analyzeStudentBehavior = async (student: Student, occurrences: Occurrence[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const historyText = occurrences.map(occ => 
    `- [${new Date(occ.date).toLocaleString('pt-BR')}] ${occ.type}${occ.severity ? ` (${occ.severity})` : ''}: ${occ.titles.join(', ')}. ${occ.description}`
  ).join('\n');

  const prompt = `
    Analise o seguinte histórico de um aluno chamado ${student.name} da turma ${student.grade}.
    O histórico contém ocorrências disciplinares e pedagógicas:
    
    ${historyText}
    
    Por favor, forneça um resumo profissional em português (máximo 3 parágrafos) que inclua:
    1. Uma análise geral do comportamento e desempenho.
    2. Identificação de padrões preocupantes (se houver).
    3. Sugestões de intervenções pedagógicas ou medidas disciplinares adequadas.
    
    O tom deve ser pedagógico, empático e construtivo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Error analyzing behavior:", error);
    return "Erro ao conectar com o serviço de inteligência artificial.";
  }
};
