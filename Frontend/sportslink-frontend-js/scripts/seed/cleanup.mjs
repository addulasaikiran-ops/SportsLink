import { createClient } from '@supabase/supabase-js';
const args=process.argv.slice(2);const write=args.includes('--write');
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'';const key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
if(!url||!key)throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
const ref=new URL(url).hostname.split('.')[0];if(ref==='ozqitjwttigfpmnroeqi')throw new Error('Cleanup refuses the known production project.');
const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
let page=1,users=[];while(true){const {data,error}=await db.auth.admin.listUsers({page,perPage:1000});if(error)throw error;users.push(...data.users.filter(u=>u.user_metadata?.is_seed===true));if(data.users.length<1000)break;page++;}
console.log(`Found ${users.length} seed-flagged Auth users in project ${ref}.`);
if(!write){console.log('Dry run: no users deleted. Re-run with --write and type the project ref to confirm.');process.exit(0);}
if(process.env.SEED_CLEANUP_CONFIRM!==ref)throw new Error(`Set SEED_CLEANUP_CONFIRM=${ref} after reviewing the dry run.`);
for(const user of users){const {error}=await db.auth.admin.deleteUser(user.id);if(error)throw error;}
console.log(`Deleted ${users.length} seed users. Verify dependent rows and storage objects on staging; cascades are schema-dependent.`);