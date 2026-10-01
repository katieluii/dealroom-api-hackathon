export type InteractionType = 'meeting'|'call'|'email'|'note';
export type Direction = 'inbound'|'outbound';
export interface Viewer {id:string;firmId:string;name:string;email:string;shareWithFirm:boolean;onboarded:boolean}
export interface Contact {id:string;firmId:string;crmId:string;name:string;jobTitle:string;orgName:string;emailDomain:string;ownerUserId:string}
export interface Interaction {id:string;firmId:string;crmId:string;contactId:string;userId:string;type:InteractionType;date:string;direction?:Direction}
export interface PortfolioCompany {id:string;firmId:string;name:string;domain:string;pitch:string;dealroomId?:string;matchMethod?:'domain'|'name';matchStatus:'unconfirmed'|'confirmed'|'rejected';sectors:string[];nextRound:string}
export interface EntityMatch {id:string;firmId:string;contactId:string;dealroomInvestorId:string;method:'domain'|'name';status:'unconfirmed'|'confirmed'|'rejected'}
export interface DealroomInvestor {id:string;name:string;domain?:string;type:'corporate'|'other';hqCountry:string;sectors:string[];stages:string[];recentInvestments:{companyName:string;sectors:string[];date:string;stage:string}[]}
export interface DealroomCompany {id:string;name:string;domain?:string;sectors:string[];stage:string;country:string;totalRaised?:number}
export interface RelationshipScore {score:number;label:'Strong'|'Warm'|'Cool'|'Cold';components:{recency:number;frequency:number;twoWay:number;depth:number};evidence:string[];lastContact:string|null;counts:Record<InteractionType,number>;inbound:number;outbound:number}
export interface Route {id:string;contact:Contact;investor:DealroomInvestor;match:EntityMatch;knownBy:{id:string;name:string};relationship:RelationshipScore;fit:string;eligible:boolean}
export interface VisibleSnapshot {viewer:Viewer;partners:Pick<Viewer,'id'|'name'>[];contacts:Contact[];interactions:Interaction[];matches:EntityMatch[];companies:PortfolioCompany[];investors:DealroomInvestor[];candidates:Record<string,string[]>;connected:boolean;syncedAt:string|null}
export interface PortfolioSummary extends PortfolioCompany {bestPath:number;group:'Could use help'|'Well connected';routeCount:number}
export interface CompanyDetail {company:PortfolioSummary;routes:Route[];unconfirmed:Route[]}
export interface MockFixture {asOf:string;partners:{id:string;name:string;email:string}[];companies:Omit<PortfolioCompany,'firmId'>[];investors:DealroomInvestor[];contacts:Omit<Contact,'firmId'>[];interactions:Omit<Interaction,'firmId'>[];matches:Omit<EntityMatch,'firmId'>[]}
