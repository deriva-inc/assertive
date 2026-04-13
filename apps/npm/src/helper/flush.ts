import type { AssertiveMetadata } from './types';
import { drainGlobalStore } from './context';

/**
 * Parse an array of { type, description } annotations
 * (from Playwright's test.annotations or the global store)
 * into a structured AssertiveMetadata object.
 */
export function parseAnnotations(
    annotations: ReadonlyArray<{ type: string; description?: string }>,
): AssertiveMetadata {
    const meta: AssertiveMetadata = {
        testId: undefined,
        tags: [],
        owner: undefined,
        priority: undefined,
        testType: undefined,
        customFields: {},
        attachments: {},
    };

    for (const ann of annotations) {
        const val = ann.description ?? '';

        switch (ann.type) {
            case 'assertive_id':
                meta.testId = val;
                break;
            case 'assertive_tag':
                meta.tags.push(val);
                break;
            case 'assertive_owner':
                meta.owner = val;
                break;
            case 'assertive_priority':
                meta.priority = val;
                break;
            case 'assertive_type':
                meta.testType = val;
                break;
            default:
                if (ann.type.startsWith('assertive_field_')) {
                    meta.customFields[ann.type.slice('assertive_field_'.length)] =
                        val;
                } else if (ann.type.startsWith('assertive_attach_')) {
                    meta.attachments[ann.type.slice('assertive_attach_'.length)] =
                        val;
                }
                break;
        }
    }

    return meta;
}

/**
 * For Jest / Vitest: drain the global store for a given test name
 * and return parsed metadata.
 */
export function flushGlobalStore(testName: string): AssertiveMetadata {
    return parseAnnotations(drainGlobalStore(testName));
}
