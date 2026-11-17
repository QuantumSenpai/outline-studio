# Verified development sources

Checked 17 November 2026. These checks verify public documentation and package metadata, not the operator's Vercel/Neon plan, credentials, quota or live provider access. No model generation was requested for this research.

## Stable versions and compatibility

The npm `latest` dist-tags were read with `pnpm view <package> version`; release pages independently confirmed the major framework/library versions. No canary or RC is required.

| Package | Stable version checked | Compatibility finding |
|---|---|---|
| next | 16.4.6 | Node >=20.9; React/React DOM ^19 supported |
| react / react-dom | 19.3.1 | Stable React 19 release |
| hono | 4.13.19 | Compatible with @hono/vercel peer >=4.13.9 |
| @hono/vercel | 1.0.1 | Official Next.js Node route handler adapter |
| drizzle-orm | 0.45.4 | Stable release; newest docs also show optional v1 RC |
| drizzle-kit | 0.31.11 | Stable migration tooling |
| @neondatabase/serverless | 1.2.1 | Node >=19; HTTP driver suitable for bounded serverless queries |
| xstate | 5.33.4 | XState v5 stable |
| @xstate/react | 6.1.0 | React ^19 and XState ^5.28 supported |
| zustand | 5.1.0 | Stable Zustand 5 release |
| tailwindcss / @tailwindcss/postcss | 4.3.5 | Tailwind v4 PostCSS integration |

Official sources:

