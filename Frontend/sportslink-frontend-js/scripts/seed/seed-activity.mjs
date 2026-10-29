import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: bots, error: botsError } = await db.from('profiles')
  .select('id,full_name,sport,location,is_seed').eq('is_seed', true).order('created_at').limit(20);
if (botsError) throw botsError;
if (!bots || bots.length !== 20) throw new Error(`Expected exactly 20 labelled demo profiles; found ${bots?.length ?? 0}. No activity seeded.`);

const templates = [
  p => `[SPORTSLINK DEMO] ${p.sport || 'Sport'} training update: focusing on consistency, recovery, and measurable progress this week. What drills are helping your game most?`,
  p => `[SPORTSLINK DEMO] Connecting with athletes and coaches in ${p.location || 'the sports community'}! Always keen to exchange ${p.sport || 'sports'} tips and learn from different training approaches.`,
  p => `[SPORTSLINK DEMO] A reminder for every athlete: progress comes from showing up, reviewing the basics, and supporting your teammates. Keep working!`
];
const posts = [];
for (let i = 0; i < bots.length; i++) {
  const bot = bots[i];
  const content = templates[i % templates.length](bot);
  const { data: existing, error: findError } = await db.from('posts').select('id,author_id,content')
    .eq('author_id', bot.id).like('content', '[SPORTSLINK DEMO]%').limit(1);
  if (findError) throw findError;
  let post = existing?.[0];
  if (!post) {
    const { data, error } = await db.from('posts').insert({ author_id: bot.id, content, visibility: 'public' }).select('id,author_id,content').single();
    if (error) throw error;
    post = data;
  }
  posts.push(post);
}
let follows=0, reactions=0, comments=0;
for (let i = 0; i < bots.length; i++) {
  for (const offset of [1, 3, 5]) {
    const target = bots[(i + offset) % bots.length];
    const { error } = await db.from('follows').upsert({ follower_id: bots[i].id, following_id: target.id }, { onConflict: 'follower_id,following_id', ignoreDuplicates: true });
    if (error) throw error;
    follows++;
  }
  const post = posts[(i + 1) % posts.length];
  const { error: reactionError } = await db.from('post_reactions').upsert({
    post_id: post.id, user_id: bots[i].id, reaction: ['like','celebrate','support'][i % 3]
  }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
  if (reactionError) throw reactionError;
  reactions++;
  const comment = `[Demo Bot] Great perspective on ${bots[(i + 1) % bots.length].sport || 'sports'} — consistency and teamwork make a real difference!`;
  const { data: oldComments, error: commentFindError } = await db.from('comments').select('id')
    .eq('post_id', post.id).eq('author_id', bots[i].id).like('content', '[Demo Bot]%').limit(1);
  if (commentFindError) throw commentFindError;
  if (!oldComments?.length) {
    const { error } = await db.from('comments').insert({ post_id: post.id, author_id: bots[i].id, content: comment });
    if (error) throw error;
    comments++;
  }
}
console.log(JSON.stringify({ demoProfiles: bots.length, demoPosts: posts.length, followEdgesAttempted: follows, reactionsAttempted: reactions, commentsCreated: comments }, null, 2));
