import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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
        Além disso, gere um "Prompt Estratégico" (um comando ou instrução clara) que o barbeiro deve seguir para implementar as melhorias sugeridas.
        
        Dados:
        - Saldo Atual: € ${data.saldo}
        - Meta Mensal: € ${data.meta}
        - Faturamento do Mês: € ${data.faturamento}
        - Comissão Total: € ${data.comissao}
        - Comissão de Serviços: € ${data.comissaoServicos}
        - Comissão de Produtos: € ${data.comissaoProdutos}
        - Número de Serviços: ${data.servicosCount}
        - Número de Produtos: ${data.produtosCount}
        
        Responda em formato JSON:
        {
          "insights": [
            { "title": "Título", "description": "Descrição curta" },
            ...
          ],
          "strategicPrompt": "Texto do prompt estratégico para execução imediata"
        }
      `;

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        },
      }));

      const result = JSON.parse(response.text || "{}");
      setCachedData(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Error fetching AI insights:", error);
      // Cache failure for 1 hour to prevent hammering the API
      if (error?.status === 429) {
        setCachedData(cacheKey, { insights: [], strategicPrompt: "", error: "Quota excedida. Tente novamente mais tarde." });
      }
      return { insights: [], strategicPrompt: "", error: "Não foi possível carregar os insights no momento." };
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
        Quais são as 3 principais tendências de barbearia premium e cuidados masculinos para o momento atual?
        
        Responda APENAS com um bloco JSON válido (sem \`\`\`json ou marcação markdown), no seguinte formato:
        {
          "trends": [
            { "title": "Título", "description": "Descrição curta", "url": "URL de referência (use os links da pesquisa)" }
          ]
        }
      `;
      
      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      }));

      let text = response.text || "{}";
      // Remove markdown code blocks if the model still outputs them
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const result = JSON.parse(text);
      
      // Extract URLs from grounding chunks if available and not present in the result
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && result.trends) {
        result.trends.forEach((trend: any, index: number) => {
          if (!trend.url || trend.url === "URL de referência") {
            const chunk = chunks[index] || chunks[0];
            if (chunk?.web?.uri) {
              trend.url = chunk.web.uri;
            }
          }
        });
      }

      setCachedData(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Error fetching market trends:", error);
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
