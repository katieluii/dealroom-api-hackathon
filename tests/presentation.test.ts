import test from 'node:test';
import assert from 'node:assert/strict';
import {fitReason,introDraft} from '../lib/matching';
import {scoreRelationship} from '../lib/scoring';
import type {PortfolioCompany,DealroomInvestor,Route} from '../lib/types';
const company:PortfolioCompany={id:'pc',firmId:'f',name:'Example Co',domain:'example.test',pitch:'Makes optical chips.',sectors:['Health','Energy'],nextRound:'Series A',matchStatus:'confirmed'};
const investor:DealroomInvestor={id:'i',name:'Example Ventures',type:'corporate',hqCountry:'GB',sectors:['Energy'],stages:['Series A'],recentInvestments:[{companyName:'Energy Co',sectors:['Energy'],stage:'Seed',date:'2026-01-01'}]};
test('fit evidence does not assign an investment to a nonmatching sector',()=>{
 const reason=fitReason(investor,company,'2026-10-01');
 assert.match(reason,/1 company in matching sectors/);assert.match(reason,/Energy Co/);assert.doesNotMatch(reason,/health/i);
});
test('a logged note is not described as contact',()=>{
 const score=scoreRelationship([{id:'e',firmId:'f',crmId:'c',contactId:'c',userId:'u',type:'note',date:'2026-10-01T12:00:00Z'}],'2026-10-01T12:00:00Z');
 assert.ok(score.evidence.includes('Latest logged activity today'));assert.ok(score.evidence.every(e=>!e.includes('Last contact')));
});
test('own-contact draft addresses the contact; colleague draft addresses the colleague',()=>{
 const route:Route={id:'r',contact:{id:'c',firmId:'f',crmId:'c',name:'Jordan Lee',jobTitle:'Partner',orgName:'Example Ventures',emailDomain:'example.test',ownerUserId:'maya'},investor,knownBy:{id:'maya',name:'Maya Chen'},relationship:scoreRelationship([]),fit:'Sector match only',eligible:true,match:{id:'m',firmId:'f',contactId:'c',dealroomInvestorId:'i',method:'domain',status:'confirmed'}};
 assert.match(introDraft(company,route,'maya'),/^Hi Jordan,/);
 assert.doesNotMatch(introDraft(company,route,'maya'),/Would you be comfortable introducing/);
 assert.match(introDraft(company,route,'alex'),/^Hi Maya,/);
 assert.match(introDraft(company,route,'alex'),/Would you be comfortable introducing/);
});
