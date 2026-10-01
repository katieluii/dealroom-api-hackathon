import {PrismaClient,Prisma} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import fixtureJSON from '@/data/mock/crm.json';
import type {Viewer,Contact,Interaction,EntityMatch,PortfolioCompany,DealroomInvestor,VisibleSnapshot,MockFixture} from './types';
const state=globalThis as typeof globalThis & {miChiDb?:PrismaClient};
import {PrismaD1} from '@prisma/adapter-d1';
import type {D1Database,D1PreparedStatement} from '@cloudflare/workers-types';
async function database():Promise<{db:PrismaClient;d1?:D1Database}>{
 if(process.env.CLOUDFLARE_DEPLOYMENT==='true'){
  const {getCloudflareContext}=await import('@opennextjs/cloudflare');
  const d1=(getCloudflareContext().env as unknown as {DB:D1Database}).DB;
  return {db:new PrismaClient({adapter:new PrismaD1(d1),log:[]}),d1};
 }
 return {db:state.miChiDb??=new PrismaClient({log:[]})};
}
function insert(d1:D1Database,table:string,row:Record<string,unknown>):D1PreparedStatement{
 const entries=Object.entries(row).filter(([,v])=>v!==undefined);
 return d1.prepare(`INSERT INTO "${table}" (${entries.map(([k])=>`"${k}"`).join(',')}) VALUES (${entries.map(()=>'?').join(',')})`).bind(...entries.map(([,v])=>typeof v==='boolean'?Number(v):v instanceof Date?v.getTime():typeof v==='object'&&v!==null?JSON.stringify(v):v));
}
const fixture=fixtureJSON as MockFixture;
const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const strings=(value:Prisma.JsonValue):string[]=>Array.isArray(value)?value.filter((v):v is string=>typeof v==='string'):[];
export class ScopeError extends Error {constructor(message='Not found',public status=404){super(message)}}

