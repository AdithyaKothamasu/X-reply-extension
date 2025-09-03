// Background service worker (MV3)
// Handles Gemini 2.5 Flash calls and messaging from content scripts

const SETTINGS_KEYS = {
	apiKey: 'gemini_api_key',
	tone: 'default_tone',
	maxChars: 'max_chars',
	emoji: 'emoji_enabled'
};

async function loadSettings() {
	return new Promise((resolve) => {
		chrome.storage.local.get(Object.values(SETTINGS_KEYS), (items) => {
			resolve(items || {});
		});
	});
}

function buildPrompt({ tweet, context, tone, maxChars, emoji }) {
	const safeTone = tone || 'Friendly';
	const limit = maxChars || 200;
	return `You are a helpful assistant composing short, respectful, context-aware replies for X/Twitter.
- Keep the reply under ${limit} characters.
- Tone: ${safeTone}.
- ${emoji ? 'Emojis are allowed, use sparingly if helpful.' : 'Do not use emojis.'}
- Consider the images in the tweet, use the image link to see whats in the image to get a better idea of the context.
- Avoid toxicity, slurs, personal attacks, links, and hashtags unless strictly relevant.
- Keep it one concise line.

Tweet: "${tweet}"
${context ? `Context: "${context}"` : ''}
Reply:`;
}

async function callGeminiFlash({ prompt, apiKey }) {
	if (!apiKey) {
		throw new Error('Missing Gemini API key. Set it in the extension options.');
	}
	// Gemini 2.5 Flash via Google AI Studio REST
	const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey);
	const body = {
		contents: [
			{
				role: 'user',
				parts: [{ text: prompt }]
			}
		]
	};
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Gemini API error: ${res.status} ${text}`);
	}
	const data = await res.json();
	const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
	return candidate.trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === 'GENERATE_REPLY') {
		(async () => {
			try {
				const userSettings = await loadSettings();
				const prompt = buildPrompt({
					tweet: message.payload.tweet,
					context: message.payload.context,
					tone: message.payload.tone || userSettings[SETTINGS_KEYS.tone],
					maxChars: message.payload.maxChars || userSettings[SETTINGS_KEYS.maxChars],
					emoji: typeof message.payload.emoji === 'boolean' ? message.payload.emoji : userSettings[SETTINGS_KEYS.emoji]
				});
				const apiKey = userSettings[SETTINGS_KEYS.apiKey];
				const text = await callGeminiFlash({ prompt, apiKey });
				sendResponse({ ok: true, text });
			} catch (err) {
				sendResponse({ ok: false, error: err?.message || 'Unknown error' });
			}
		})();
		return true; // keep the message channel open for async response
	}
});

// Open options page when clicking the toolbar icon
chrome.action.onClicked.addListener(() => {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		// Fallback direct URL
		const url = chrome.runtime.getURL('src/options.html');
		chrome.tabs.create({ url });
	}
});
