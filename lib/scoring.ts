import type {Interaction,RelationshipScore,InteractionType} from './types';
const DAY=86400000;
export function scoreRelationship(interactions:Interaction[],asOf=new Date().toISOString()):RelationshipScore{
 const now=Date.parse(asOf),cutoff=new Date(now);cutoff.setUTCFullYear(cutoff.getUTCFullYear()-1);
 const seen=new Set<string>();const recent=interactions.filter(e=>{const date=Date.parse(e.date);if(seen.has(e.id)||!Number.isFinite(date)||date<cutoff.getTime()||date>now)return false;seen.add(e.id);return true;});
 const counts:Record<InteractionType,number>={meeting:0,call:0,email:0,note:0};for(const e of recent)counts[e.type]++;
 const last=recent.map(e=>Date.parse(e.date)).sort((a,b)=>b-a)[0];
 const days=last===undefined?null:Math.floor((now-last)/DAY);
 const recency=days===null?0:100*Math.pow(.5,days/90);
 const frequency=Math.min(100,100*recent.length/8);
 const inbound=recent.filter(e=>e.type==='email'&&e.direction==='inbound').length,outbound=recent.filter(e=>e.type==='email'&&e.direction==='outbound').length;
 const conversations=counts.meeting+counts.call;
 // Direction is a reply proxy; headers/content are deliberately not requested. Do not claim individual replies.
 const emailDenominator=outbound||counts.email;
 const denominator=emailDenominator+conversations;
 const twoWay=denominator?100*(Math.min(inbound,outbound)+conversations)/denominator:0;
 const depth=Math.min(100,100*(counts.meeting+counts.call*.7+counts.email*.3+counts.note*.2)/6);
 const score=Math.round(.30*recency+.25*frequency+.25*twoWay+.20*depth);
 const evidence:string[]=[];
 if(counts.meeting)evidence.push(`${counts.meeting} meeting${counts.meeting===1?'':'s'} in 12 months`);
 if(counts.call)evidence.push(`${counts.call} call${counts.call===1?'':'s'} in 12 months`);
 if(counts.email)evidence.push(`${inbound} inbound, ${outbound} outbound emails${counts.email-inbound-outbound?`; ${counts.email-inbound-outbound} direction unknown`:''}`);
 if(counts.note)evidence.push(`${counts.note} CRM note${counts.note===1?'':'s'} logged (content not read)`);
 evidence.push(days===null?'No logged activity in the last 12 months':days===0?'Latest logged activity today':days<14?`Latest logged activity ${days} day${days===1?'':'s'} ago`:`Latest logged activity ${Math.floor(days/7)} weeks ago`);
 return {score,label:score>=70?'Strong':score>=40?'Warm':score>=25?'Cool':'Cold',components:{recency,frequency,twoWay,depth},evidence,lastContact:last===undefined?null:new Date(last).toISOString(),counts,inbound,outbound};
}
