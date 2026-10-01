import {NextResponse} from 'next/server';
import {currentScope} from './auth';
import {ScopeError,type Scope} from './scope';
export class ServiceError extends Error {constructor(message:string,public status=502){super(message)}}
export async function apiResponse(request:Request,work:(scope:Scope)=>Promise<unknown>){try{
 if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin'),allowed=new URL(process.env.NEXTAUTH_URL||'http://127.0.0.1:3000').origin;if(origin!==allowed)throw new ScopeError('Request origin was not accepted.',403);}
 const scope=await currentScope();const payload=await work(scope);return NextResponse.json(payload,{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){const known=error instanceof ScopeError||error instanceof ServiceError;return NextResponse.json({error:known?error.message:'Could not complete the request. Please try again.'},{status:known?error.status:500,headers:{'Cache-Control':'private, no-store'}});}}
export async function bodyObject(request:Request):Promise<Record<string,unknown>>{const text=await request.text();if(text.length>16000)throw new ScopeError('Request too large.',413);let body:unknown;try{body=JSON.parse(text)}catch{throw new ScopeError('Invalid request.',400)}if(!body||typeof body!=='object'||Array.isArray(body))throw new ScopeError('Invalid request.',400);return body as Record<string,unknown>;}
