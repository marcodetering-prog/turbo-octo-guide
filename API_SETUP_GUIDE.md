# ML API Setup Guide

This guide walks you through setting up and configuring the real ML API integrations.

---

## Quick Start

1. Get API keys (see below)
2. Open the app → Click "ML Settings"
3. Enter your API keys
4. Click "Test Connection" to verify
5. Upload a CSV to see ML features in action

---

## API Keys Setup

### 1. Hugging Face API Key (for Sentiment & Topic Modeling)

**Why you need it**:
- Sentiment Analysis: Analyzes conversation tone (positive/negative/neutral)
- Topic Modeling: Identifies issue categories (plumbing, heating, electrical, etc.)

**How to get it**:
1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Create a read-only token
4. Copy the token (starts with `hf_`)

**Enter in ML Settings**:
- Sentiment Analysis API Key: `hf_...`
- Topic Modeling API Key: `hf_...` (same key can be used for both)

**Test it**:
1. Paste your Hugging Face key
2. Click "Test Connection"
3. Should see: ✓ "Connected!"

**Cost**: Free for up to 30k requests/month (then $0.001/request)

---

### 2. OpenAI API Key (for Context Enhancement)

**Why you need it**:
- Context Enhancement: Groups similar conversations together semantically
- Creates embeddings (numerical representations of conversation meaning)

**How to get it**:
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

**Enter in ML Settings**:
- Context Enhancement API Key: `sk-...`

**Test it**:
1. Paste your OpenAI key
2. Click "Test Connection"
3. Should see: ✓ "Connected!"

**Cost**: ~$0.20 per 1,000 conversations (very cheap)

**Note**: OpenAI Embeddings API is separate from ChatGPT. The embeddings API is much cheaper.

---

## Configuration Options

### Sentiment Analysis
```
Enabled: Toggle ON/OFF
Provider: Hugging Face
API Key: Your HF token (hf_...)
Model: (Optional) Change model if needed
```

**Models Available**:
- `distilbert-base-uncased-finetuned-sst-2-english` (default - fastest)
- `roberta-base-openai-detector` (more accurate)

### Topic Modeling
```
Enabled: Toggle ON/OFF
Method: Hugging Face BART
API Key: Your HF token (hf_...)
Model: (Optional) Advanced model selection
```

**Built-in Topics**:
- plumbing, heating, electrical, appliances, maintenance, repair, inspection, construction, installation, damage, water issues, hvac, safety

Topics detected automatically. New topics added if appearing in >20% of conversations.

### Context Enhancement
```
Enabled: Toggle ON/OFF
Provider: OpenAI
API Key: Your OpenAI key (sk-...)
```

**How it works**:
1. Converts conversations to numerical embeddings
2. Groups similar conversations into clusters
3. Identifies common themes per cluster
4. Calculates semantic similarity score

### Predictive Analytics
```
Enabled: Toggle ON/OFF
```

**Note**: No API key required. Uses historical data from previous periods.

---

## Testing the Setup

### Test 1: Verify API Connections
1. Click "ML Settings"
2. For each enabled feature, click "Test Connection"
3. All should show: ✓ "Connected!"

### Test 2: Upload a Sample CSV
1. Select a client
2. Create a new period (or use existing)
3. Upload a CSV with tenant conversations
4. Watch the progress bar during processing
5. Progress message should show: "Processing with AI + ML"

### Test 3: View ML Insights
1. After upload completes, click on the period
2. Scroll down to "ML-Enhanced Insights" section
3. Verify you see:
   - ✅ Sentiment Analysis (satisfaction/frustration rates)
   - ✅ Emerging Topics (list of detected topics)
   - ✅ Context Clusters (conversation groupings)
   - ✅ Predictions (next period forecast)

---

## Understanding the ML Output

### Sentiment Analysis
Shows what percentage of conversations are positive, negative, or neutral.

Example:
```
Satisfaction Rate: 85%      ████████████ (green bar)
Frustration Rate: 10%       ██ (red bar)

Breakdown:
Positive: 85    Neutral: 5    Negative: 10
```

**What it means**:
- High satisfaction = happy customers
- High frustration = problems to address
- Combines with AI analysis for better accuracy

### Emerging Topics
Lists the most common issue categories found in conversations.

Example:
```
1. Heating - 35% (42 conversations)
2. Plumbing - 25% (30 conversations)
3. Electrical - 20% (24 conversations)
```

**What it means**:
- Top issues your team deals with most
- Helps prioritize resource allocation
- Identifies emerging problem areas

### Context Clusters
Groups conversations by semantic similarity (meaning).

Example:
```
Semantic Similarity: 78%

Cluster 1 (12 conversations)
  Water Damage Issues

Cluster 2 (8 conversations)
  HVAC System Problems
```

**What it means**:
- Conversations about similar problems grouped together
- Similarity score shows how cohesive each cluster is
- Helps identify conversation patterns

### Predictions
Forecasts next period KPI values and trends.

Example:
```
Confidence Level: MEDIUM

Predicted Metrics:
📈 Satisfaction Rate: 87% (increasing)
➡️ Success Rate: 92% (stable)
📉 Avg Response Time: 2.2 hours (decreasing)
```

**What it means**:
- Based on historical trends
- Confidence level: LOW (high variability), MEDIUM (moderate), HIGH (very stable)
- Trend indicators: 📈 improving, 📉 declining, ➡️ stable

---

## Troubleshooting

### "Test Connection Failed"

**For Hugging Face**:
- Check API key is correct (copy/paste carefully)
- Verify token isn't expired
- Check internet connection
- Try with a simple test: https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english

**For OpenAI**:
- Check API key starts with `sk-`
- Verify you have API credits
- Check account isn't on free trial with restrictions
- Try account at https://platform.openai.com/account/api-keys

