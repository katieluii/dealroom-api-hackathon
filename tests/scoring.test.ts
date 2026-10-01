import test from 'node:test';import assert from 'node:assert/strict';
import {scoreRelationship} from '../lib/scoring';
import type {Interaction} from '../lib/types';
const asOf='2026-10-01T12:00:00Z';
const event=(id:string,type:Interaction['type'],date=asOf,direction?:Interaction['direction']):Interaction=>({id,firmId:'a',crmId:id,contactId:'c',userId:'u',type,date,direction});
test('eight recent meetings score100 with counts and dates',()=>{const s=scoreRelationship(Array.from({length:8},(_,i)=>event('e'+i,'meeting')),asOf);assert.equal(s.score,100);assert.equal(s.label,'Strong');assert.deepEqual(s.components,{recency:100,frequency:100,twoWay:100,depth:100});assert.ok(s.evidence.includes('8 meetings in 12 months'));});
test('recency halves at90 days; old/future/duplicate events excluded',()=>{const e=event('x','meeting','2026-07-03T12:00:00Z');const s=scoreRelationship([e,e,event('old','meeting','2024-01-01'),event('future','call','2028-01-01')],asOf);assert.equal(s.components.recency,50);assert.equal(s.counts.meeting,1);assert.equal(s.counts.call,0);});
test('email direction proxy is capped without claiming individual replies',()=>{const s=scoreRelationship([event('a','email',asOf,'outbound'),event('b','email',asOf,'inbound'),event('c','email',asOf,'inbound')],asOf);assert.equal(s.components.twoWay,100);assert.match(s.evidence.join(' '),/2 inbound, 1 outbound/);assert.doesNotMatch(s.evidence.join(' '),/replied/);assert.equal(scoreRelationship([event('x','email')],asOf).components.twoWay,0);});
test('empty history is Cold with no invented date',()=>{const s=scoreRelationship([],asOf);assert.equal(s.score,0);assert.equal(s.lastContact,null);assert.equal(s.label,'Cold');});
