// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const testingLibrary = require('eslint-plugin-testing-library');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    files: [
      '**/__tests__/**/*.[jt]s?(x)',
      '**/?(*.)+(spec|test).[jt]s?(x)',
    ],
    ...testingLibrary.configs['flat/react'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      // RNTL v14 render/fireEvent are async in React 19; flat/react assumes sync React DOM APIs
      'testing-library/no-await-sync-events': 'off',
      'testing-library/no-unnecessary-act': 'off',
      'testing-library/prefer-screen-queries': 'warn',
      'testing-library/render-result-naming-convention': 'warn',
      'testing-library/prefer-find-by': 'warn',
      'testing-library/no-wait-for-multiple-assertions': 'warn',
      'react/display-name': 'off',
    },
  },

]);
