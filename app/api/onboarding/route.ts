import {apiResponse} from '@/lib/http';import {ScopeError} from '@/lib/scope';
export async function POST(request:Request){return apiResponse(request,async scope=>{const connection=await scope.connection();if(!connection?.syncedAt)throw new ScopeError('Sync HubSpot before continuing.',400);await scope.onboarded();return {ok:true};});}
