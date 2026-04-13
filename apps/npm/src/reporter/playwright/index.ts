import type {
    Reporter,
    FullConfig,
    Suite,
    TestCase,
    TestResult,
    FullResult,
} from '@playwright/test/reporter';
import { randomUUID } from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    unlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
    ReporterConfig,
    ResolvedConfig,
    TestRunPayload,
    RunBatchPayload,
    TestStatus,
    CIInfo,
} from '../../helper/types';
import { parseAnnotations } from '../../helper/flush';
import { uploadTraceIfNeeded } from './trace-handler';

// ── Playwright status → DB status mapping ─────────────────────

const STATUS_MAP: Record<string, TestStatus> = {
    passed: 'passed',
    failed: 'failed',
    skipped: 'skipped',
    timedOut: 'timed_out',
    interrupted: 'not_run',
};

function mapStatus(playwrightStatus: string): TestStatus {
    return STATUS_MAP[playwrightStatus] ?? 'not_run';
}

// ── Config resolution ───────────────────────────────────────

const CONFIG_DEFAULTS: ResolvedConfig = {
    apiUrl: 'http://localhost:8080',
    apiKey: '',
    uploadTraces: true,
    environment: 'local',
};

function resolveConfig(opts: ReporterConfig = {}): ResolvedConfig {
    return {
        apiUrl:
            opts.apiUrl ??
            process.env['ASSERTIVE_API_URL'] ??
            CONFIG_DEFAULTS.apiUrl,
        apiKey:
            opts.apiKey ??
            process.env['ASSERTIVE_API_KEY'] ??
            CONFIG_DEFAULTS.apiKey,
        uploadTraces: opts.uploadTraces ?? CONFIG_DEFAULTS.uploadTraces,
        environment:
            opts.environment ??
            process.env['ASSERTIVE_ENVIRONMENT'] ??
            CONFIG_DEFAULTS.environment,
    };
}

// ── CI detection ────────────────────────────────────────────

function detectCI(): CIInfo {
    const env = process.env;

    if (env['GITHUB_ACTIONS'] === 'true') {
        return {
            triggeredBy: 'ci',
            branch: env['GITHUB_REF_NAME'] ?? env['GITHUB_HEAD_REF'],
            commitSha: env['GITHUB_SHA'],
            ciBuildId: env['GITHUB_RUN_ID'],
            ciBuildUrl:
                env['GITHUB_SERVER_URL'] &&
                env['GITHUB_REPOSITORY'] &&
                env['GITHUB_RUN_ID']
                    ? `${env['GITHUB_SERVER_URL']}/${env['GITHUB_REPOSITORY']}/actions/runs/${env['GITHUB_RUN_ID']}`
                    : undefined,
        };
    }

    if (env['GITLAB_CI'] === 'true') {
        return {
            triggeredBy: 'ci',
            branch: env['CI_COMMIT_REF_NAME'],
            commitSha: env['CI_COMMIT_SHA'],
            ciBuildId: env['CI_PIPELINE_ID'],
            ciBuildUrl: env['CI_PIPELINE_URL'],
        };
    }

    if (env['JENKINS_URL']) {
        return {
            triggeredBy: 'ci',
            branch: env['GIT_BRANCH'],
            commitSha: env['GIT_COMMIT'],
            ciBuildId: env['BUILD_NUMBER'],
            ciBuildUrl: env['BUILD_URL'],
        };
    }

    if (env['CIRCLECI'] === 'true') {
        return {
            triggeredBy: 'ci',
            branch: env['CIRCLE_BRANCH'],
            commitSha: env['CIRCLE_SHA1'],
            ciBuildId: env['CIRCLE_BUILD_NUM'],
            ciBuildUrl: env['CIRCLE_BUILD_URL'],
        };
    }

    if (env['CI'] === 'true') {
        return {
            triggeredBy: 'ci',
            branch: env['BRANCH'] ?? env['GIT_BRANCH'],
            commitSha: env['COMMIT_SHA'] ?? env['GIT_COMMIT'],
        };
    }

    return { triggeredBy: 'local' };
}

// ── HTTP client with retry + disk fallback ──────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;
const PENDING_DIR = '.assertive';
const PENDING_FILE = 'pending-results.json';

async function sendBatchWithRetry(
    batch: RunBatchPayload,
    apiUrl: string,
    apiKey: string,
): Promise<void> {
    const url = `${apiUrl.replace(/\/+$/, '')}/api/v1/test-runs`;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(batch),
            });

            if (res.ok) return;

            if (res.status >= 400 && res.status < 500) {
                const body = await res.text().catch(() => '');
                console.error(
                    `[assertive] API rejected batch (${res.status}): ${body}`,
                );
                return;
            }

            lastError = new Error(`Server error: ${res.status}`);
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
        }

        if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(
                `[assertive] Request failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`,
            );
            await new Promise<void>((r) => setTimeout(r, delay));
        }
    }

    console.error(
        `[assertive] All ${MAX_RETRIES} attempts failed: ${lastError?.message}`,
    );
    writePendingResults(batch);
}

