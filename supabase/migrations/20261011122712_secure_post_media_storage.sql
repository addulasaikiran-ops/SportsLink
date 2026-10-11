-- Keep post media private. Signed URLs are generated only for users allowed to see the parent post.
update storage.buckets
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/webm','video/quicktime'
    ]
where id = 'post-media';

drop policy if exists post_media_storage_select_visible_post on storage.objects;
create policy post_media_storage_select_visible_post
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'post-media'
    and exists (
      select 1
      from public.post_media pm
      join public.posts p on p.id = pm.post_id
      where pm.media_url = storage.objects.name
        and (
          p.visibility = 'public'
          or p.author_id = (select auth.uid())
          or (
            p.visibility = 'followers'
            and exists (
              select 1 from public.follows f
              where f.follower_id = (select auth.uid())
                and f.following_id = p.author_id
            )
          )
        )
    )
  );
