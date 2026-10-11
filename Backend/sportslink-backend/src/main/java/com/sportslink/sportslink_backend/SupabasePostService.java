package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class SupabasePostService {

    private static final String POST_COLUMNS =
            "id,author_id,content,visibility,created_at,"
                    + "author:profiles!posts_author_id_fkey(id,username,full_name,headline,avatar_url,sport,role),"
                    + "media:post_media(id,media_url,media_type,created_at)";

    private final SupabaseRestClient supabaseRestClient;

    public SupabasePostService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode getFeed(Jwt jwt) {
        return supabaseRestClient.get(
                "/rest/v1/posts",
                jwt,
                Map.of(
                        "select", POST_COLUMNS,
                        "order", "created_at.desc",
                        "limit", "100"
                ));
    }

    public JsonNode createPost(Jwt jwt, CreatePostRequest request) {
        String content = request.content().trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post content cannot be blank.");
        }

        JsonNode rows = supabaseRestClient.post(
                "/rest/v1/posts",
                jwt,
                Map.of("select", POST_COLUMNS),
                Map.of(
                        "author_id", jwt.getSubject(),
                        "content", content,
                        "visibility", request.visibility()
                ));

        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Supabase did not return the created post. Check the posts INSERT policy.");
        }
        return rows.get(0);
    }
}
