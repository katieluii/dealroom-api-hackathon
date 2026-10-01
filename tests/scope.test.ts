import test from 'node:test';import assert from 'node:assert/strict';
import {seedMockFirm,scopeForUser,syncMock} from '../lib/scope';
import {portfolio,companyDetail,introDraft} from '../lib/matching';
const asOf='2026-10-01T12:00:00Z';
test('tenant separation, sharing, hidden contacts, eligibility and deletion',async()=>{
 await seedMockFirm('test-a');await seedMockFirm('test-b');
 const a=await scopeForUser('test-a-p0'),b=await scopeForUser('test-b-p0'),alex=await scopeForUser('test-a-p1');
 const initial=await a.snapshot(),other=await b.snapshot();
 assert.equal(initial.contacts.length,15);assert.ok(initial.contacts.every(c=>c.firmId==='test-a'));assert.ok(initial.interactions.every(i=>i.userId==='test-a-p0'));assert.equal((await a.privacy()).shareWithFirm,false);
 const list=portfolio(initial,asOf);assert.equal(list.filter(c=>c.group==='Could use help').length,2);assert.equal(list.filter(c=>c.group==='Well connected').length,4);
 for(const c of initial.companies){const detail=companyDetail(c,initial,asOf);for(const r of detail.routes){assert.ok(r.relationship.evidence.length);assert.ok(r.fit);assert.equal(r.investor.type,'corporate');}if(detail.routes[0])assert.match(introDraft(c,detail.routes[0]),/Would you be comfortable introducing/);}
 await assert.rejects(()=>a.setPrivacy({contactId:other.contacts[0].id,hidden:true}));await assert.rejects(()=>a.setMatch(other.matches[0].id,'confirmed'));assert.equal(companyDetail(other.companies[0],initial,asOf).routes.length,0);
 await alex.setPrivacy({shareWithFirm:true});assert.equal((await a.snapshot()).contacts.length,30);
 const contact=(await alex.snapshot()).contacts.find(c=>c.ownerUserId===alex.viewer.id)!;await alex.setPrivacy({contactId:contact.id,hidden:true});assert.ok(!(await a.snapshot()).contacts.some(c=>c.id===contact.id));assert.ok((await alex.snapshot()).contacts.some(c=>c.id===contact.id));
 await syncMock(alex);assert.ok(!(await a.snapshot()).contacts.some(c=>c.id===contact.id));
 await alex.setPrivacy({shareWithFirm:false});assert.equal((await a.snapshot()).contacts.length,15);
 const unknown=initial.matches.find(m=>m.method==='name')!;assert.ok(unknown);const before=portfolio(await a.snapshot(),asOf).reduce((n,c)=>n+c.routeCount,0);await a.setMatch(unknown.id,'confirmed');assert.ok(portfolio(await a.snapshot(),asOf).reduce((n,c)=>n+c.routeCount,0)>before);await a.setMatch(unknown.id,'rejected');assert.equal(portfolio(await a.snapshot(),asOf).reduce((n,c)=>n+c.routeCount,0),before);
 await a.disconnect();const deleted=await a.snapshot();assert.equal(deleted.contacts.length,0);assert.equal(deleted.interactions.length,0);assert.equal(deleted.matches.length,0);assert.equal((await b.snapshot()).contacts.length,15);
});
