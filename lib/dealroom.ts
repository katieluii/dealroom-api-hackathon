import fixtureJSON from '@/data/mock/crm.json';
import type {DealroomCompany,DealroomInvestor,MockFixture} from './types';
import type {Scope} from './scope';
const fixture=fixtureJSON as MockFixture;
export function dealroom(scope:Scope){
 return {
 async searchInvestor({name,domain}:{name?:string;domain?:string}):Promise<DealroomInvestor[]>{return fixture.investors.filter(i=>domain?i.domain===domain:i.name.toLowerCase().includes(name?.toLowerCase()??''));},
 async getInvestor(id:string):Promise<DealroomInvestor>{const i=fixture.investors.find(i=>i.id===id);if(!i)throw new Error('Investor not found.');return i;},
 async listCorporateInvestors({sectors}:{sectors:string[];regions?:string[]}):Promise<DealroomInvestor[]>{return fixture.investors.filter(i=>i.type==='corporate'&&i.sectors.some(s=>sectors.includes(s)));},
 async searchCompany({name,domain}:{name?:string;domain?:string}):Promise<DealroomCompany[]>{return fixture.companies.filter(c=>domain?c.domain===domain:c.name.toLowerCase().includes(name?.toLowerCase()??'')).map(c=>({id:c.dealroomId!,name:c.name,domain:c.domain,sectors:c.sectors,stage:c.nextRound,country:'United Kingdom'}));},
 async getCompany(id:string):Promise<DealroomCompany>{const c=fixture.companies.find(c=>c.dealroomId===id);if(!c)throw new Error('Company not found.');return {id,name:c.name,domain:c.domain,sectors:c.sectors,stage:c.nextRound,country:'United Kingdom'};}
 };
}
