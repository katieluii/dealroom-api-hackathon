import {redirect} from 'next/navigation';import {currentScope} from '@/lib/auth';import PortfolioApp from '@/components/PortfolioApp';
export const dynamic='force-dynamic';
export default async function Page(){let scope;try{scope=await currentScope()}catch{redirect('/signin')}if(!scope.viewer.onboarded)redirect('/onboarding');return <PortfolioApp/>;}