// This is the only database boundary. Caller user IDs come from a verified session.
export async function scopeForUser(userId:string){
 const {db,d1}=await database();
 const viewer=await db.user.findUnique({where:{id:userId}});
 if(!viewer)throw new ScopeError('Sign in to continue.',401);
 const firmId=viewer.firmId;
 async function snapshot():Promise<VisibleSnapshot>{
  const users=await db.user.findMany({where:{firmId},select:{id:true,name:true,shareWithFirm:true}});
  const allowed=users.filter(u=>u.id===viewer!.id||u.shareWithFirm).map(u=>u.id);
  const [contacts,events,hidden,companies,cache,connection]=await Promise.all([
   db.contact.findMany({where:{firmId}}),db.interaction.findMany({where:{firmId,userId:{in:allowed}}}),
   db.hiddenContact.findMany({where:{firmId,userId:{in:allowed}}}),db.portfolioCompany.findMany({where:{firmId},orderBy:{name:'asc'}}),
   db.dealroomCache.findMany({where:{firmId,kind:{in:['investor','candidates']}}}),
   db.crmConnection.findFirst({where:{firmId,userId:viewer!.id,provider:'hubspot'},select:{syncedAt:true}})
  ]);
  const hiddenKeys=new Set(hidden.map(h=>h.userId+'|'+h.contactId));
  const visibleEvents=events.filter(e=>e.userId===viewer!.id||!hiddenKeys.has(e.userId+'|'+e.contactId));
  const eventContacts=new Set(visibleEvents.map(e=>e.contactId));
  const visibleContacts=contacts.filter(c=>c.ownerUserId===viewer!.id||eventContacts.has(c.id));
  const contactIds=visibleContacts.map(c=>c.id);
  const matches=await db.entityMatch.findMany({where:{firmId,contactId:{in:contactIds}}});
  return {viewer:viewer as Viewer,partners:users.filter(u=>allowed.includes(u.id)).map(({id,name})=>({id,name})),contacts:visibleContacts,
   interactions:visibleEvents.filter(e=>contactIds.includes(e.contactId)).map(e=>({...e,date:e.date.toISOString(),direction:e.direction??undefined})) as Interaction[],
   matches:matches as EntityMatch[],companies:companies.map(c=>({...c,sectors:strings(c.sectors),dealroomId:c.dealroomId??undefined,matchMethod:c.matchMethod??undefined})) as PortfolioCompany[],
   investors:cache.filter(c=>c.kind==='investor').map(c=>c.json as unknown as DealroomInvestor),
   candidates:Object.fromEntries(cache.filter(c=>c.kind==='candidates').map(c=>[c.key,strings(c.json)])),connected:!!connection,syncedAt:connection?.syncedAt?.toISOString()??null};
 }
 return {
  viewer:viewer as Viewer,firmId,snapshot,
  async privacy(){const current=await db.user.findFirstOrThrow({where:{id:viewer.id,firmId}});const contacts=await db.contact.findMany({where:{firmId,ownerUserId:viewer.id},orderBy:{name:'asc'}});const hidden=await db.hiddenContact.findMany({where:{firmId,userId:viewer.id}});return {shareWithFirm:current.shareWithFirm,contacts:contacts.map(c=>({id:c.id,name:c.name,orgName:c.orgName,hidden:hidden.some(h=>h.contactId===c.id)}))};},
  async setPrivacy(input:{shareWithFirm?:boolean;contactId?:string;hidden?:boolean}){
   if(input.contactId){const contact=await db.contact.findFirst({where:{id:input.contactId,firmId,ownerUserId:viewer.id}});if(!contact)throw new ScopeError();
    if(input.hidden)await db.hiddenContact.upsert({where:{firmId_userId_contactId:{firmId,userId:viewer.id,contactId:contact.id}},create:{firmId,userId:viewer.id,contactId:contact.id},update:{}});
    else await db.hiddenContact.deleteMany({where:{firmId,userId:viewer.id,contactId:contact.id}});
   }
   if(input.shareWithFirm!==undefined)await db.user.updateMany({where:{id:viewer.id,firmId},data:{shareWithFirm:input.shareWithFirm}});
  },
  async setMatch(id:string,status:'confirmed'|'rejected'){
   const visible=await snapshot();const match=visible.matches.find(m=>m.id===id);if(!match)throw new ScopeError();
   await db.entityMatch.updateMany({where:{id,firmId,contactId:match.contactId},data:{status}});
  },
  async confirmCompany(id:string,status:'confirmed'|'rejected'){
   const found=await db.portfolioCompany.findFirst({where:{id,firmId}});if(!found)throw new ScopeError();
   await db.portfolioCompany.updateMany({where:{id,firmId},data:{matchStatus:status}});
  },
  async onboarded(){await db.user.updateMany({where:{id:viewer.id,firmId},data:{onboarded:true}});},
  async connection(){return db.crmConnection.findFirst({where:{firmId,userId:viewer.id,provider:'hubspot'}});},
  async saveConnection(tokens:{encryptedAccessToken:string;encryptedRefreshToken:string;expiresAt:Date}){
   return db.crmConnection.upsert({where:{firmId_userId_provider:{firmId,userId:viewer.id,provider:'hubspot'}},create:{firmId,userId:viewer.id,provider:'hubspot',...tokens},update:tokens});
  },
  async syncedAt(date:Date){await db.crmConnection.updateMany({where:{firmId,userId:viewer.id,provider:'hubspot'},data:{syncedAt:date}});},
  async cacheGet<T>(kind:string,key:string):Promise<{value:T;fetchedAt:Date}|null>{const item=await db.dealroomCache.findUnique({where:{firmId_kind_key:{firmId,kind,key}}});return item?{value:item.json as T,fetchedAt:item.fetchedAt}:null;},
  async cacheSet(kind:string,key:string,value:unknown){await db.dealroomCache.upsert({where:{firmId_kind_key:{firmId,kind,key}},create:{firmId,kind,key,json:json(value)},update:{json:json(value),fetchedAt:new Date()}});},
  async enrichCompany(id:string,data:{dealroomId:string;matchMethod:'domain'|'name';sectors:string[]}){
   await db.portfolioCompany.updateMany({where:{id,firmId,matchStatus:{not:'rejected'}},data:{...data,sectors:json(data.sectors)}});
  },
  async matchContact(contactId:string,investorId:string,method:'domain'|'name'){
   const owned=await db.contact.findFirst({where:{id:contactId,firmId,ownerUserId:viewer.id}});if(!owned)throw new ScopeError();
   await db.entityMatch.upsert({where:{firmId_contactId_dealroomInvestorId:{firmId,contactId,dealroomInvestorId:investorId}},create:{firmId,contactId,dealroomInvestorId:investorId,method,status:'unconfirmed'},update:{method}});
  },
  async firmUsers(){return db.user.findMany({where:{firmId},select:{id:true,email:true,name:true}});},
  async replaceMyCRM(contacts:Omit<Contact,'firmId'|'ownerUserId'>[],events:Omit<Interaction,'firmId'|'userId'>[]){
   const ids=new Set(contacts.map(c=>c.id));if(events.some(e=>!ids.has(e.contactId)))throw new ScopeError('Interaction contact is missing.',400);
   const existing=await db.contact.findMany({where:{firmId,ownerUserId:viewer.id},select:{id:true}});const oldIds=existing.map(c=>c.id);const removed=oldIds.filter(id=>!ids.has(id));
   if(d1){
    const statements:D1PreparedStatement[]=[d1.prepare('DELETE FROM "Interaction" WHERE "firmId"=? AND "userId"=?').bind(firmId,viewer.id)];
    for(const id of removed){
     statements.push(d1.prepare('DELETE FROM "EntityMatch" WHERE "firmId"=? AND "contactId"=?').bind(firmId,id),d1.prepare('DELETE FROM "HiddenContact" WHERE "firmId"=? AND "userId"=? AND "contactId"=?').bind(firmId,viewer.id,id),d1.prepare('DELETE FROM "Contact" WHERE "firmId"=? AND "ownerUserId"=? AND id=?').bind(firmId,viewer.id,id));
    }
    for(const contact of contacts){
     if(oldIds.includes(contact.id))statements.push(d1.prepare('UPDATE "Contact" SET name=?,"jobTitle"=?,"orgName"=?,"emailDomain"=? WHERE id=? AND "firmId"=? AND "ownerUserId"=?').bind(contact.name,contact.jobTitle,contact.orgName,contact.emailDomain,contact.id,firmId,viewer.id));
     else statements.push(insert(d1,'Contact',{...contact,firmId,ownerUserId:viewer.id}));
    }
    for(let start=0;start<events.length;start+=10){
     const batch=events.slice(start,start+10);
     statements.push(d1.prepare('INSERT INTO "Interaction" (id,"crmId","contactId",type,direction,date,"firmId","userId") VALUES '+batch.map(()=>'(?,?,?,?,?,?,?,?)').join(',')).bind(...batch.flatMap(e=>[e.id,e.crmId,e.contactId,e.type,e.direction??null,new Date(e.date).getTime(),firmId,viewer.id])));
    }
    await d1.batch(statements);return;
   }
   // Upsert stable IDs preserves explicit hidden-contact choices and match rejections across syncs.
   await db.$transaction(async tx=>{
    await tx.interaction.deleteMany({where:{firmId,userId:viewer.id}});
    await tx.entityMatch.deleteMany({where:{firmId,contactId:{in:removed}}});
    await tx.hiddenContact.deleteMany({where:{firmId,userId:viewer.id,contactId:{in:removed}}});
    await tx.contact.deleteMany({where:{firmId,ownerUserId:viewer.id,id:{in:removed}}});
    for(const contact of contacts){
     if(oldIds.includes(contact.id))await tx.contact.updateMany({where:{id:contact.id,firmId,ownerUserId:viewer.id},data:{name:contact.name,jobTitle:contact.jobTitle,orgName:contact.orgName,emailDomain:contact.emailDomain}});
     else await tx.contact.create({data:{...contact,firmId,ownerUserId:viewer.id}});
    }
    if(events.length)await tx.interaction.createMany({data:events.map(e=>({...e,firmId,userId:viewer.id,date:new Date(e.date)}))});
   },{timeout:30000});
  },
  async disconnect(){
   if(d1){
    const owned='SELECT id FROM "Contact" WHERE "firmId"=? AND "ownerUserId"=?';
    await d1.batch([
     d1.prepare('DELETE FROM "CrmConnection" WHERE "firmId"=? AND "userId"=?').bind(firmId,viewer.id),
     ...['Interaction','HiddenContact'].map(table=>d1.prepare(`DELETE FROM "${table}" WHERE "firmId"=? AND ("userId"=? OR "contactId" IN (${owned}))`).bind(firmId,viewer.id,firmId,viewer.id)),
     d1.prepare(`DELETE FROM "EntityMatch" WHERE "firmId"=? AND "contactId" IN (${owned})`).bind(firmId,firmId,viewer.id),
     d1.prepare('DELETE FROM "Contact" WHERE "firmId"=? AND "ownerUserId"=?').bind(firmId,viewer.id),
     d1.prepare('UPDATE "User" SET "shareWithFirm"=0,onboarded=0 WHERE "firmId"=? AND id=?').bind(firmId,viewer.id)
    ]);return;
   }
   await db.$transaction(async tx=>{
   const owned=await tx.contact.findMany({where:{firmId,ownerUserId:viewer.id},select:{id:true}}),ids=owned.map(c=>c.id);
   await tx.crmConnection.deleteMany({where:{firmId,userId:viewer.id}});
   await tx.interaction.deleteMany({where:{firmId,OR:[{userId:viewer.id},{contactId:{in:ids}}]}});
   await tx.hiddenContact.deleteMany({where:{firmId,OR:[{userId:viewer.id},{contactId:{in:ids}}]}});
   await tx.entityMatch.deleteMany({where:{firmId,contactId:{in:ids}}});
   await tx.contact.deleteMany({where:{firmId,ownerUserId:viewer.id}});
   await tx.user.updateMany({where:{id:viewer.id,firmId},data:{shareWithFirm:false,onboarded:false}});
  });}
 };
}
export type Scope=Awaited<ReturnType<typeof scopeForUser>>;

