import {readFileSync,writeFileSync} from 'node:fs';
const f=JSON.parse(readFileSync('data/mock/crm.json','utf8'));
const firmId='mock-a', prefix=id=>firmId+'-'+id;
const value=v=>v===null?'NULL':typeof v==='number'?String(v):typeof v==='boolean'?String(Number(v)):"'"+(typeof v==='object'?JSON.stringify(v):String(v)).replaceAll("'","''")+"'";
const statements=[];
function row(table,data){const entries=Object.entries(data);statements.push(`INSERT INTO "${table}" (${entries.map(([k])=>'"'+k+'"').join(',')}) VALUES (${entries.map(([,v])=>value(v)).join(',')});`);}
row('Firm',{id:firmId,firmId,name:'Example Deeptech Ventures (fictional)'});
for(const p of f.partners)row('User',{...p,id:prefix(p.id),firmId,email:firmId+'-'+p.email});
for(const c of f.companies)row('PortfolioCompany',{...c,id:prefix(c.id),firmId});
for(const c of f.contacts)row('Contact',{...c,id:prefix(c.id),ownerUserId:prefix(c.ownerUserId),firmId});
for(const e of f.interactions)row('Interaction',{...e,id:prefix(e.id),contactId:prefix(e.contactId),userId:prefix(e.userId),firmId,date:Date.parse(e.date)});
for(const m of f.matches)row('EntityMatch',{...m,id:prefix(m.id),contactId:prefix(m.contactId),firmId});
for(const i of f.investors)row('DealroomCache',{id:prefix('cache-'+i.id),firmId,kind:'investor',key:i.id,json:i,fetchedAt:Date.parse(f.asOf)});
for(const c of f.companies)row('DealroomCache',{id:prefix('cache-'+c.id),firmId,kind:'candidates',key:prefix(c.id),json:f.investors.filter(i=>i.sectors.some(s=>c.sectors.includes(s))).map(i=>i.id),fetchedAt:Date.parse(f.asOf)});
writeFileSync('prisma/d1-migrations/0002_mock.sql','-- Fictional demonstration data only.\n'+statements.join('\n')+'\n');
console.log(`${statements.length} fictional seed statements written.`);
