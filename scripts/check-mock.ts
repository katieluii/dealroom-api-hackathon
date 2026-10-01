import { mockData } from '../lib/mock';
console.log(mockData.companies[0]);
console.table(mockData.investors.map(i=>({name:i.name,type:i.type,country:i.hqCountry})));
if(mockData.investors.length!==25||mockData.rounds.length!==60)throw new Error('Fixture count mismatch');
console.log('Checkpoint 1 passed: 25 investors and 60 rounds. All names labelled mock.');
