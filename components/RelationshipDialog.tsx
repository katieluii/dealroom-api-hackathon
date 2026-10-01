'use client';
import {useState} from 'react';
import type {PortfolioCompany,Route} from '@/lib/types';
import {introDraft} from '@/lib/matching';
import Modal from './Modal';

export default function RelationshipDialog({kind,route,company,viewerId,onClose}:{kind:'score'|'draft';route:Route;company:PortfolioCompany;viewerId:string;onClose:()=>void}){
 const [copied,setCopied]=useState(false),[error,setError]=useState('');
 const own=route.knownBy.id===viewerId;
 const draft=introDraft(company,route,viewerId);
 async function copy(){setError('');setCopied(false);try{await navigator.clipboard.writeText(draft);setCopied(true)}catch{setError('Copy failed. Select the draft below and copy it manually.')}}
 return <Modal title={kind==='score'?'Relationship activity score':own?'Draft direct message':`Intro request to ${route.knownBy.name.split(' ')[0]}`} onClose={onClose}>
  {kind==='score'?<>
   <p><strong>{route.knownBy.name}</strong> knows <strong>{route.contact.name}</strong>. The score ranks logged activity, not the likelihood of an introduction.</p>
   <div className="score-breakdown">{([['recency','Recency',30],['frequency','Frequency',25],['twoWay','Two-way activity',25],['depth','Depth',20]] as const).map(([key,label,weight])=><div key={key}><div><label htmlFor={'score-'+key}>{label} ({weight}% weight)</label><b>{Math.round(route.relationship.components[key])} / 100</b></div><progress id={'score-'+key} value={route.relationship.components[key]} max={100}/></div>)}</div>
   <ul>{route.relationship.evidence.map(e=><li key={e}>{e}</li>)}</ul>
   <a className="button" href="/appendix">Full scoring method</a>
  </>:<>
   <p>To {own?route.contact.name:route.knownBy.name}. Nothing is sent by Mi-Chi.</p>
   {error&&<p className="error" role="alert">{error}</p>}
   <textarea className="draft" aria-label="Message draft" readOnly value={draft} rows={11}/>
   <button className="primary" onClick={()=>void copy()}>{copied?'Copied':'Copy draft'}</button><span className="copy-status" role="status">{copied?'Draft copied to clipboard.':''}</span>
  </>}
 </Modal>;
}
