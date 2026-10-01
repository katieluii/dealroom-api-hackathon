import Link from 'next/link';
import {scoreRelationship} from '@/lib/scoring';
import type {Interaction,InteractionType} from '@/lib/types';

const asOf='2026-10-01T12:00:00Z';
function example(count:number,type:InteractionType,days:number){
 const date=new Date(Date.parse(asOf)-days*86400000).toISOString();
 const events:Interaction[]=Array.from({length:count},(_,i)=>({id:String(i),firmId:'example',contactId:'contact',userId:'partner',crmId:String(i),type,date,...(type==='email'?{direction:'outbound' as const}:{})}));
 return scoreRelationship(events,asOf);
}
const examples=[
 {description:'8 meetings today',result:example(8,'meeting',0)},
 {description:'2 meetings, both 90 days ago',result:example(2,'meeting',90)},
 {description:'1 meeting, 180 days ago',result:example(1,'meeting',180)},
 {description:'1 outbound email, 180 days ago',result:example(1,'email',180)},
];
export const metadata={title:'Scoring appendix | Mi-Chi'};
export default function Appendix(){return <>
 <header className="topbar"><Link href="/" className="wordmark">Mi-Chi</Link><nav aria-label="Navigation"><Link href="/">Portfolio</Link><Link href="/appendix" aria-current="page">Appendix</Link></nav></header>
 <main className="appendix-page">
  <header><h1>How relationship scores work</h1><p>The score ranks recorded activity between one teammate and one contact over the last 12 months. It does not measure trust or the chance of an introduction.</p></header>
  <section aria-labelledby="labels-title"><h2 id="labels-title">What the labels mean</h2><div className="score-labels">{[['Strong','70–100'],['Warm','40–69'],['Cool','25–39'],['Cold','0–24']].map(([label,range])=><div key={label}><strong>{label}</strong><span>{range}</span></div>)}</div><p>The portfolio displays this activity score out of 100. The cutoffs are prototype rules, not validated measures of relationship quality.</p></section>
  <section aria-labelledby="formula-title"><h2 id="formula-title">Four components</h2><p className="score-formula">Score = round(0.30 × recency + 0.25 × frequency + 0.25 × two-way activity + 0.20 × depth)</p><p>Each component runs from 0 to 100. We round only the final weighted total.</p>
   <div className="appendix-components">
    <article><h3>Recency <span>30%</span></h3><p>Recent activity counts more. Its value halves every 90 days.</p><code>100 × 0.5^(days since latest activity / 90)</code><p>Today: 100. After 90 days: 50. After 180 days: 25. No activity in the window: 0.</p></article>
    <article><h3>Frequency <span>25%</span></h3><p>Eight interactions in 12 months reach the maximum.</p><code>min(100, 100 × interaction count / 8)</code><p>Meetings, calls, emails and logged CRM notes each count as one interaction.</p></article>
    <article><h3>Two-way activity <span>25%</span></h3><p>Meetings and calls count as two-way. Email directions provide an estimate of reciprocity.</p><code>100 × (min(inbound emails, outbound emails) + meetings + calls) / (email denominator + meetings + calls)</code><p>The email denominator is the outbound count when any outbound emails exist; otherwise it is the total email count. If the whole denominator is zero, this component is 0.</p><p>With no emails, meetings or calls score 100 for this component. Notes alone score 0. Counts cannot establish which message received a reply.</p></article>
    <article><h3>Depth <span>20%</span></h3><p>Different activities carry different weights:</p><ul><li>Meeting: 1 point</li><li>Call: 0.7 points</li><li>Email: 0.3 points</li><li>CRM note: 0.2 points</li></ul><code>min(100, 100 × weighted points / 6)</code><p>Six weighted points reach the maximum. Message or note content is not analysed.</p></article>
   </div>
  </section>
  <section aria-labelledby="examples-title"><h2 id="examples-title">Worked examples</h2><p>These fictional examples are calculated by the same scoring function used in the portfolio. Each assumes no other activity in the last 12 months.</p><div className="appendix-table" role="region" aria-label="Scoring examples" tabIndex={0}><table><thead><tr><th scope="col">Activity</th><th scope="col">Recency</th><th scope="col">Frequency</th><th scope="col">Two-way</th><th scope="col">Depth</th><th scope="col">Result</th></tr></thead><tbody>{examples.map(({description,result})=><tr key={description}><th scope="row">{description}</th>{(['recency','frequency','twoWay','depth'] as const).map(key=><td key={key}>{result.components[key].toFixed(1)}</td>)}<td><strong>{result.score} / 100</strong><br/>{result.label}</td></tr>)}</tbody></table></div><p>Component values in this table are displayed to one decimal place; the calculation uses their full values.</p></section>
  <section aria-labelledby="team-title"><h2 id="team-title">From a contact to a portfolio score</h2><ul><li>We score each visible teammate–contact relationship separately.</li><li>For each contact, the highest-scoring visible teammate is named as the relationship holder.</li><li>A colleague’s relationships are visible only if they share with the firm and have not hidden that contact. You always see your own.</li><li>Only eligible routes to relevant corporate investors count. Name matches need confirmation; domain matches count unless rejected.</li><li>A company’s score is its highest eligible relationship score. Below 40: “Could use help”. At least 40: “Well connected”.</li></ul><p>Investor fit is separate from relationship activity. Sector overlap and investment evidence explain why the investor might suit the company; they do not increase this score.</p></section>
  <section aria-labelledby="limits-title"><h2 id="limits-title">What the score can miss</h2><ul><li>A close relationship may have little CRM activity. Missing records can lower the score.</li><li>Frequent activity can include sales outreach or difficult conversations. It does not prove willingness to help.</li><li>CRM notes affect recency, frequency and depth, even when no conversation happened. “Latest logged activity” can therefore refer to a note, not a conversation.</li><li>Duplicate event IDs, invalid dates, future events and activity older than 12 months are excluded. Empty history scores 0.</li></ul><p>Read the counts and dates, then ask the named teammate whether an introduction makes sense.</p></section>
  <footer><p>Current demo: all people, companies and activity are fictional. Live HubSpot and Dealroom integrations are not connected.</p><Link className="button" href="/">Back to portfolio</Link></footer>
 </main>
 </>}
