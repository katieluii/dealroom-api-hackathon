'use client';
import type {Route} from '@/lib/types';

interface Props {
 route:Route;
 viewerId:string;
 busy:boolean;
 pending?:boolean;
 first?:boolean;
 onScore:()=>void;
 onDraft:()=>void;
 onMatch:(status:'confirmed'|'rejected')=>void;
}
export default function RelationshipCard({route,viewerId,busy,pending=false,first=false,onScore,onDraft,onMatch}:Props){
 const own=route.knownBy.id===viewerId;
 const counts=route.relationship.counts;
 const activity=([
  [counts.meeting,'meeting'],[counts.call,'call'],[counts.email,'email'],[counts.note,'logged note'],
 ] as const).filter(([count])=>count>0).map(([count,label])=>`${count} ${label}${count===1?'':'s'}`).join(', ');
 return <article className={'relationship-card'+(first?' first':'')+(pending?' pending':'')}>
  <div className="relationship-card-heading">
   <div><p className="team-label">On your team</p><h3>{route.knownBy.name}{own&&<span className="self-label"> (you)</span>}</h3></div>
   <button className="activity-score" onClick={onScore} aria-label={`How ${route.knownBy.name}’s relationship with ${route.contact.name} is scored`}>
    <span className={'relationship '+route.relationship.label.toLowerCase()}>{route.relationship.label}</span>
    <span><b>{route.relationship.score}</b> / 100</span><span className="score-caption">Activity score</span>
   </button>
  </div>
  <div className="contact-path"><span aria-hidden="true">↳</span><div><h4>{route.contact.name}</h4><p>{route.contact.jobTitle} at <strong>{route.investor.name}</strong></p></div></div>
  <p className="activity-summary">{activity||'No logged activity'} in 12 months.<br/><span>{route.relationship.evidence.at(-1)}.</span></p>
  <p className="fit-summary"><strong>Investor fit</strong> {route.fit}</p>
  {!pending&&<button className="primary draft-action" onClick={onDraft} aria-label={own?`Draft direct message to ${route.contact.name}`:`Draft intro request to ${route.knownBy.name} for ${route.contact.name}`}>{own?'Draft direct message':`Draft intro request to ${route.knownBy.name.split(' ')[0]}`}</button>}
  <details className="investor-check">
   <summary>{pending?'Check investor match':route.match.status==='confirmed'?'Investor match confirmed':'Investor matched by domain'}</summary>
   <dl><div><dt>CRM organisation</dt><dd>{route.contact.orgName}<span>{route.contact.emailDomain}</span></dd></div><div><dt>Investor record</dt><dd>{route.investor.name}<span>{route.investor.domain||'No domain provided'}</span></dd></div></dl>
   {pending&&<p>This name match is excluded until you confirm it.</p>}
   <div className="match-actions">{route.match.status!=='confirmed'&&<button disabled={busy} onClick={()=>onMatch('confirmed')}>Confirm match</button>}<button disabled={busy} onClick={()=>onMatch('rejected')}>Not the same organisation</button></div>
  </details>
 </article>;
}
