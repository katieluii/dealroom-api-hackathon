import {getServerSession,type NextAuthOptions} from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import {cookies} from 'next/headers';
import {googleIdentity,scopeForUser,ScopeError,seedMockFirm} from './scope';
import {verifyPayload} from './crypto';
export const authOptions:NextAuthOptions={
 secret:process.env.NEXTAUTH_SECRET,session:{strategy:'jwt',maxAge:8*60*60},pages:{signIn:'/signin',error:'/signin'},
 providers:[
 ...(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET?[Google({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET})]:[]),
 ...(process.env.MOCK_MODE==='true'?[Credentials({id:'mock',name:'Fictional demo',credentials:{partner:{label:'Partner',type:'text'}},async authorize(credentials){if(process.env.MOCK_MODE!=='true'||!['p0','p1','p2','p3'].includes(credentials?.partner??''))return null;await seedMockFirm();return (await scopeForUser('mock-a-'+credentials!.partner)).viewer;}})]:[])
 ],
 callbacks:{
  async signIn({account,profile,user}){if(account?.provider==='google'){
   const verified=profile as {email_verified?:boolean;email?:string;name?:string};if(!verified.email_verified||!verified.email)return false;
   const invitation=(await cookies()).get('michi-invite')?.value;let invitedFirm:string|undefined;
   if(invitation){const signed=verifyPayload(invitation,'invite');if(signed.email?.toLowerCase()!==verified.email.toLowerCase())return '/signin?error=InviteEmailMismatch';invitedFirm=signed.firmId;}
   const identity=await googleIdentity(verified.email.toLowerCase(),verified.name||'Partner',invitedFirm);user.id=identity.id;
  }return true;},
  async jwt({token,user}){if(user)token.sub=user.id;return token;},
  async session({session,token}){if(session.user&&token.sub)session.user.id=token.sub;return session;}
 },
 logger:{error(){console.error('Authentication failed.');},warn(){},debug(){}}
};
// TODO: add Microsoft as a second verified identity provider.
export async function currentScope(){const session=await getServerSession(authOptions);if(!session?.user.id)throw new ScopeError('Sign in to continue.',401);return scopeForUser(session.user.id);}
