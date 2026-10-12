package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Service
public class SupabasePostInteractionService {

    private static final String COMMENT_COLUMNS =
            "id,post_id,author_id,content,created_at,author:profiles!comments_author_id_fkey(id,username,full_name,avatar_url,profile_details_completed)";
    private static final String REACTION_COLUMNS = "post_id,user_id,reaction,created_at";

    private final SupabaseRestClient supabaseRestClient;

    public SupabasePostInteractionService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode getComments(Jwt jwt, UUID postId) {
        return supabaseRestClient.get(
                "/rest/v1/comments",
                jwt,
                Map.of(
                        "post_id", "eq." + postId,
                        "select", COMMENT_COLUMNS,
                        "order", "created_at.asc",
                        "limit", "100"
                ));
    }

    public JsonNode createComment(Jwt jwt, UUID postId, CreateCommentRequest request) {
        String content = request.content().trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment content cannot be blank.");
        }
        JsonNode rows = supabaseRestClient.post(
                "/rest/v1/comments",
                jwt,
                Map.of("select", COMMENT_COLUMNS),
                Map.of(
                        "post_id", postId.toString(),
                        "author_id", jwt.getSubject(),
                        "content", content
                ));
        return firstRowOrBadGateway(rows, "Supabase did not return the created comment.");
    }

    public JsonNode getReactions(Jwt jwt, UUID postId) {
        return supabaseRestClient.get(
                "/rest/v1/post_reactions",
                jwt,
                Map.of(
                        "post_id", "eq." + postId,
                        "select", REACTION_COLUMNS,
                        "order", "created_at.asc",
                        "limit", "500"
                ));
    }

    public JsonNode setMyReaction(Jwt jwt, UUID postId, SetReactionRequest request) {
        Map<String, String> query = Map.of(
                "post_id", "eq." + postId,
                "user_id", "eq." + jwt.getSubject(),
                "select", REACTION_COLUMNS
        );
        JsonNode existingRows = supabaseRestClient.get(
                "/rest/v1/post_reactions",
                jwt,
                Map.of(
                        "post_id", query.get("post_id"),
                        "user_id", query.get("user_id"),
                        "select", REACTION_COLUMNS,
                        "limit", "1"
                ));

        Map<String, Object> values = Map.of("reaction", request.reaction());
        if (existingRows != null && existingRows.isArray() && !existingRows.isEmpty()) {
            JsonNode updatedRows = supabaseRestClient.patch(
                    "/rest/v1/post_reactions",
                    jwt,
                    query,
                    values);
            return firstRowOrBadGateway(updatedRows, "Supabase did not return the updated reaction.");
        }

        JsonNode insertedRows = supabaseRestClient.post(
                "/rest/v1/post_reactions",
                jwt,
                Map.of("select", REACTION_COLUMNS),
                Map.of(
                        "post_id", postId.toString(),
                        "user_id", jwt.getSubject(),
                        "reaction", request.reaction()
                ));
        return firstRowOrBadGateway(insertedRows, "Supabase did not return the created reaction.");
    }

    public void deleteMyReaction(Jwt jwt, UUID postId) {
        supabaseRestClient.delete(
                "/rest/v1/post_reactions",
                jwt,
                Map.of(
                        "post_id", "eq." + postId,
                        "user_id", "eq." + jwt.getSubject()
                ));
    }

    private JsonNode firstRowOrBadGateway(JsonNode rows, String message) {
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
        }
        return rows.get(0);
    }
}
