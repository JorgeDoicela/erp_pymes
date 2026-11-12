/**
 * @file llmProvider.service.js
 * @description Adaptador Universal de Inferencia para Modelos Grandes (DeepSeek, OpenAI, Gemini, Anthropic, Groq)
 * y Modelos Locales entrenados con Fine-Tuning (Ollama GGUF, vLLM, llama.cpp, LM Studio).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

const PROVIDER_CONFIGS = {
  deepseek: {
    name: 'DeepSeek API',
    baseUrl: 'https://api.deepseek.com',
    chatPath: '/chat/completions',
    defaultModel: 'deepseek-chat',
    protocol: 'openai',
  },
  openai: {
    name: 'OpenAI API',
    baseUrl: 'https://api.openai.com/v1',
    chatPath: '/chat/completions',
    defaultModel: 'gpt-4o-mini',
    protocol: 'openai',
  },
  gemini: {
    name: 'Google Gemini API',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    chatPath: '/chat/completions',
    defaultModel: 'gemini-2.5-flash',
    protocol: 'openai',
  },
  groq: {
    name: 'Groq Cloud API',
    baseUrl: 'https://api.groq.com/openai/v1',
    chatPath: '/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    protocol: 'openai',
  },
  anthropic: {
    name: 'Anthropic Claude API',
    baseUrl: 'https://api.anthropic.com/v1',
    chatPath: '/messages',
    defaultModel: 'claude-3-5-sonnet-latest',
    protocol: 'anthropic',
  },
  huggingface: {
    name: 'Hugging Face Hub Inference API',
    baseUrl: 'https://router.huggingface.co/v1',
    chatPath: '/chat/completions',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    protocol: 'openai',
  },
  local_ollama: {
    name: 'Local Fine-Tuned LLM (Ollama GGUF)',
    baseUrl: 'http://127.0.0.1:11434',
    chatPath: '/api/chat',
    defaultModel: 'ecuador-erp-ai',
    protocol: 'ollama',
  },
  local_openai: {
    name: 'Local Fine-Tuned Server (vLLM / LM Studio / llama.cpp)',
    baseUrl: 'http://127.0.0.1:8000/v1',
    chatPath: '/chat/completions',
    defaultModel: 'ecuador-erp-ai',
    protocol: 'openai',
  },
};

export class LlmProviderService {
  /**
   * Resuelve dinámicamente la configuración activa de proveedor y credenciales desde variables de entorno
   * o parámetros explícitos por consulta.
   * @param {Object} overrides
   */
  resolveActiveConfig(overrides = {}) {
    const rawProvider = (
      overrides.provider ||
      process.env.AI_PROVIDER ||
      (process.env.DEEPSEEK_API_KEY ? 'deepseek' : '') ||
      (process.env.OPENAI_API_KEY ? 'openai' : '') ||
      (process.env.GEMINI_API_KEY ? 'gemini' : '') ||
      (process.env.GROQ_API_KEY ? 'groq' : '') ||
      (process.env.ANTHROPIC_API_KEY ? 'anthropic' : '') ||
      (process.env.AI_LLM_URL ? 'local_ollama' : '') ||
      'deepseek'
    )
      .toLowerCase()
      .trim();

    let providerKey = rawProvider;
    if (rawProvider === 'local' || rawProvider === 'ollama') {
      providerKey = 'local_ollama';
    } else if (rawProvider === 'vllm' || rawProvider === 'lmstudio' || rawProvider === 'llamacpp') {
      providerKey = 'local_openai';
    } else if (rawProvider === 'hf' || rawProvider === 'huggingface_hub') {
      providerKey = 'huggingface';
    } else if (
      rawProvider === 'deepseek' &&
      !overrides.apiKey &&
      !process.env.DEEPSEEK_API_KEY &&
      (process.env.HF_TOKEN || process.env.HUGGINGFACE_HUB_TOKEN)
    ) {
      // Si DeepSeek no tiene API Key pero existe HF_TOKEN configurado, usar Hugging Face Router automáticamente
      providerKey = 'huggingface';
    }

    const preset = PROVIDER_CONFIGS[providerKey] || PROVIDER_CONFIGS.deepseek;

    const providerSpecificEnvKey = {
      deepseek: process.env.DEEPSEEK_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      huggingface: process.env.HF_TOKEN || process.env.HUGGINGFACE_HUB_TOKEN,
    }[providerKey];

    const apiKey =
      overrides.apiKey ||
      providerSpecificEnvKey ||
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_HUB_TOKEN ||
      '';

    const baseUrl = (
      overrides.baseUrl ||
      process.env.AI_BASE_URL ||
      process.env.AI_LLM_URL ||
      preset.baseUrl
    ).replace(/\/+$/, '');

    const model =
      overrides.model || process.env.AI_MODEL || process.env.AI_LLM_MODEL || preset.defaultModel;

    const timeoutMs = Number(overrides.timeoutMs || process.env.AI_LLM_TIMEOUT_MS || 20000);

    return {
      providerKey,
      providerName: preset.name,
      protocol: preset.protocol,
      baseUrl,
      chatPath: preset.chatPath,
      model,
      apiKey,
      timeoutMs,
      isConfigured:
        preset.protocol === 'ollama' || providerKey === 'local_openai'
          ? Boolean(
              overrides.baseUrl ||
              process.env.AI_LLM_URL ||
              process.env.AI_BASE_URL ||
              process.env.AI_PROVIDER === 'local' ||
              process.env.AI_PROVIDER === 'ollama'
            )
          : Boolean(apiKey),
    };
  }

  /**
   * Genera una respuesta de chat utilizando el proveedor configurado (DeepSeek, OpenAI, Gemini, Anthropic o Modelo Local Afinado)
   * e intenta fallback al modelo local si está disponible.
   * @param {Object} params
   */
  async generateChatCompletion({
    systemPrompt,
    messages = [],
    temperature = 0.1,
    maxTokens = 2048,
    providerOverrides = {},
  }) {
    const primaryConfig = this.resolveActiveConfig(providerOverrides);

    // 1. Intentar proveedor primario si está configurado
    if (primaryConfig.isConfigured) {
      const primaryResult = await this.executeProviderCall(primaryConfig, {
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });

      if (primaryResult) {
        return {
          content: primaryResult,
          provider: primaryConfig.providerName,
          model: primaryConfig.model,
        };
      }
    }

    // 2. Si el primario era una API externa y falló o no tiene key, intentar modelo local afinado (Ollama) si AI_LLM_URL existe
    if (primaryConfig.providerKey !== 'local_ollama' && process.env.AI_LLM_URL) {
      const localConfig = this.resolveActiveConfig({
        provider: 'local_ollama',
        baseUrl: process.env.AI_LLM_URL,
        model: process.env.AI_LOCAL_MODEL || process.env.AI_LLM_MODEL || 'ecuador-erp-ai',
      });

      const localResult = await this.executeProviderCall(localConfig, {
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });

      if (localResult) {
        return {
          content: localResult,
          provider: localConfig.providerName,
          model: localConfig.model,
        };
      }
    }

    return null;
  }

  /**
   * Ejecuta la petición HTTP según el protocolo del proveedor (OpenAI/DeepSeek, Ollama o Anthropic)
   * @private
   */
  async executeProviderCall(config, { systemPrompt, messages, temperature, maxTokens }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      if (config.protocol === 'anthropic') {
        const res = await fetch(`${config.baseUrl}${config.chatPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt,
            messages: messages.map((m) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data?.content?.[0]?.text || null;
      }

      if (config.protocol === 'ollama') {
        const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        const res = await fetch(`${config.baseUrl}${config.chatPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages: fullMessages,
            stream: false,
            options: {
              temperature,
              top_p: 0.9,
              num_predict: maxTokens,
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data?.message?.content || null;
      }

      // Protocolo estándar OpenAI-Compatible (DeepSeek, OpenAI, Gemini OpenAI endpoint, Groq, vLLM, LM Studio)
      const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];
      const headers = { 'Content-Type': 'application/json' };
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }

      // Si el baseUrl ya incluye /v1 y chatPath empieza por /chat/completions, concatenar limpiamente
      const endpointUrl = `${config.baseUrl}${config.chatPath}`;
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: fullMessages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default new LlmProviderService();
