// Content script to inject "Suggest reply" button into X/Twitter reply composer

const BUTTON_ID = 'reply-assistant-suggest-btn';
const REGENERATE_ID = 'reply-assistant-regenerate-btn';
const GROUP_ID = 'reply-assistant-group';
let observer;

function createDropdown(id) {
	const container = document.createElement('div');
	container.id = id;
	container.className = 'reply-assistant-dropdown';
	container.style.display = 'inline-flex';
	container.style.alignItems = 'center';
	container.style.marginLeft = '4px';
	container.style.position = 'relative';
	
	// Tone selector
	const toneSelect = document.createElement('select');
	toneSelect.id = id + '-tone';
	toneSelect.style.padding = '4px 6px';
	toneSelect.style.borderRadius = '16px';
	toneSelect.style.border = '1px solid rgba(255,255,255,0.2)';
	toneSelect.style.background = 'transparent';
	toneSelect.style.color = 'inherit';
	toneSelect.style.fontSize = '12px';
	toneSelect.style.marginRight = '4px';
	toneSelect.style.cursor = 'pointer';
	
	const tones = ['Friendly', 'Professional', 'Witty', 'Neutral'];
	tones.forEach(tone => {
		const option = document.createElement('option');
		option.value = tone;
		option.textContent = tone;
		toneSelect.appendChild(option);
	});
	
	// Generate button
	const generateBtn = document.createElement('button');
	generateBtn.id = id + '-generate';
	generateBtn.className = 'reply-assistant-icon';
	generateBtn.type = 'button';
	generateBtn.setAttribute('aria-label', 'Generate reply');
	generateBtn.style.zIndex = '2147483647';
	generateBtn.style.pointerEvents = 'auto';
	generateBtn.innerHTML = `
		<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 3l1.9 4.8L19 9.7l-4.8 1.9L12 16.5l-1.9-4.9L5 9.7l4.9-1.9L12 3zm7 8l1.3 3.2L23 15.5l-3.2 1.3L18.5 20l-1.3-3.2L14 15.5l3.2-1.3L18.5 11zM3 13l1.3 3.2L7.5 17.5 4.3 18.8 3 22 1.7 18.8 0 17.5l3.2-1.3L3 13z"/>
		</svg>`;
	
	container.appendChild(toneSelect);
	container.appendChild(generateBtn);
	
	return { container, toneSelect, generateBtn };
}

function createGroupWrapper() {
	const wrapper = document.createElement('div');
	wrapper.id = GROUP_ID;
	wrapper.setAttribute('role', 'presentation');
	wrapper.style.display = 'inline-flex';
	wrapper.style.alignItems = 'center';
	wrapper.style.marginLeft = '4px';
	return wrapper;
}

function findComposerRoot(node) {
	if (!node) return null;
	const dialog = document.querySelector('[role="dialog"]');
	if (dialog) return dialog;
	return (node.closest && node.closest('article')) || document;
}

function findTextbox(composerRoot) {
	const textboxes = composerRoot.querySelectorAll('[role="textbox"][contenteditable="true"]');
	if (textboxes.length === 0) return null;
	for (const el of textboxes) {
		const rect = el.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) return el;
	}
	return textboxes[0];
}

function findActionBar(composerRoot) {
	// Only target the tablist inside the toolbar
	let tablist = composerRoot.querySelector('[data-testid="ScrollSnap-List"][role="tablist"]');
	if (tablist) return tablist;
	// Don't fallback to other containers to avoid duplicates
	return null;
}

function extractTweetContext() {
	let tweetText = '';
	let context = '';
	const tweetNodes = document.querySelectorAll('article[role="article"] div[lang]');
	if (tweetNodes.length > 0) {
		const last = tweetNodes[0];
		tweetText = (last.textContent || '').trim();
	}
	if (tweetNodes.length > 1) {
		context = ((tweetNodes[1].textContent || '').trim()).slice(0, 240);
	}
	return { tweet: tweetText, context };
}

function insertTextIntoTextbox(textbox, text) {
	textbox.focus();
	try { document.execCommand('selectAll', false, null); } catch (_) {}
	try { document.execCommand('insertText', false, text); } catch (_) {
		textbox.textContent = text;
	}
}

function ensureGroup(container) {
	let group = container.querySelector('#' + GROUP_ID);
	if (!group) {
		group = createGroupWrapper();
		// Place after the geo/location button if present
		const geoBtn = container.querySelector('[data-testid="geoButton"]');
		if (geoBtn && geoBtn.parentElement && geoBtn.parentElement.parentElement === container) {
			geoBtn.parentElement.insertAdjacentElement('afterend', group);
		} else {
			container.appendChild(group);
		}
	}
	return group;
}

function attachButton(composerRoot) {
	// Only inject into the tablist, not other containers
	const tablist = findActionBar(composerRoot);
	if (!tablist) return; // Only proceed if we found the tablist
	
	// Check if dropdown already exists in this specific tablist
	if (tablist.querySelector('#' + BUTTON_ID)) return;
	
	const group = ensureGroup(tablist);
	const { container, toneSelect, generateBtn } = createDropdown(BUTTON_ID);
	
	generateBtn.addEventListener('click', async () => {
		await generateAndInsert(composerRoot, false, toneSelect.value);
	});
	
	group.appendChild(container);
}

async function generateAndInsert(composerRoot, isRegenerate, selectedTone) {
	const textbox = findTextbox(composerRoot);
	if (!textbox) return;
	const { tweet, context } = extractTweetContext();
	const btn = composerRoot.querySelector('#' + (isRegenerate ? REGENERATE_ID : BUTTON_ID) + '-generate');
	
	// Store original text content
	const originalText = textbox.textContent || textbox.innerText || '';
	
	if (btn) {
		btn.disabled = true;
		btn.setAttribute('data-loading', '1');
	}
	
	// Show loading text in the textbox
	insertTextIntoTextbox(textbox, 'Loading...');
	
	try {
		const response = await chrome.runtime.sendMessage({
			type: 'GENERATE_REPLY',
			payload: { tweet, context, tone: selectedTone }
		});
		if (response && response.ok && response.text) {
			// Replace loading text with actual response
			insertTextIntoTextbox(textbox, response.text);
		} else {
			// Restore original text on error
			insertTextIntoTextbox(textbox, originalText);
			showError(btn, (response && response.error) || 'Failed to generate');
		}
	} catch (e) {
		// Restore original text on error
		insertTextIntoTextbox(textbox, originalText);
		showError(btn, (e && e.message) || 'Unexpected error');
	} finally {
		if (btn) {
			btn.disabled = false;
			btn.removeAttribute('data-loading');
		}
	}
}

// Remove showRegenerate function since we don't need separate regenerate button anymore

function showError(btn, message) {
	if (!btn) return;
	btn.title = message;
	btn.style.outline = '2px solid #f66';
	setTimeout(() => {
		btn.style.outline = '';
		btn.title = '';
	}, 1200);
}

function observeComposers() {
	if (observer) observer.disconnect();
	observer = new MutationObserver(() => {
		// Only watch for the dialog and inject into its tablist
		const dialog = document.querySelector('[role="dialog"]');
		if (dialog) attachButton(dialog);
	});
	observer.observe(document.documentElement, { childList: true, subtree: true });
}

(function init() {
	observeComposers();
	const dialog = document.querySelector('[role="dialog"]');
	if (dialog) attachButton(dialog);
})();