function writePendingResults(payload: RunBatchPayload): void {
    try {
        const dir = join(process.cwd(), PENDING_DIR);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        const filePath = join(dir, PENDING_FILE);
        let existing: RunBatchPayload[] = [];

        if (existsSync(filePath)) {
            existing = JSON.parse(
                readFileSync(filePath, 'utf-8'),
            ) as RunBatchPayload[];
        }

        existing.push(payload);
        writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');

        console.warn(
            `[assertive] Results saved to ${PENDING_DIR}/${PENDING_FILE} — run getassertive sync to upload later.`,
        );
    } catch (err) {
        console.error(
            `[assertive] Failed to write pending results: ${
                err instanceof Error ? err.message : String(err)
            }`,
        );
    }
}

export function readAndClearPendingResults(): RunBatchPayload[] {
    const filePath = join(process.cwd(), PENDING_DIR, PENDING_FILE);
    if (!existsSync(filePath)) return [];

    try {
        const results = JSON.parse(
            readFileSync(filePath, 'utf-8'),
        ) as RunBatchPayload[];
        unlinkSync(filePath);
        return results;
    } catch {
        return [];
    }
}

/**
 * Playwright custom reporter that reads annotations pushed by the
 * `assertive` helper client and sends them as a batch to the API.
 *
 * Usage in playwright.config.ts:
 *
 *   import { defineConfig } from '@playwright/test';
 *
 *   export default defineConfig({
 *       reporter: [
 *           ['getassertive/reporter/playwright', {
 *               apiUrl: 'http://localhost:8080',
 *               apiKey: 'my-key',
 *           }],
 *       ],
 *   });
 */
class AssertiveReporter implements Reporter {
    private config: ResolvedConfig;
    private runBatchId = '';
    private results: TestRunPayload[] = [];

    constructor(options: ReporterConfig = {}) {
        this.config = resolveConfig(options);
    }

    // ── Lifecycle hooks ─────────────────────────────────────────

    onBegin(_config: FullConfig, _suite: Suite): void {
        this.runBatchId = randomUUID();
        this.results = [];
        console.info(`[assertive] Run batch started: ${this.runBatchId}`);
    }

    async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
        // 1. Extract assertive metadata from Playwright annotations
        const meta = parseAnnotations(test.annotations);

        // Skip tests that never called assertive.id()
        if (!meta.testId) return;

        // 2. Upload trace on failure (non-blocking)
        let traceUrl: string | undefined;
        if (
            this.config.uploadTraces &&
            result.status === 'failed' &&
            result.attachments.length > 0
        ) {
            traceUrl = await uploadTraceIfNeeded(
                result.attachments,
                this.config.apiUrl,
                this.config.apiKey,
            );
        }

        // 3. Build payload for this test run
        const payload: TestRunPayload = {
            uniqueId: meta.testId,
            status: mapStatus(result.status),
            durationMs: result.duration,
            tags: meta.tags,
            owner: meta.owner,
            priority: meta.priority,
            testType: meta.testType,
            customFields: meta.customFields,
            attachments: meta.attachments,
            errorMessage: result.error?.message,
            errorStack: result.error?.stack,
            browser: test.parent?.project()?.name,
            os: process.platform,
            attemptNumber: result.retry + 1,
            traceUrl,
        };

        this.results.push(payload);
        console.info(
            `[assertive] ${meta.testId} → ${result.status} (${result.duration}ms)`,
        );
    }

    async onEnd(_result: FullResult): Promise<void> {
        if (this.results.length === 0) {
            console.info(
                '[assertive] No annotated tests found. Nothing to report.',
            );
            return;
        }

        // 4. Detect CI environment for branch/commit/build metadata
        const ci = detectCI();

        // 5. Construct the full batch payload
        const batch: RunBatchPayload = {
            runBatchId: this.runBatchId,
            environment: this.config.environment,
            branch: ci.branch,
            commitSha: ci.commitSha,
            ciBuildId: ci.ciBuildId,
            ciBuildUrl: ci.ciBuildUrl,
            triggeredBy: ci.triggeredBy,
            results: this.results,
        };

        // 6. Send to API (with retries + disk fallback)
        await sendBatchWithRetry(batch, this.config.apiUrl, this.config.apiKey);

        console.info(
            `[assertive] Batch ${this.runBatchId} reported — ` +
                `${this.results.length} result(s).`,
        );
    }
}

export default AssertiveReporter;
