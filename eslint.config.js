import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr', 'artifacts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // shadcn-style kit files intentionally co-export their variant maps, and
    // the SSR entry is a library module rather than a fast-refresh boundary.
    files: ['src/components/ui/**/*.tsx', 'src/lib/query.tsx', 'src/entry-server.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
