import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginNext from '@next/eslint-plugin-next';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export const sharedConfig = [
    // 1. Base JS & TS Recommended
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,

    // 2. Global Ignores
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/build/**',
            '**/out/**',
            '**/public/**',
            '**/*.config.js',
            '**/next-env.d.ts'
        ]
    },

    // 3. React & Next.js Configuration
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react: pluginReact,
            'react-hooks': pluginReactHooks,
            '@next/next': pluginNext,
            turbo: turboPlugin
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.serviceworker
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        },
        settings: {
            react: { version: 'detect' }
        },
        rules: {
            // Turborepo
            'turbo/no-undeclared-env-vars': 'warn',

            // Next.js
            ...pluginNext.configs.recommended.rules,
            ...pluginNext.configs['core-web-vitals'].rules,

            // React Hooks
            ...pluginReactHooks.configs.recommended.rules,

            // Custom Rules
            '@typescript-eslint/no-use-before-define': ['error'],
            indent: [
                'error',
                4,
                { SwitchCase: 1, offsetTernaryExpressions: false }
            ],
            'no-use-before-define': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/jsx-filename-extension': [
                1,
                { extensions: ['.js', '.jsx', '.tsx'] }
            ],
            'react/require-default-props': 'off',
            'react/destructuring-assignment': [0],
            'no-undef': 'off'
        }
    }
];

export default sharedConfig;
