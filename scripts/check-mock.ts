import assert from 'node:assert/strict';
import fixture from '../data/mock/crm.json';
assert.equal(fixture.companies.length,6);assert.equal(fixture.investors.length,15);assert.equal(fixture.contacts.length,60);assert.equal(fixture.interactions.length,400);assert.equal(fixture.partners.length,4);
console.log('MOCK DATA: all names, companies and interactions are fictional.');
for(const key of ['companies','investors','contacts','interactions'] as const)console.log(key,fixture[key].length,fixture[key][0]);
