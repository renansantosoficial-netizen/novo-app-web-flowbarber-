import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CACHE_KEY_PREFIX = "gemini_cache_";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const inFlightRequests: Record<string, Promise<any>> = {};

function getCachedData(key: string) {
  const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}

function setCachedData(key: string, data: any) {
  localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || 
                         error?.message?.toLowerCase().includes('rate limit');
    const isQuotaExhausted = error?.status === 429 && error?.message?.toLowerCase().includes('quota');
    
    // Only retry on temporary rate limits, not hard quota exhaustion
    if (retries > 0 && isRateLimit && !isQuotaExhausted) {
      console.warn(`Rate limit exceeded, retrying in ${delay}ms... (Retries left: ${retries})`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getAIInsights(data: any) {
  const cacheKey = "insights";
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  if (inFlightRequests[cacheKey]) return inFlightRequests[cacheKey];

  const request = (async () => {
    try {
      const prompt = `
        Você é um consultor de negócios especializado em barbearias premium.
        Analise os seguintes dados da barbearia "Flow Barber" e forneça 3 insights curtos e acionáveis para aumentar o faturamento ou melhorar a eficiência.
        
        Dados:
        - Saldo Atual: € ${data.saldo}
        - Meta Mensal: € ${data.meta}
        - Faturamento do Mês: € ${data.faturamento}
        - Comissão Total: € ${data.comissao}
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

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }));

      const result = JSON.parse(response.text || "{}");
      setCachedData(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Error fetching AI insights:", error);
      // Cache failure for 1 hour to prevent hammering the API
      if (error?.status === 429) {
        setCachedData(cacheKey, { insights: [], error: "Quota excedida. Tente novamente mais tarde." });
      }
      return { insights: [], error: "Não foi possível carregar os insights no momento." };
    } finally {
      delete inFlightRequests[cacheKey];
    }
  })();

  inFlightRequests[cacheKey] = request;
  return request;
}

export async function getMarketTrends() {
  const cacheKey = "trends";
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  if (inFlightRequests[cacheKey]) return inFlightRequests[cacheKey];

  const request = (async () => {
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
      
      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      }));

      const result = JSON.parse(response.text || "{}");
      setCachedData(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Error fetching market trends:", error);
      // Cache failure for 1 hour to prevent hammering the API
      if (error?.status === 429) {
        setCachedData(cacheKey, { trends: [], error: "Quota excedida. Tente novamente mais tarde." });
      }
      return { trends: [], error: "Não foi possível carregar as tendências no momento." };
    } finally {
      delete inFlightRequests[cacheKey];
    }
  })();

  inFlightRequests[cacheKey] = request;
  return request;
}