// Identity bootstrap runs only after Google verifies the email, or in explicit mock mode.
export async function googleIdentity(email:string,name:string,invitedFirm?:string){
 const {db}=await database();
 const existing=await db.user.findUnique({where:{email}});
 if(existing){if(invitedFirm&&existing.firmId!==invitedFirm)throw new ScopeError('This account already belongs to a different firm.',403);return existing;}
 let firmId=invitedFirm;
 if(firmId){if(!await db.firm.findFirst({where:{id:firmId,firmId}}))throw new ScopeError('Invitation is no longer valid.',403);}
 else {firmId=randomUUID();await db.firm.create({data:{id:firmId,firmId,name:name+"'s firm"}});}
 return db.user.create({data:{firmId,email,name}});
}
export async function seedMockFirm(firmId='mock-a'){
 const {db,d1}=await database();
 if(process.env.MOCK_MODE!=='true')throw new Error('Mock seeding is disabled.');
 const exists=await db.firm.findFirst({where:{id:firmId,firmId}});if(exists)return;
 const prefix=(id:string)=>firmId+'-'+id;
 if(d1){
  const statements=[insert(d1,'Firm',{id:firmId,firmId,name:'Example Deeptech Ventures (fictional)'}),
   ...fixture.partners.map(p=>insert(d1,'User',{...p,id:prefix(p.id),firmId,email:firmId+'-'+p.email})),
   ...fixture.companies.map(c=>insert(d1,'PortfolioCompany',{...c,id:prefix(c.id),firmId})),
   ...fixture.contacts.map(c=>insert(d1,'Contact',{...c,id:prefix(c.id),ownerUserId:prefix(c.ownerUserId),firmId})),
   ...fixture.interactions.map(e=>insert(d1,'Interaction',{...e,id:prefix(e.id),contactId:prefix(e.contactId),userId:prefix(e.userId),firmId,date:new Date(e.date)})),
   ...fixture.matches.map(m=>insert(d1,'EntityMatch',{...m,id:prefix(m.id),contactId:prefix(m.contactId),firmId})),
   ...fixture.investors.map(i=>insert(d1,'DealroomCache',{id:randomUUID(),firmId,kind:'investor',key:i.id,json:i,fetchedAt:new Date()})),
   ...fixture.companies.map(c=>insert(d1,'DealroomCache',{id:randomUUID(),firmId,kind:'candidates',key:prefix(c.id),json:fixture.investors.filter(i=>i.sectors.some(s=>c.sectors.includes(s))).map(i=>i.id),fetchedAt:new Date()}))];
  await d1.batch(statements);return;
 }
 await db.$transaction(async tx=>{
  await tx.firm.create({data:{id:firmId,firmId,name:'Example Deeptech Ventures (fictional)'}});
  await tx.user.createMany({data:fixture.partners.map(p=>({...p,id:prefix(p.id),firmId,email:firmId+'-'+p.email}))});
  await tx.portfolioCompany.createMany({data:fixture.companies.map(c=>({...c,id:prefix(c.id),firmId,sectors:json(c.sectors)}))});
  await tx.contact.createMany({data:fixture.contacts.map(c=>({...c,id:prefix(c.id),ownerUserId:prefix(c.ownerUserId),firmId}))});
  await tx.interaction.createMany({data:fixture.interactions.map(e=>({...e,id:prefix(e.id),contactId:prefix(e.contactId),userId:prefix(e.userId),firmId,date:new Date(e.date)}))});
  await tx.entityMatch.createMany({data:fixture.matches.map(m=>({...m,id:prefix(m.id),contactId:prefix(m.contactId),firmId}))});
  for(const investor of fixture.investors)await tx.dealroomCache.create({data:{firmId,kind:'investor',key:investor.id,json:json(investor)}});
  for(const company of fixture.companies)await tx.dealroomCache.create({data:{firmId,kind:'candidates',key:prefix(company.id),json:json(fixture.investors.filter(i=>i.sectors.some(s=>company.sectors.includes(s))).map(i=>i.id))}});
 },{timeout:30000});
}
export async function syncMock(scope:Scope){
 if(process.env.MOCK_MODE!=='true')throw new ScopeError('Mock sync is disabled.',403);
 const partner=scope.viewer.id.split('-').pop();const prefix=(id:string)=>scope.firmId+'-'+id;
 const contacts=fixture.contacts.filter(c=>c.ownerUserId===partner).map(c=>({...c,id:prefix(c.id)}));
 const events=fixture.interactions.filter(e=>e.userId===partner).map(e=>({...e,id:prefix(e.id),contactId:prefix(e.contactId)}));
 await scope.replaceMyCRM(contacts,events);
 for(const match of fixture.matches.filter(m=>contacts.some(c=>c.id===prefix(m.contactId))))await scope.matchContact(prefix(match.contactId),match.dealroomInvestorId,match.method);
 await scope.syncedAt(new Date());return {contacts:contacts.length,interactions:events.length,syncedAt:new Date().toISOString()};
}
