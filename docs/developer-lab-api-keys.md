# Developer Lab API keys

Real local credentials belong only in ignored `.dev.vars`. `.env.local` remains limited to Node-only local utilities such as `LOCAL_RESEARCH_DIR`.

## Bindings

| Provider | Variable |
|---|---|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Groq | `GROQ_API_KEY` |
| Mistral AI | `MISTRAL_API_KEY` |
| NVIDIA | `NVIDIA_API_KEY` |
| Cohere | `COHERE_API_KEY` |
| Together AI | `TOGETHER_API_KEY` |
| Fireworks AI | `FIREWORKS_API_KEY` |
| Cerebras | `CEREBRAS_API_KEY` |
| xAI | `XAI_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |
| DeepInfra | `DEEPINFRA_API_KEY` |
| Replicate | `REPLICATE_API_TOKEN` |
| Hugging Face | `HUGGINGFACE_TOKEN` |
| Stability AI | `STABILITY_API_KEY` |
| ElevenLabs | `ELEVENLABS_API_KEY` |
| Deepgram | `DEEPGRAM_API_KEY` |
| AssemblyAI | `ASSEMBLYAI_API_KEY` |

UI-entered credentials require `DEVELOPER_LAB_ENCRYPTION_KEY`. Use a strong random value. `DEVELOPER_LAB_INTERNAL_TOKEN` is reserved for future non-browser local utilities.

After editing `.dev.vars`, stop and restart `pnpm dev`; workerd reads secrets at startup. Open **Laboratorio de APIs → Conexiones**, choose the provider and click **Probar conexión**. Saving from the UI never tests automatically.

Deleting an environment credential requires editing `.dev.vars` and restarting. Encrypted D1/KV credentials can be deleted from the provider card.

