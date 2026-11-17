# Provider setup and verification

Open **Connect provider** in the hero or workspace. Choose NVIDIA, Groq, Gemini or OpenRouter, enter a key, validate the model list, choose a text/chat candidate and explicitly authorize its potential usage costs. Listing models is not an inference capability test. Defaults are suggestions, not a guarantee of availability.

Keys stay in memory unless the user saves the encrypted local vault. Lock clears in-memory connections; unlock requires the passphrase and revalidation; forgetting/clearing is explicit. A wrong passphrase preserves encrypted records. Never put real keys into fixtures, screenshots, URLs, logs or project ZIPs.

Optional automatic switching requires enabled, configured and authorized models. It is bounded to three attempts and respects cooldowns; credentials and depleted credit require attention. Every switch is shown. Cancellation cannot refund upstream usage. OpenRouter's own upstream fallback is disabled so user-visible switching remains controlled.

## Official setup references

- NVIDIA: https://docs.api.nvidia.com/nim/docs/api-quickstart and https://build.nvidia.com/ — account access/credits and terms vary.
- Groq: https://console.groq.com/keys and https://console.groq.com/docs/models — model availability, quotas and paid tiers vary.
- Google: https://aistudio.google.com/docs/api-key and https://aistudio.google.com/docs/openai — current key restrictions/auth setup and billing must be checked in the provider console.
- OpenRouter: https://openrouter.ai/settings/keys and https://openrouter.ai/pricing — models labelled free can still have limits; paid models incur charges.

The four adapters passed synthetic model-list/stream contract tests and error classification. Live AI inference was not performed: no authorized test provider credentials were supplied. No provider is certified permanently free. Structured JSON is schema-validated; unsupported or malformed output is rejected rather than presented as completed work.
