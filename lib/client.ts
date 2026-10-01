export async function requestJSON<T>(url:string,options:RequestInit={}):Promise<T>{
 let response:Response;
 try{response=await fetch(url,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options.headers},signal:options.signal??AbortSignal.timeout(60000)})}
 catch{throw new Error('Could not reach Mi-Chi. Check your connection and try again.')}
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Mi-Chi is temporarily unavailable. Please try again.');
 let body:unknown;
 try{body=await response.json()}catch{throw new Error('Mi-Chi returned an unreadable response. Please try again.')}
 if(!response.ok){const message=body&&typeof body==='object'&&'error' in body&&typeof body.error==='string'?body.error:'Request failed. Try again.';throw new Error(message)}
 return body as T;
}
