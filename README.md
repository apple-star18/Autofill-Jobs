# Autofill Jobs

Autofill Jobs is a Chrome extension that fills repetitive job application forms with your saved profile, resume, education, work history, and preferences. It is built with Vue 3, TypeScript, Vite, and Chrome Extension Manifest V3.

The extension currently targets common job application flows on Greenhouse, Lever, Dover, and Workday.

## Features

- Popup action for filling the active supported job application page.
- Options page for managing profile data, education, work experience, skills, job preferences, legal details, and field mappings.
- Resume PDF upload and reuse for supported file inputs.
- Chrome storage based settings, with smaller profile values in `chrome.storage.sync` and larger local data such as resumes in `chrome.storage.local`.
- Optional DeepSeek-powered answers for required free-text questionnaire fields.
- Custom field mapping keywords for name, email, and phone detection.

## Supported Platforms

- Greenhouse: `job-boards.greenhouse.io` and `boards.greenhouse.io`
- Lever: `jobs.lever.co`
- Dover: `app.dover.com`
- Workday: `*.workday.com` and `*.myworkdayjobs.com`

Workday forms can render fields lazily as each step appears. Keep the application tab open at a full desktop size for the most reliable field detection.

## Getting Started

You can install the published extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/autofill-jobs/mfnfecldidgkknamdfibcdnmcjlaogpc), or build it locally.

### Local Build

```bash
git clone https://github.com/andrewmillercode/Autofill-Jobs.git
cd Autofill-Jobs/src
npm install
npm run build
```

The production extension bundle is written to `dist/` at the repository root.

### Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select the repository's `dist/` folder.

## Development

Run the Vite dev server from the `src` directory:

```bash
cd src
npm run dev
```

Build and type-check the extension:

```bash
cd src
npm run build
```

Useful project paths:

- `src/vue_src/App.vue`: extension popup.
- `src/vue_src/OptionsPage.vue`: extension options page.
- `src/public/manifest.json`: Chrome extension manifest.
- `src/public/contentScripts/autofill.js`: general autofill entry point.
- `src/public/contentScripts/workday.js`: Workday-specific autofill logic.
- `src/public/contentScripts/aiQuestionnaire.js`: AI-assisted questionnaire filling.
- `src/public/background.js`: DeepSeek request bridge for questionnaire answers.

## AI Questionnaire Answers

AI questionnaire filling is optional. To use it:

1. Open the extension settings.
2. Add a DeepSeek API key under AI Settings.
3. Choose a model and save settings.

The extension sends required questionnaire prompts, scraped job-description context, and saved work-experience details to DeepSeek. It is designed to answer conservatively and avoid inventing employment, credential, legal eligibility, salary, sponsorship, demographic, veteran, or disability facts.

## Privacy Notes

Profile data is stored in Chrome extension storage. Resume PDF data is stored locally through `chrome.storage.local`; smaller profile values are stored through `chrome.storage.sync`. DeepSeek requests are only made when AI settings are enabled and an API key is saved.

Review the data you save in the extension and any answers produced by the AI helper before submitting an application.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Maintenance Status

This project is not actively maintained at the moment. Issues and pull requests are still welcome.
