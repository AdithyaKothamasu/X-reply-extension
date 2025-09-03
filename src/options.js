const SETTINGS_KEYS = {
	apiKey: 'gemini_api_key',
	tone: 'default_tone',
	maxChars: 'max_chars',
	emoji: 'emoji_enabled'
};

function load() {
	chrome.storage.local.get(Object.values(SETTINGS_KEYS), (items) => {
		document.getElementById('apiKey').value = items[SETTINGS_KEYS.apiKey] || '';
		document.getElementById('tone').value = items[SETTINGS_KEYS.tone] || 'Friendly';
		document.getElementById('maxChars').value = items[SETTINGS_KEYS.maxChars] || 200;
		document.getElementById('emoji').checked = items[SETTINGS_KEYS.emoji] !== false;
	});
}

function save(e) {
	e.preventDefault();
	const payload = {};
	payload[SETTINGS_KEYS.apiKey] = document.getElementById('apiKey').value.trim();
	payload[SETTINGS_KEYS.tone] = document.getElementById('tone').value;
	payload[SETTINGS_KEYS.maxChars] = Math.max(80, Math.min(260, parseInt(document.getElementById('maxChars').value, 10) || 200));
	payload[SETTINGS_KEYS.emoji] = !!document.getElementById('emoji').checked;
	chrome.storage.local.set(payload, () => {
		const status = document.getElementById('status');
		status.textContent = 'Saved';
		setTimeout(() => (status.textContent = ''), 1200);
	});
}

document.addEventListener('DOMContentLoaded', () => {
	load();
	document.getElementById('settings-form').addEventListener('submit', save);
});