### ML Features Show No Results

1. Check "Processing Notices" section for errors
2. Verify API key is still valid
3. Check that CSV has actual conversation data
4. Ensure conversations have tenant messages (MessageType = 3)

### Processing is Very Slow

**Normal behavior**:
- Sentiment: ~50-100ms per message
- Context Embeddings: Can be slow if 500+ conversations
- Full processing: Usually <10 seconds total

**If slower**:
- Hugging Face might be rate-limited (wait a minute)
- OpenAI might be slow (usually fast, check status at https://status.openai.com)
- Disable some features to speed up (uncheck unused features)

### API Costs Are Unexpected

**Cost breakdown** (per 1,000 conversations):
- Sentiment Analysis: Free (first 30k/month)
- Topic Modeling: Free (first 30k/month)
- Context Embeddings: $0.20
- Predictive Analytics: $0.00 (no API cost)
- **Total: ~$0.20 per 1,000 conversations**

### "API Key Invalid" After Upload

- Keys may expire (Hugging Face tokens sometimes have expiration)
- Permissions might have been revoked
- Try regenerating the key and updating settings

---

## Advanced Configuration

### Using Different Models

If you want to try different AI models:

**Sentiment Analysis Models**:
- Better accuracy (slower): `roberta-base-openai-detector`
- Faster (good for large data): `distilbert-base-uncased-finetuned-sst-2-english`

**Topic Modeling Models**:
- Default (good balance): `facebook/bart-large-mnli`
- More accurate: `facebook/bart-large-mnli-zero-shot-dist` (if available)

### Rate Limiting

Hugging Face free tier rate limits:
- ~10 requests per second for inference API
- App automatically waits if rate limited

OpenAI rate limits:
- Varies by plan
- $5/month free trial: 3 requests per minute
- Paid account: Much higher limits

### Batch Processing

For large datasets (500+ conversations), services use:
- **Sentiment**: Message batching (faster)
- **Topics**: Conversation text batching
- **Context**: Vector batch embeddings (efficient)
- **Predictions**: Batch KPI extraction

---

## What Gets Stored?

**In localStorage** (browser):
- API keys (encrypted display, stored as plaintext - be careful!)
- Feature toggles (what features are enabled)
- Settings (no sensitive data beyond keys)

**In Database** (Period Analytics):
- Sentiment breakdown (positive/neutral/negative counts)
- Topic distribution (plumbing: 35%, etc.)
- Cluster data (cluster themes and sizes)
- Predictions (next period forecast)
- Processing errors (if any)

**NOT stored**:
- Individual message content
- Full conversation text
- API responses
- Embeddings (calculated on-the-fly)

---

## Security Notes

⚠️ **Important**:
1. API keys are sensitive - never share them
2. Keep keys in ML Settings, not in code
3. Regenerate keys if you suspect compromise
4. Use read-only Hugging Face tokens when possible
5. Monitor OpenAI costs (set billing limits)

**Browser Storage**:
- API keys stored in localStorage (browser-local only)
- Not transmitted to other services
- Lost if browser data cleared
- Not backed up - keep your original keys safe

---

## Disabling Features

If a feature has issues or costs too much:

1. Click "ML Settings"
2. Uncheck the feature to disable
3. Click "Save Settings"
4. That feature won't process on next CSV upload

You can re-enable at any time.

---

## Performance Tuning

### If Processing is Slow

**Disable Context Enhancement**:
- It's the slowest (calls OpenAI Embeddings API)
- Run without it: sentiment + topics only
- Re-enable once you have Hugging Face working

**Disable Predictive Analytics** (if no historical data):
- Only useful with 3+ previous periods
- Minimal performance impact but no benefit early on

### If You're Running Out of API Budget

1. Disable Context Enhancement (costs most)
2. Only enable Sentiment (biggest KPI impact)
3. Use monthly budgets (process less frequently)

---

## Next Steps

1. ✅ Get API keys from Hugging Face and OpenAI
2. ✅ Enter keys in ML Settings
3. ✅ Test connections
4. ✅ Upload a CSV file
5. ✅ Review ML insights in the analytics
6. ✅ Compare with non-ML analytics to see improvements

---

## Support

For API issues:
- Hugging Face Docs: https://huggingface.co/docs/inference-api
- OpenAI Docs: https://platform.openai.com/docs/guides/embeddings
- Status Pages:
  - Hugging Face: https://status.huggingface.co/
  - OpenAI: https://status.openai.com/

For app issues:
- Check ML_TESTING_GUIDE.md
- Check console for detailed error messages
- Review "Processing Notices" in ML Insights panel

---

## Quick Reference

| Feature | API | Cost | Speed | Impact |
|---------|-----|------|-------|--------|
| Sentiment | Hugging Face | Free | Fast | ⭐⭐⭐⭐⭐ |
| Topics | Hugging Face | Free | Fast | ⭐⭐⭐⭐ |
| Context | OpenAI | $0.20/1k | Slow | ⭐⭐⭐ |
| Predictions | Local | Free | Instant | ⭐⭐⭐ |

**Recommended Setup**:
- Start with: Sentiment + Predictions (no OpenAI cost, big impact)
- Add later: Topics (extra insights)
- Optional: Context (if budget allows)

---

## Glossary

**Embedding**: A numerical representation of text meaning (1536 numbers for OpenAI)

**Zero-shot Classification**: Classifying text without training data (using BART)

**Confidence**: How sure the model is about its prediction (0-1)

**Exponential Smoothing**: Averaging technique that weights recent data more heavily

**Trend Indicator**: Direction of change (📈 up, 📉 down, ➡️ stable)

---

Version: 1.0
Last Updated: 2024-01-30
