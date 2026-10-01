'use client';
import {signOut} from 'next-auth/react';
export default function Topbar({mock,connected,name}:{mock:boolean;connected:boolean;name:string}){return <header className="topbar"><a href="/" className="wordmark">Mi-Chi</a><span className="connection">{connected?'✓ Connected to HubSpot':'HubSpot not connected'}</span>{mock&&<span className="pill">Mock data</span>}<nav aria-label="Account"><span>{name}</span><a href="/appendix">Appendix</a><a href="/privacy">Privacy</a><button onClick={()=>void signOut({callbackUrl:'/signin'})}>Sign out</button></nav></header>;}
