package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SupabaseFollowService {

    private static final String PROFILE_COLUMNS =
            "id,username,full_name,headline,avatar_url,sport,role,profile_details_completed";
    private static final String FOLLOWING_COLUMNS =
            "follower_id,following_id,created_at,following:profiles!follows_following_id_fkey("
                    + PROFILE_COLUMNS + ")";
    private static final String FOLLOWER_COLUMNS =
            "follower_id,following_id,created_at,follower:profiles!follows_follower_id_fkey("
                    + PROFILE_COLUMNS + ")";

    private final SupabaseRestClient supabaseRestClient;

    public SupabaseFollowService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode list(Jwt jwt, String direction) {
        boolean followers;
        if ("followers".equals(direction)) {
            followers = true;
        } else if ("following".equals(direction)) {
            followers = false;
        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "direction must be 'followers' or 'following'.");
        }

        Map<String, String> query = new LinkedHashMap<>();
        query.put(followers ? "following_id" : "follower_id", "eq." + jwt.getSubject());
        query.put("select", followers ? FOLLOWER_COLUMNS : FOLLOWING_COLUMNS);
        query.put("order", "created_at.desc");
        query.put("limit", "100");
        return supabaseRestClient.get("/rest/v1/follows", jwt, query);
    }

    public JsonNode follow(Jwt jwt, UUID profileId) {
        String currentUserId = jwt.getSubject();
        if (currentUserId.equals(profileId.toString())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot follow your own profile.");
        }

        JsonNode existing = supabaseRestClient.get(
                "/rest/v1/follows",
                jwt,
                Map.of(
                        "follower_id", "eq." + currentUserId,
                        "following_id", "eq." + profileId,
                        "select", FOLLOWING_COLUMNS,
                        "limit", "1"
                ));
        if (existing != null && existing.isArray() && !existing.isEmpty()) {
            return existing.get(0);
        }

        JsonNode inserted = supabaseRestClient.post(
                "/rest/v1/follows",
                jwt,
                Map.of("select", FOLLOWING_COLUMNS),
                Map.of(
                        "follower_id", currentUserId,
                        "following_id", profileId.toString()
                ));
        if (inserted == null || !inserted.isArray() || inserted.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Supabase did not return the new follow record.");
        }
        return inserted.get(0);
    }

    public void unfollow(Jwt jwt, UUID profileId) {
        if (jwt.getSubject().equals(profileId.toString())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot unfollow your own profile.");
        }
        supabaseRestClient.delete(
                "/rest/v1/follows",
                jwt,
                Map.of(
                        "follower_id", "eq." + jwt.getSubject(),
                        "following_id", "eq." + profileId
                ));
    }
}
