type Framework = 'playwright' | 'jest' | 'vitest' | 'unknown';

function detectFramework(): Framework {
    const env = process.env;
    if (env['TEST_WORKER_INDEX'] !== undefined) return 'playwright';
    if (env['JEST_WORKER_ID'] !== undefined) return 'jest';
    if (env['VITEST'] !== undefined) return 'vitest';
    return 'unknown';
}

interface ContextAdapter {
    set(type: string, value: string): void;
}

/**
 * Pushes metadata into test.info().annotations.
 * The reporter reads these back via test.annotations in onTestEnd.
 */
class PlaywrightContext implements ContextAdapter {
    set(type: string, value: string): void {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { test } = require('@playwright/test');
            const info = test.info();
            if (info) {
                info.annotations.push({ type, description: value });
            }
        } catch {
            // Not inside a Playwright worker — silently ignore.
        }
    }
}

/**
 * For runners without per-test annotation APIs, we use a module-level Map.
 * Key = current test name (from expect.getState()), value = annotations.
 */
const globalStore = new Map<
    string,
    Array<{ type: string; description: string }>
>();

class GlobalStoreContext implements ContextAdapter {
    set(type: string, value: string): void {
        const testName = this.currentTestName() ?? '__default__';
        let entries = globalStore.get(testName);
        if (!entries) {
            entries = [];
            globalStore.set(testName, entries);
        }
        entries.push({ type, description: value });
    }

    private currentTestName(): string | undefined {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { expect } = require('expect');
            const state = expect.getState() as {
                currentTestName?: string;
            };
            return state.currentTestName ?? undefined;
        } catch {
            return undefined;
        }
    }
}

/** Drain and clear stored annotations for a Jest/Vitest test name. */
export function drainGlobalStore(
    testName: string,
): Array<{ type: string; description: string }> {
    const key = globalStore.has(testName) ? testName : '__default__';
    const entries = globalStore.get(key) ?? [];
    globalStore.delete(key);
    return entries;
}

let cachedContext: ContextAdapter | null = null;

export function getContext(): ContextAdapter {
    if (!cachedContext) {
        const fw = detectFramework();
        cachedContext =
            fw === 'playwright'
                ? new PlaywrightContext()
                : new GlobalStoreContext();
    }
    return cachedContext;
}


