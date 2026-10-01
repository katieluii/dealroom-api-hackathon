import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'mi-chi | Build the next round',description:'An evidence-led round architect for early-stage deeptech investors.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
