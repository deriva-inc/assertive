// Import global from third party libraries.
// eslint-disable-next-line camelcase
import localFont from 'next/font/local';

// Import custom styles.

// Import custom utility classes.
// import RQProviders from '../providers/providers';

// // Import custom types.
// import LayoutProps from '../types/globals';

// // Import custom components.
// import { Toaster } from '../components/ui/toaster';

// Import styles.
import './globals.css';

const frauncesDisplay = localFont({
    src: [
        {
            path: '../../../packages/ui/assets/fonts/fraunces/Fraunces-Regular.ttf',
            weight: '400',
            style: 'normal'
        },
        {
            path: '../../../packages/ui/assets/fonts/fraunces/Fraunces-Bold.ttf',
            weight: '700',
            style: 'normal'
        }
    ],
    variable: '--font-fraunces'
});

const satoshi = localFont({
    src: [
        {
            path: '../../../packages/ui/assets/fonts/satoshi/Satoshi-Light.otf',
            weight: '300',
            style: 'normal'
        },
        {
            path: '../../../packages/ui/assets/fonts/satoshi/Satoshi-Regular.otf',
            weight: '400',
            style: 'normal'
        },
        {
            path: '../../../packages/ui/assets/fonts/satoshi/Satoshi-Medium.otf',
            weight: '500',
            style: 'normal'
        },
        {
            path: '../../../packages/ui/assets/fonts/satoshi/Satoshi-Bold.otf',
            weight: '700',
            style: 'normal'
        },
        {
            path: '../../../packages/ui/assets/fonts/satoshi/Satoshi-Black.otf',
            weight: '900',
            style: 'normal'
        }
    ],
    variable: '--font-satoshi'
});

/**
 * This function defines the common layout to be reused across web app pages.
 */
export default function RootLayout(props: { children: React.ReactNode }) {
    return (
        <html lang="en" className={satoshi.className}>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link
                    rel="icon"
                    type="image/png"
                    href="/favicon/favicon-96x96.png"
                    sizes="96x96"
                />
                <link
                    rel="icon"
                    type="image/svg+xml"
                    href="/favicon/favicon.svg"
                />
                <link rel="shortcut icon" href="/favicon/favicon.ico" />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/favicon/apple-touch-icon.png"
                />
                <meta name="apple-mobile-web-app-title" content="Claro" />
            </head>
            <body
                className={`${frauncesDisplay.variable} ${satoshi.variable} antialiased`}
            >
                {props.children}
            </body>
        </html>
    );
}
