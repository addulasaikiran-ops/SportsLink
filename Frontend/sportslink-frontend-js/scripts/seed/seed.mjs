import { createClient } from '@supabase/supabase-js';
import { generatePersonas, randomPassword } from './personas.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const args=process.argv.slice(2);
const flag=(name)=>args.includes(name);
const value=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback;};
const count=Number(value('--count','500'));
const dryRun=!flag('--write')||flag('--dry-run');
const productionOverride=flag('--i-know-this-is-production')&&process.env.SEED_ALLOW_PROD==='true';
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const prodRef='ozqitjwttigfpmnroeqi';
if(!Number.isInteger(count)||count<1||count>500)throw new Error('--count must be an integer from 1 to 500.');
if(!url)throw new Error('Set SUPABASE_URL in the environment.');
const projectRef=new URL(url).hostname.split('.')[0];
if(projectRef===prodRef&&!productionOverride)throw new Error('Refusing to seed the known production project. Use staging/local Supabase.');
if(!dryRun&&!serviceKey)throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in the environment for write mode.');
const personas=generatePersonas(count);
const names=new Set(personas.map(p=>p.full_name));
const usernames=personas.map(p=>p.username).filter(Boolean);
const errors=[];
for(const p of personas){if(p.full_name.length<2||p.full_name.length>120)errors.push(`name:${p.index}`);if(p.bio.length<20||p.bio.length>500)errors.push(`bio:${p.index}`);if(p.username&&!/^[a-z0-9_]{3,30}$/.test(p.username))errors.push(`username:${p.index}`);if(!p.location.includes(','))errors.push(`location:${p.index}`);}
if(new Set(usernames).size!==usernames.length)errors.push('duplicate usernames');
if(errors.length)throw new Error(`Persona validation failed: ${errors.slice(0,10).join(', ')}`);
const batchId=process.env.SEED_BATCH_ID||crypto.randomUUID();
console.log(JSON.stringify({mode:dryRun?'dry-run':'write',projectRef,count,batchId,uniqueNames:names.size,uniqueUsernames:usernames.length,emailsNonDeliverable:true,productionOverrideUsed:productionOverride},null,2));
if(dryRun){console.log('Dry run only: no Supabase writes performed.');process.exit(0);}
const supabase=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
const {data:probe,error:probeError}=await supabase.from('profiles').select('id,is_seed').limit(1);
if(probeError)throw new Error(`Schema check failed; apply the is_seed migration to staging first: ${probeError.message}`);
const manifestPath=path.join(path.dirname(new URL(import.meta.url).pathname),'seed_manifest.json');
let manifest={batchId,users:[]};try{manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));}catch{}
let created=0,updated=0,skipped=0;
for(let start=0;start<personas.length;start+=10){
 for(const p of personas.slice(start,start+10)){
  const {data:list,error:listError}=await supabase.auth.admin.listUsers({page:1,perPage:1000});if(listError)throw listError;
  let user=list.users.find(u=>u.email===p.email);
  if(user&&user.user_metadata?.is_seed!==true){skipped++;continue;}
  if(!user){const {data,error}=await supabase.auth.admin.createUser({email:p.email,password:randomPassword(),email_confirm:true,user_metadata:{is_seed:true,seed_batch:batchId,seed_index:p.index}});if(error)throw error;user=data.user;created++;}
  const profile={id:user.id,full_name:p.full_name,username:p.username,role:p.role,sport:p.sport,location:p.location,headline:p.headline,bio:p.bio,studied_at:p.studied_at,skills:p.skills,created_at:p.created_at,onboarding_completed_at:p.onboarding_completed_at,profile_details_completed:p.profile_details_completed,is_seed:true,avatar_url:null,cover_url:null,website_url:null};
  const {data:existing,error:readError}=await supabase.from('profiles').select('id').eq('id',user.id).maybeSingle();if(readError)throw readError;
  if(!existing)throw new Error(`Auth trigger did not create profile for seed user ${p.index}; stopping rather than inserting duplicate profile.`);
  const {error:updateError}=await supabase.from('profiles').update(profile).eq('id',user.id);if(updateError)throw updateError;updated++;
  manifest.users.push({index:p.index,user_id:user.id,email:p.email});
 }
 await new Promise(resolve=>setTimeout(resolve,350));
}
await fs.writeFile(manifestPath,JSON.stringify({batchId,users:manifest.users},null,2));
console.log(JSON.stringify({batchId,created,profilesUpdated:updated,skipped,manifestPath},null,2));
console.log('Note: this initial runner creates profiles only. Seed-only activity generation is intentionally not run until staging trigger/RLS/cascade behavior is verified.');