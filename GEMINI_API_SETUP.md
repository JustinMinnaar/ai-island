# 🔑 Gemini API Configuration

## Where to Add Your API Key

Edit the file: **`f:\Dev\ai-island\js\gemini-api.js`**

Look for this section (around line 5):

```javascript
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE'; // ⬅️ REPLACE THIS
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
```

**Replace `'YOUR_API_KEY_HERE'` with your actual Gemini API key.**

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key or use an existing one
4. Copy the key and paste it into the file

## Example

```javascript
const GEMINI_API_KEY = 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz'; // Your actual key
```

## Testing the Integration

Once you've added your API key:

1. Open the application
2. Click the Generate mode (✨) in the quickbar
3. Drag an area on the map
4. Enter a prompt like "Create a small tavern with tables and chairs"
5. The AI will generate content based on your prompt

## Troubleshooting

If generation doesn't work:
- Check browser console for errors
- Verify API key is correct
- Ensure you have API quota remaining
- Check that CORS is enabled (should work from localhost)

---

**File Location**: `f:\Dev\ai-island\js\gemini-api.js`
