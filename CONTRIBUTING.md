# Contributing to Pomidor (Помидор)

Thank you for your interest in contributing! This project thrives on community involvement.

## Ways to Contribute

### 🌍 Add a Language Translation

The easiest and most impactful way to contribute:

1. Open `js/modules/i18n.js`
2. Find the `translations` object
3. Copy the `en` block and create a new key for your language code (e.g., `es`, `de`, `ja`, `zh`)
4. Translate all strings
5. Submit a PR with the title: `i18n: Add [Language] translation`

**Example:**

```javascript
es: {
  settings: "Configuración",
  language: "Idioma",
  // ... translate all keys
}
```

### 🐛 Fix a Bug

1. Check [open issues](../../issues) for bugs
2. Comment that you're working on it
3. Fork, fix, test, PR

### ✨ Add a Feature

1. Check [ROADMAP.md](ROADMAP.md) for planned features
2. Open an issue describing your proposed implementation
3. Wait for feedback before starting major work
4. Fork, implement, test, PR

### 🎨 Create a Theme

1. Study the existing themes in `css/styles.css` (search for `data-app-theme`)
2. Add your theme's CSS overrides
3. Add the option to the theme selector in `index.html`
4. Submit a PR with screenshots

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/pomidor.git
cd pomidor

# No build step — just serve the files
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` (or whatever port) in your browser.

## Code Style

- **No build tools** — This project intentionally uses zero dependencies
- **ES Modules** — Use `import`/`export` for all JavaScript
- **CSS Custom Properties** — Use design tokens from `variables.css`
- **Semantic HTML** — Use proper elements, ARIA attributes where needed
- **No external JS dependencies** — Vanilla JavaScript only

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Test in both light and dark mode
4. Test in both English and Russian
5. Ensure the PWA still works offline (check service worker)
6. Submit your PR with a clear description

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Spanish translation
fix: calendar not showing tasks on correct day
style: improve mobile responsiveness for timer
i18n: add German translation
docs: update README with new features
```

## Code of Conduct

Be kind, be respectful, be constructive. We're all here to build something great together.
