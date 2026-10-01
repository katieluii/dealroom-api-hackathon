import {redirect} from 'next/navigation';import {currentScope} from '@/lib/auth';import Privacy from '@/components/Privacy';
export default async function Page(){let scope;try{scope=await currentScope()}catch{redirect('/signin')}return <Privacy initial={await scope.privacy()} name={scope.viewer.name} mock={process.env.MOCK_MODE==='true'} connected={!!await scope.connection()}/>;}