- [Next.js install and requirements](https://nextjs.org/docs/app/getting-started/installation), [stable release](https://github.com/vercel/next.js/releases/tag/v16.4.6).
- [React stable release](https://github.com/react/react/releases/tag/v19.3.1).
- [Hono supported Next.js integration](https://hono.dev/docs/getting-started/nextjs), [Hono stable release](https://github.com/honojs/hono/releases/tag/v4.13.19).
- [Drizzle Neon integration](https://orm.drizzle.team/docs/connect-neon), [stable ORM release](https://github.com/drizzle-team/drizzle-orm/releases/tag/0.45.4), [Neon driver](https://neon.com/docs/serverless/serverless-driver).
- [XState installation](https://stately.ai/docs/installation), [promise actors and AbortSignal](https://stately.ai/docs/promise-actors), [stable release](https://github.com/statelyai/xstate/releases/tag/xstate%405.33.4).
- [Zustand stable release](https://github.com/pmndrs/zustand/releases/tag/v5.1.0), [Tailwind stable release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.5).

Hono's current integration imports `handle` from `@hono/vercel` in `app/api/[[...route]]/route.ts` and runs on the Node runtime. Drizzle's `neon-http` suits single/noninteractive transactions; `db.batch` provides atomic noninteractive batches. Interactive transactions require a different driver strategy. XState `fromPromise` actors receive an abort signal; stopping an actor aborts its asynchronous work when the signal is forwarded to fetch. Context7 supplied the corresponding official-source examples during development.

## Provider setup

Only provider key pages and public instructions were inspected. A successful model-list request establishes key/list access; it does not prove successful inference or sufficient credits for the selected model. Model availability changes and should be checked at connection time.

| Provider | Official key link | Setup |
|---|---|---|
| NVIDIA | [API Catalog](https://build.nvidia.com/explore/discover) | Sign in, choose a hosted text model, select Get API Key, follow account/model terms, copy the key into Outline Studio. |
| Groq | [GroqCloud API keys](https://console.groq.com/keys) | Sign in, choose the intended project, create a key with an allowed owner/developer role, copy it into Outline Studio. |
| Gemini | [Google AI Studio keys](https://aistudio.google.com/apikey) | Sign in, choose/create a project, create the supported API key, check project billing/quota, copy it into Outline Studio. |
| OpenRouter | [API keys](https://openrouter.ai/settings/keys) | Sign in, create a key with a spend limit, select a compatible model, check pricing/credits, copy the key into Outline Studio. |

- NVIDIA [quickstart](https://docs.api.nvidia.com/nim/docs/api-quickstart) and [LLM API reference](https://docs.api.nvidia.com/nim/reference/llm-apis): `https://integrate.api.nvidia.com/v1/chat/completions`; documented models include `meta/llama-3.3-70b-instruct`. Catalog access described as development access is not a promise of unlimited or permanent free inference.
- Groq [quickstart](https://console.groq.com/docs/quickstart), [API reference](https://console.groq.com/docs/api-reference), [models](https://console.groq.com/docs/models): base `https://api.groq.com/openai/v1`; `GET /models`, `POST /chat/completions`. Current public production entries include `openai/gpt-oss-20b` and `openai/gpt-oss-120b`; Llama 3.1/3.3 entries are marked Enterprise/contact sales. Verify account availability rather than assuming old models remain free.
- Gemini [key instructions](https://aistudio.google.com/docs/api-key), [OpenAI compatibility](https://aistudio.google.com/docs/openai), [models](https://aistudio.google.com/docs/models): base `https://generativelanguage.googleapis.com/v1beta/openai/` supports model listing and chat completions with Bearer authentication. New AI Studio keys default to authorization keys since May 28, 2026; unrestricted standard keys are rejected. Examples use `gemini-4-hydrogen`; `gemini-3.8-flash` is labelled stable. Omit custom temperature/top_p/top_k for newer models, which ignore these parameters and warn of future rejection.
- OpenRouter [quickstart](https://openrouter.ai/docs/quickstart), [API reference](https://openrouter.ai/docs/api/reference/overview), [model listing](https://openrouter.ai/docs/api-reference/models/get-models): base `https://openrouter.ai/api/v1`; `/models` includes modality, supported parameters and pricing. Restrict chosen models to compatible text outputs; an explicit user permission is required before using paid models.

All four services have account-, model- and region-dependent terms, quotas and availability. Do not imply that a configured key supplies unlimited free capacity. No Cerebras or Mistral onboarding/adapters were verified in this research.

## Errors and switching

[Groq error guidance](https://console.groq.com/docs/errors) distinguishes invalid credentials, permissions, rate limits, model/request errors and transient server errors. [Gemini retry guidance](https://aistudio.google.com/docs/troubleshooting) recommends exponential backoff with jitter, a retry ceiling and retrying transient failures, not invalid requests/credentials or depleted credits. [OpenRouter error guidance](https://openrouter.ai/docs/api-reference/errors) includes mid-stream errors, so HTTP 200 alone cannot establish successful generation. Respect `Retry-After` where supplied. A 402 with an in-flight-budget retry header differs from depleted account credit; typed limit metadata should drive that distinction. A moderation/permission block must not trigger restriction-bypassing key cycling. Cancellation cannot promise a usage refund.

## Hosting limits and unresolved account checks

[Vercel Function limits](https://vercel.com/docs/functions/limitations) document Fluid compute Hobby maximum/default duration of 300 seconds, 2 GB memory and a 250 MB uncompressed function bundle. Non-Fluid configurations differ. A bounded application deadline must remain below its explicitly configured function duration. The actual account/project configuration has not been inspected and must be checked before deployment.

[Neon pricing](https://neon.com/pricing) currently lists Free allowances of 100 CU-hours monthly per project and 1 GB project storage. These are public allowances, not evidence of this operator's plan, remaining quota or region. Keep credentials server-only and plan for cold resume latency, expiration and retention.

Closed-browser execution is not part of the browser-scheduled implementation. If required later, [Vercel Workflows](https://vercel.com/docs/workflows) is a supported option. Its [current pricing/limits](https://vercel.com/docs/workflows/pricing) show Hobby allowances of 50,000 events/month and 1 GB written data; retained workflow data is unavailable on Hobby. On-demand rates are $0.02/1K events, $0.50/GB written and $0.50/GB-month retained, with Functions and Queues billed separately. Evaluate the operator's eligible plan, privacy/retention and expected cost before adoption; this research does not authorize adoption or paid resources.
