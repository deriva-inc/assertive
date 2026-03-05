/* eslint-disable import/no-extraneous-dependencies */
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';
import { dts } from 'rollup-plugin-dts';
import fs from 'fs';

// Read package.json synchronously and parse it. This is 100% reliable.
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export default [
    // --- JavaScript and TypeScript Bundle ---
    {
        input: 'src/index.ts',
        cli: 'src/cli.ts',
        reporter: 'src/reporter.ts',
        validator: 'src/validator.ts',
        output: [
            {
                dir: 'dist',
                entryFileNames: '[name].cjs',
                format: 'cjs',
                sourcemap: true
            },
            {
                dir: 'dist',
                entryFileNames: '[name].mjs',
                format: 'esm',
                sourcemap: true
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json' }),
            // Ensure the CLI output is executable
            chmod({
                files: ['dist/cli.cjs', 'dist/cli.mjs'],
                mode: '755'
            })
        ],
        // Define external dependencies to avoid bundling them
        external: [
            'react',
            'react-dom',
            ...Object.keys(packageJson.dependencies || {})
        ]
    },
    // --- TypeScript Declaration (.d.ts) Bundle ---
    {
        input: {
            index: 'dist/types/index.d.ts',
            reporter: 'dist/types/reporter.d.ts',
            validator: 'dist/types/validator.d.ts'
        },
        output: [{ dir: 'dist', format: 'esm', entryFileNames: '[name].d.ts' }],
        plugins: [dts()],
        external: [/\.css$/] // Exclude CSS files from the types
    }
];
