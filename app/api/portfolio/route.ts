import {apiResponse} from '@/lib/http';import {portfolio} from '@/lib/matching';
export const dynamic='force-dynamic';
export async function GET(request:Request){return apiResponse(request,async scope=>{const visible=await scope.snapshot();return {companies:portfolio(visible),viewer:{id:visible.viewer.id,name:visible.viewer.name,shareWithFirm:visible.viewer.shareWithFirm},connected:visible.connected,syncedAt:visible.syncedAt,mock:process.env.MOCK_MODE==='true'};});}
