'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {PortfolioSummary,CompanyDetail,Route} from '@/lib/types';
import {requestJSON} from '@/lib/client';
import Topbar from './Topbar';
import RelationshipCard from './RelationshipCard';
import RelationshipDialog from './RelationshipDialog';

interface PortfolioResponse {companies:PortfolioSummary[];viewer:{id:string;name:string;shareWithFirm:boolean};connected:boolean;mock:boolean;syncedAt:string|null}
export default function PortfolioApp(){
 const [data,setData]=useState<PortfolioResponse|null>(null),[selected,setSelected]=useState('');
 const [detail,setDetail]=useState<CompanyDetail|null>(null),[error,setError]=useState('');
 const [busy,setBusy]=useState(false),[showAll,setShowAll]=useState(false);
 const [modal,setModal]=useState<{kind:'score'|'draft';route:Route}|null>(null);
 const selection=useRef(''),version=useRef(0),reveal=useRef(false),heading=useRef<HTMLHeadingElement>(null);
 const load=useCallback(async(id?:string,background=false)=>{
  const run=++version.current;
  if(!background)setBusy(true);
  try{
   const portfolio=await requestJSON<PortfolioResponse>('/api/portfolio');
   const target=id||selection.current||portfolio.companies[0]?.id;
   const next=target?await requestJSON<CompanyDetail>('/api/company/'+encodeURIComponent(target)):null;
   if(run!==version.current)return;
   setData(portfolio);setSelected(target??'');selection.current=target??'';setDetail(next);setError('');
   setModal(current=>{
    if(!current||!next)return null;
    const candidates=current.kind==='score'?[...next.routes,...next.unconfirmed]:next.routes;
    const route=candidates.find(r=>r.id===current.route.id&&r.knownBy.id===current.route.knownBy.id);
    return route?{...current,route}:null;
   });
  }catch(e){if(run===version.current){setError(e instanceof Error?e.message:'Could not load the portfolio. Try again.');setDetail(null);setModal(null)}}
  finally{if(run===version.current)setBusy(false)}
 },[]);
 useEffect(()=>{
  void load();
  const refresh=()=>{if(!document.hidden)void load(undefined,true)};
  window.addEventListener('focus',refresh);
  const timer=setInterval(refresh,10000);
  return()=>{version.current++;clearInterval(timer);window.removeEventListener('focus',refresh)};
 },[load]);
 useEffect(()=>{if(detail&&reveal.current){reveal.current=false;heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:'auto'})}},[detail]);
 async function updateMatch(route:Route,status:'confirmed'|'rejected'){
  setBusy(true);try{await requestJSON('/api/entity-match/'+route.match.id,{method:'POST',body:JSON.stringify({status})});await load()}catch(e){setError(e instanceof Error?e.message:'Match could not be saved.');setBusy(false)}
 }
 async function confirmCompany(status:'confirmed'|'rejected'){
  if(!detail)return;setBusy(true);
  try{await requestJSON('/api/company/'+detail.company.id,{method:'POST',body:JSON.stringify({status})});await load()}catch(e){setError(e instanceof Error?e.message:'Company match could not be saved.');setBusy(false)}
 }
 async function sync(){setBusy(true);try{const result=await requestJSON<{warning?:string}>('/api/sync',{method:'POST'});await load();if(result.warning)setError(result.warning)}catch(e){setError(e instanceof Error?e.message:'Sync failed. Try again.');setBusy(false)}}
 function choose(id:string){setShowAll(false);setModal(null);selection.current=id;setSelected(id);setDetail(null);reveal.current=window.matchMedia('(max-width:700px)').matches;void load(id)}
 const routes=detail?.routes??[],shown=showAll?routes:routes.slice(0,3);
 function card(route:Route,index:number,pending=false){return <RelationshipCard key={route.id} route={route} viewerId={data?.viewer.id??''} busy={busy} pending={pending} first={index===0&&!pending} onScore={()=>setModal({kind:'score',route})} onDraft={()=>setModal({kind:'draft',route})} onMatch={status=>void updateMatch(route,status)}/>}
 return <>
  <Topbar mock={data?.mock??false} connected={data?.connected??false} name={data?.viewer.name??''}/>
  <main className="workspace">
   <aside className="portfolio-list">
    <div className="list-title"><h1>Your portfolio</h1><button aria-label="Refresh portfolio" disabled={busy} onClick={()=>void load()}>↻</button></div>
    <p className="list-description">Who on your team can help with the next round?</p>
    <p className="portfolio-score-key">Best visible activity score, out of 100</p>
    {(['Could use help','Well connected'] as const).map(group=><section key={group}>
     <h2 className={group==='Could use help'?'amber':'green'}>{group} <span>({data?.companies.filter(c=>c.group===group).length??0})</span></h2>
     {data?.companies.filter(c=>c.group===group).map(c=><button className={'company-row '+(selected===c.id?'selected':'')} key={c.id} aria-pressed={selected===c.id} onClick={()=>choose(c.id)}><span><b>{c.name}</b><small>{c.nextRound}</small></span><span className="portfolio-score" aria-label={`Activity score ${c.bestPath} out of 100`}>{c.bestPath}<small>/100</small></span></button>)}
    </section>)}
    {data&&!data.companies.length&&<p>No portfolio companies imported yet.</p>}
    <button className="sync-button" disabled={busy} onClick={()=>void sync()}>{busy?'Loading…':data?.mock?'Refresh demo data':'Sync CRM data'}</button>
    <p className="source">{data?.syncedAt?'Updated '+new Date(data.syncedAt).toLocaleString():'No completed sync yet'}</p>
    <a href="/onboarding">Connection and partners</a>
   </aside>
   <section className="company-panel" aria-busy={busy}>
    {error&&<div className="error" role="alert">{error}<button onClick={()=>void load()}>Retry</button></div>}
    {!detail?<p className="empty" role="status">{busy?'Loading relationships…':error?'':'Select a portfolio company.'}</p>:<>
     <header className="company-heading"><h2 ref={heading} tabIndex={-1}>{detail.company.name}</h2><p className="sector-line">{detail.company.sectors.join(', ')} • Raising {detail.company.nextRound}</p><p>Team connections to potential strategic investors.</p>
      {detail.company.matchStatus==='unconfirmed'&&<div className="match-control"><p>Check this company’s investor-data match.</p><button disabled={busy} onClick={()=>void confirmCompany('confirmed')}>Confirm company</button><button disabled={busy} onClick={()=>void confirmCompany('rejected')}>Not the same company</button></div>}
     </header>
     {detail.company.matchStatus==='rejected'?<div className="empty"><h3>Company match rejected</h3><p>Relationships are hidden because this company’s investor-data match was rejected.</p><button disabled={busy} onClick={()=>void confirmCompany('confirmed')}>Restore this company match</button></div>:shown.length?shown.map((r,i)=>card(r,i)):<div className="empty"><h3>No confirmed routes yet</h3><p>Check the investor matches below, or ask teammates to review their sharing settings.</p></div>}
     {routes.length>0&&<footer className="route-footer"><p>{shown.length} of {routes.length} relationships, ranked by activity.</p>{routes.length>3&&<button onClick={()=>setShowAll(!showAll)}>{showAll?'Show top 3':`Show all ${routes.length}`}</button>}</footer>}
     {detail.unconfirmed.length>0&&<details className="pending-matches"><summary>{detail.unconfirmed.length} investor {detail.unconfirmed.length===1?'match':'matches'} to check</summary><p>Excluded until confirmed.</p>{detail.unconfirmed.map((r,i)=>card(r,i,true))}</details>}
    </>}
    <footer className="data-note"><p>Contact details, activity counts and dates only. Message content is never displayed or stored.</p><p>{data?.mock?'Fictional demo data. HubSpot and Dealroom are not connected.':'Activity: HubSpot. Investor data: Dealroom.'}</p></footer>
   </section>
  </main>
  {modal&&detail&&<RelationshipDialog key={modal.kind+modal.route.id} kind={modal.kind} route={modal.route} company={detail.company} viewerId={data?.viewer.id??''} onClose={()=>setModal(null)}/>}
 </>;
}
