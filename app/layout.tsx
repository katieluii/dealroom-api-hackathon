import type {Metadata} from 'next';
import '@fontsource/instrument-sans/400.css';import '@fontsource/instrument-sans/500.css';import '@fontsource/instrument-sans/600.css';import '@fontsource/instrument-sans/700.css';
import './globals.css';
export const metadata:Metadata={title:'Mi-Chi | Strategic investor routes',description:'Find your team’s strongest routes to strategic investors.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
