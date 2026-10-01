import {scoreRelationship} from './scoring';
import type {VisibleSnapshot,PortfolioCompany,DealroomInvestor,Route,PortfolioSummary,CompanyDetail} from './types';
const normal=(s:string)=>s.trim().toLowerCase();
export function fitReason(investor:DealroomInvestor,company:PortfolioCompany,asOf:string):string{
 const now=new Date(asOf);const from=new Date(now);from.setUTCFullYear(from.getUTCFullYear()-3);
 const names=[...new Set(investor.recentInvestments.filter(i=>Date.parse(i.date)>=from.getTime()&&Date.parse(i.date)<=now.getTime()&&i.sectors.some(s=>company.sectors.some(c=>normal(c)===normal(s)))).map(i=>i.companyName))];
 return names.length?`Has backed ${names.length} ${names.length===1?'company':'companies'} in matching sectors since ${from.getUTCFullYear()}: ${names.join(', ')}.`:'Sector match only';
}
export function routesFor(company:PortfolioCompany,visible:VisibleSnapshot,asOf=new Date().toISOString()):{routes:Route[];unconfirmed:Route[]}{
 if(company.firmId!==visible.viewer.firmId||company.matchStatus==='rejected')return {routes:[],unconfirmed:[]};
 const candidateIds=new Set(visible.candidates[company.id]??[]),eligible:Route[]=[],unconfirmed:Route[]=[];
 for(const contact of visible.contacts){if(contact.firmId!==visible.viewer.firmId)continue;
  for(const match of visible.matches.filter(m=>m.firmId===visible.viewer.firmId&&m.contactId===contact.id&&m.status!=='rejected')){
   const investor=visible.investors.find(i=>i.id===match.dealroomInvestorId&&i.type==='corporate'&&candidateIds.has(i.id)&&i.sectors.some(s=>company.sectors.some(c=>normal(s)===normal(c))));if(!investor)continue;
   const relationships=visible.partners.map(partner=>({partner,relationship:scoreRelationship(visible.interactions.filter(e=>e.firmId===visible.viewer.firmId&&e.contactId===contact.id&&e.userId===partner.id),asOf)})).filter(r=>r.relationship.lastContact!==null).sort((a,b)=>b.relationship.score-a.relationship.score||a.partner.id.localeCompare(b.partner.id));
   const best=relationships[0];if(!best)continue;
   const route:Route={id:contact.id+'-'+investor.id,contact,investor,match,knownBy:best.partner,relationship:best.relationship,fit:fitReason(investor,company,asOf),eligible:match.method==='domain'||match.status==='confirmed'};
   (route.eligible?eligible:unconfirmed).push(route);
  }
 }
 const rank=(all:Route[])=>{const best=new Map<string,Route>();for(const route of all){const key=route.contact.crmId+'|'+route.investor.id;if(!best.has(key)||best.get(key)!.relationship.score<route.relationship.score)best.set(key,route);}return [...best.values()].sort((a,b)=>b.relationship.score-a.relationship.score||a.contact.name.localeCompare(b.contact.name));};
 return {routes:rank(eligible),unconfirmed:rank(unconfirmed)};
}
export function companyDetail(company:PortfolioCompany,visible:VisibleSnapshot,asOf?:string):CompanyDetail{
 const {routes,unconfirmed}=routesFor(company,visible,asOf),bestPath=routes[0]?.relationship.score??0;
 return {company:{...company,bestPath,group:bestPath<40?'Could use help':'Well connected',routeCount:routes.length},routes,unconfirmed};
}
export function portfolio(visible:VisibleSnapshot,asOf?:string):PortfolioSummary[]{return visible.companies.map(c=>companyDetail(c,visible,asOf).company).sort((a,b)=>b.bestPath-a.bestPath||a.name.localeCompare(b.name));}
export function introDraft(company:PortfolioCompany,route:Route,viewerId?:string):string{
 if(viewerId===route.knownBy.id)return `Hi ${route.contact.name.split(' ')[0]},\n\nOne of our portfolio companies, ${company.name}, is preparing its ${company.nextRound}. ${company.pitch}\n\n${route.fit}\n\nWould you be open to meeting the founders? I can send a short brief first.\n\nThanks`;
 return `Hi ${route.knownBy.name.split(' ')[0]},\n\nWould you be comfortable introducing us to ${route.contact.name} at ${route.investor.name}?\n\n${company.name} is preparing its ${company.nextRound}. ${company.pitch}\n\n${route.fit}\n\nIf the fit looks right to you, we can send a short brief to forward.\n\nThanks`;}
