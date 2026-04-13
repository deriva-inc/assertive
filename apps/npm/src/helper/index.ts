import type { Priority, TestType } from './types';
import { getContext } from './context';

/**
 * Universal helper client — import this in test files.
 *
 *   import { assertive } from 'getassertive/helper';
 *
 *   test('User can checkout', async ({ page }) => {
 *       assertive.id('TST-123');
 *       assertive.tags('checkout', 'smoke');
 *       assertive.owner('aayush');
 *       assertive.priority('high');
 *       // … test code …
 *   });
 */
class AssertiveHelper {
    /** Link this test to a unique assertive ID (e.g. "TST-123"). */
    id(testId: string): void {
        getContext().set('assertive_id', testId);
    }

    /** Attach one or more tags to the current test. */
    tags(...tags: string[]): void {
        for (const tag of tags) {
            getContext().set('assertive_tag', tag);
        }
    }

    /** Set the owner / assignee for the current test. */
    owner(name: string): void {
        getContext().set('assertive_owner', name);
    }

    /** Set the priority level — full autocomplete for the four levels. */
    priority(level: Priority): void {
        getContext().set('assertive_priority', level);
    }

    /** Set the test type. */
    type(testType: TestType): void {
        getContext().set('assertive_type', testType);
    }

    /** Attach an arbitrary custom field. */
    field(key: string, value: string): void {
        getContext().set(`assertive_field_${key}`, value);
    }

    /** Attach contextual data (e.g. a cart total, a screenshot path). */
    attach(key: string, data: string): void {
        getContext().set(`assertive_attach_${key}`, data);
    }
}

/** Singleton — import this in test files. */
export const assertive = new AssertiveHelper();

export type { Priority, TestType };
