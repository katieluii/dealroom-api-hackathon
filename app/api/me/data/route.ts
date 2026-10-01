import {apiResponse,bodyObject} from '@/lib/http';import {ScopeError} from '@/lib/scope';
export async function DELETE(request:Request){return apiResponse(request,async scope=>{const body=await bodyObject(request);if(body.confirm!==true)throw new ScopeError('Confirm deletion first.',400);await scope.disconnect();return {deleted:true};});}
