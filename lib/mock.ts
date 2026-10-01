import companies from '@/data/mock/companies.json';
import investors from '@/data/mock/investors.json';
import rounds from '@/data/mock/rounds.json';
import type { Dataset, Investment } from './types';
export const mockData = {companies, investors, rounds} as Dataset;
export function portfoliosFor(data:Dataset):Record<string,Investment[]> {
 const byId=new Map(data.companies.map(c=>[c.id,c]));
 return Object.fromEntries(data.investors.map(i=>[i.id,data.rounds.filter(r=>r.investorIds.includes(i.id)).map(r=>({investorId:i.id,companyId:r.companyId,roundId:r.id,stage:r.stage,date:r.date,isLead:r.leadInvestorIds.includes(i.id),company:byId.get(r.companyId)}))]));
}
