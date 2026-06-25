# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Local frontend checks

From the repository root:

```bash
cd quizmaker-frontend
npm ci
npm run lint
npm test
npm run build
```

Additional test commands:

```bash
npm run test:watch
npm run test:coverage
npm run test:smoke
npm run audit:production
npm run browserslist:update
```

Vitest component and service tests live next to the source they cover as
`*.test.ts` or `*.test.tsx`, or under `src/test` for shared test infrastructure.
Use `src/test/render.tsx` when a component needs app providers such as router,
React Query, theme, auth, feature flags, or toast context. Use MSW handlers from
`src/test/msw` for API-dependent tests instead of calling the real backend.

For focused lint checks during development:

```bash
npx eslint path/to/changed-file.tsx
```

The pull request workflow runs lint, Vitest, browser smoke, and build checks for every pull request to `main`.

## CI/CD

- `.github/workflows/frontend-pr.yml` runs lint, Vitest, browser smoke, and build on every pull request to `main`.
- `.github/workflows/deploy.yml` runs on pushes to `main` and can also be started manually.
- Production deployment first runs `npm ci`, `npm run audit:production`, `npm run lint`, `npm test`, `npm run test:smoke`, and `npm run build` in a validation job.
- Deployment only starts after validation passes.
- Post-deploy smoke checks verify the public site and frontend SPA routing.

## Dependency Maintenance

- Dependabot opens weekly npm dependency PRs for `quizmaker-frontend`.
- Dependabot opens monthly GitHub Actions update PRs.
- `.github/workflows/dependency-maintenance.yml` runs weekly and can be started manually.
- Production dependency vulnerabilities are checked with `npm run audit:production`.
- Browserslist data is checked by running `npm run browserslist:update` and failing if `package.json` or `package-lock.json` would change.
- Before merging dependency PRs, run `npm run lint`, `npm test`, `npm run test:smoke`, and `npm run build`.
- Dev-only audit findings are not part of normal PR or deploy gates unless intentionally promoted to production risk.

Production deployment requires these GitHub secrets:

- `VITE_API_BASE_URL`
- `VITE_SITE_URL`
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
