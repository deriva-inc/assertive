'use client';

// Import global from third party libraries.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import custom types.

// Import custom components.

// Import styles.

// Import custom utility classes.
// import useLocalStorage from '@/src/hooks/use-local-storage';

/**
 * This function defines the "Home" page for the web app.
 *
 * @version 1.1.0
 * @author Aayush Goyal
 * @created 2024-12-21
 * @modifier Aayush Goyal
 * @modified 2025-02-02
 * @since 0.16.0
 */
export default function HomePage() {
    /*
     * Side-effects
     */
    const router = useRouter();
    /*
     * Side-effects
     */
    useEffect(() => {
        // const authToken = useLocalStorage('get', 'userInfo_authToken');
        // if (authToken) {
        //     router.push('/home');
        // } else {
        //     router.push('/signin');
        // }
    }, []);

    /*
     * UI
     */
    return (
        <div>
            <p className="font-heading">WOW WEB APP</p>
        </div>
    );
}
