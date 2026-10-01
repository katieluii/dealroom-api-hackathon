import SignIn from '@/components/SignIn';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}){return <SignIn mock={process.env.MOCK_MODE==='true'} google={!!process.env.GOOGLE_CLIENT_ID&&!!process.env.GOOGLE_CLIENT_SECRET} error={!!(await searchParams).error}/>;}
