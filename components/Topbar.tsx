'use client';
import {signOut} from 'next-auth/react';
import {usePathname} from 'next/navigation';
export default function Topbar({mock,connected,name}:{mock:boolean;connected:boolean;name:string}){
 const path=usePathname();
 return <header className="topbar"><a href="/" className="wordmark">Mi-Chi</a>
  {mock?<span className="pill">Fictional demo</span>:<span className="connection">{connected?'✓ Connected to HubSpot':'HubSpot not connected'}</span>}
  <nav aria-label="Account"><span>{name}</span><a href="/appendix" aria-current={path==='/appendix'?'page':undefined}>Appendix</a><a href="/privacy" aria-current={path==='/privacy'?'page':undefined}>Privacy</a><button onClick={()=>void signOut({callbackUrl:'/signin'})}>Sign out</button></nav>
 </header>;
}
