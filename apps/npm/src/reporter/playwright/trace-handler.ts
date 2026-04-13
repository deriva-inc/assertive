import { readFileSync } from 'node:fs';
import type { UploadUrlResponse } from '../../helper/types';

interface TestAttachment {
    name: string;
    contentType: string;
    path?: string;
    body?: Buffer;
}

/**
 * If the test produced a trace.zip attachment, upload it to storage
 * via a pre-signed URL from the API. Returns the traceKey on success,
 * undefined otherwise.
 *
 * Never throws — trace upload failures must not block test reporting.
 */
export async function uploadTraceIfNeeded(
    attachments: TestAttachment[],
    apiUrl: string,
    apiKey: string,
): Promise<string | undefined> {
    const trace = attachments.find(
        (a) => a.name === 'trace' && a.contentType === 'application/zip',
    );
    if (!trace) return undefined;

    try {
        // 1. Read trace data from body or file path
        let traceBuffer: Buffer;
        if (trace.body) {
            traceBuffer = trace.body;
        } else if (trace.path) {
            traceBuffer = readFileSync(trace.path);
        } else {
            console.warn(
                '[assertive] Trace attachment has no body or path. Skipping.',
            );
            return undefined;
        }

        // 2. Request a pre-signed upload URL from the API
        const headers: Record<string, string> = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const urlRes = await fetch(
            `${apiUrl.replace(/\/+$/, '')}/api/v1/test-runs/upload-url`,
            { method: 'GET', headers },
        );

        if (!urlRes.ok) {
            console.warn(
                `[assertive] Upload URL request failed (${urlRes.status}). Skipping trace.`,
            );
            return undefined;
        }

        const { uploadUrl, traceKey } =
            (await urlRes.json()) as UploadUrlResponse;

        // 3. Upload trace directly to storage via the pre-signed URL
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: new Uint8Array(traceBuffer),
            headers: { 'Content-Type': 'application/zip' },
        });

        if (!uploadRes.ok) {
            console.warn(
                `[assertive] Trace upload failed (${uploadRes.status}). Skipping.`,
            );
            return undefined;
        }

        console.info(`[assertive] Trace uploaded: ${traceKey}`);
        return traceKey;
    } catch (err) {
        console.warn(
            `[assertive] Trace upload error: ${
                err instanceof Error ? err.message : String(err)
            }`,
        );
        return undefined;
    }
}
