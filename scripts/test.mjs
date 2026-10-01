import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(path.join(tmpdir(),'michi-test-'));
const env={...process.env,DATABASE_URL:'file:'+path.join(dir,'test.db'),MOCK_MODE:'true',ENCRYPTION_KEY:'a'.repeat(64)};
try{
 const schema=readFileSync('prisma/schema.prisma','utf8').replace('provider = "postgresql"','provider = "sqlite"');
 writeFileSync(path.join(dir,'schema.prisma'),schema);
 const setup=spawnSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--schema',path.join(dir,'schema.prisma'),'--skip-generate'],{env,stdio:'pipe',timeout:60000});
 if(setup.status!==0)throw new Error(setup.stderr?.toString()||'Test database setup failed');
 const run=spawnSync(process.execPath,['--import','tsx','--test','tests/scoring.test.ts','tests/scope.test.ts','tests/presentation.test.ts'],{env,stdio:'inherit',timeout:60000});
 process.exitCode=run.status??1;
}finally{rmSync(dir,{recursive:true,force:true});}
