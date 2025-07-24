# Configuration for Chorbit AI

To enable the full AI capabilities of Chorbit, add your OpenAI API key to the .env file:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
# Optional: Override default models (recommended to use defaults)
# OPENAI_MODEL=gpt-4o
```

## Model Selection (Auto-Selected)

Chorbit now automatically selects the best model for each type of question:

- **Factual Questions**: Uses GPT-4o for maximum accuracy (sports scores, dates, current events)
- **General Chat**: Uses GPT-4o-mini for efficient, friendly conversation
- **Behavior Analysis**: Uses GPT-4o for complex psychological insights

This ensures children get accurate information for homework help and factual questions while maintaining cost efficiency for casual chat.

## Fallback System

Without the API key, Chorbit will use intelligent fallback responses that are still engaging but not AI-powered.

Get your API key from: https://platform.openai.com/account/api-keys
