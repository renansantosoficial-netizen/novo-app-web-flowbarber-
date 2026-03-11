import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIInsights(data: any) {
  try {
    const prompt = `
      Você é um consultor de negócios especializado em barbearias premium.
      Analise os seguintes dados da barbearia "Flow Barber" e forneça 3 insights curtos e acionáveis para aumentar o faturamento ou melhorar a eficiência.
      
      Dados:
      - Saldo Atual: R$ ${data.saldo}
      - Meta Mensal: R$ ${data.meta}
      - Faturamento do Mês: R$ ${data.faturamento}
      - Comissão Total: R$ ${data.comissao}
      - Número de Serviços: ${data.servicosCount}
      - Número de Produtos: ${data.produtosCount}
      
      Responda em formato JSON:
      {
        "insights": [
          { "title": "Título", "description": "Descrição curta" },
          ...
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return { insights: [] };
  }
}

export async function getMarketTrends() {
  try {
    const prompt = `
      Quais são as 3 principais tendências de barbearia premium e cuidados masculinos para 2026 no Brasil? Forneça insights curtos e links de referência se possível.
      
      Responda em formato JSON:
      {
        "trends": [
          { "title": "Título", "description": "Descrição curta", "url": "URL de referência" }
        ]
      }
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error fetching market trends:", error);
    return { trends: [] };
  }
}
