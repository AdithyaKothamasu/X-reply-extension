# Twitter Reply Assistant

A Chrome extension that uses Gemini 2.5 Flash to generate context-aware replies for X/Twitter posts. The extension adds a tone selector dropdown and generate button directly in the Twitter reply composer.

## Features

- 🎯 **Context-Aware Replies**: Analyzes tweet content and generates relevant responses
- 🎨 **Tone Selection**: Choose from Friendly, Professional, Witty, or Neutral tones
- 🖼️ **Image Context**: Considers images in tweets for better context (via image URLs)
- ⚡ **Quick Access**: Dropdown and generate button directly in the reply composer
- 🔒 **Privacy-Focused**: API key stored locally, no data sent to third parties except Gemini

## Setup Instructions

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key
5. Copy the API key (starts with `AIza...`)

### 2. Install the Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `reply-extension` folder
6. The extension should now appear in your extensions list

### 3. Configure the Extension

1. Click the extension icon in Chrome's toolbar
2. This will open the options page
3. Paste your Gemini API key in the "Gemini API Key" field
4. Adjust other settings as desired:
   - **Default tone**: Choose your preferred default tone
   - **Max characters**: Set maximum reply length (80-260)
   - **Allow emojis**: Toggle emoji usage in replies
5. Click "Save"

### 4. Use the Extension

1. Go to [X.com](https://x.com) or [Twitter.com](https://twitter.com)
2. Find a tweet you want to reply to
3. Click the "Reply" button
4. In the reply composer, you'll see a tone dropdown and sparkle icon
5. Select your desired tone from the dropdown
6. Click the sparkle icon to generate a reply
7. The textbox will show "Loading..." then display the generated reply
8. Edit the reply if needed and post it

## File Structure

```
reply-extension/
├── manifest.json              # Extension configuration
├── src/
│   ├── background.js          # Service worker (Gemini API calls)
│   ├── contentScript.js       # Injects UI and extracts tweet data
│   ├── injected.css          # Styles for the dropdown and buttons
│   ├── options.html          # Settings page
│   ├── options.css           # Settings page styles
│   └── options.js            # Settings page logic
└── README.md                 # This file
```

## How It Works

1. **Content Script**: Monitors Twitter's reply composer and injects the tone dropdown + generate button
2. **Tweet Analysis**: Extracts tweet text, context, and image URLs from the DOM
3. **Background Worker**: Sends data to Gemini 2.5 Flash API with the selected tone
4. **Response Generation**: Gemini analyzes the content and generates a contextual reply
5. **Text Insertion**: The generated reply is inserted into the reply textbox

## API Usage

The extension uses Google's Gemini 2.5 Flash API:
- **Model**: `gemini-2.5-flash`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Rate Limits**: Subject to Google's API limits
- **Cost**: Free tier available, check Google AI Studio for current pricing

## Troubleshooting

### Extension Not Loading
- Ensure you're in Developer mode in Chrome extensions
- Check that all files are in the correct directory structure
- Reload the extension after making changes

### API Key Issues
- Verify your API key is correct and active
- Check that you have API access enabled in Google AI Studio
- Ensure the key has permissions for the Gemini API

### Button Not Appearing
- Refresh the Twitter page
- Make sure you're on x.com or twitter.com
- Check browser console for any JavaScript errors
- Try opening a reply composer to trigger the injection

### Generated Replies Not Good
- Try different tones (Friendly, Professional, Witty, Neutral)
- Adjust the max character limit
- Check that the tweet content is being extracted properly
- Or you can try to change the system prompt to make it more specific to your needs.

## Privacy & Security

- **API Key**: Stored locally in Chrome's storage, never transmitted except to Google
- **Tweet Data**: Only the specific tweet you're replying to is sent to Gemini
- **No Tracking**: The extension doesn't collect or store any personal data
- **Local Processing**: All UI injection and data extraction happens locally

## Development

### Making Changes
1. Edit the source files in the `src/` directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Reload the Twitter page to see changes

### Debugging
- Open Chrome DevTools (F12)
- Check the Console tab for errors
- Use the Extensions page to inspect the service worker
- Check the Network tab to see API calls

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your API key and permissions
3. Check browser console for error messages
4. Ensure you're using the latest version of Chrome

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.
