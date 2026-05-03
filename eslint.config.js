import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: [
      'node_modules/',
      '.env',
      'Backup.js', // Vi que você tem esse arquivo no projeto
      '*.jpeg', // Ignora imagens para o linter não tentar 'ler' binários
    ],
  },
  pluginJs.configs.recommended,
  {
    languageOptions: {
      // Aqui é o pulo do gato: trocar 'browser' por 'node'
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off', // Em bots de automação, a gente usa muito console.log pra debugar
      semi: ['error', 'always'],
      quotes: ['error', 'double', 'single', { allowTemplateLiterals: true }],
    },
  },
];
