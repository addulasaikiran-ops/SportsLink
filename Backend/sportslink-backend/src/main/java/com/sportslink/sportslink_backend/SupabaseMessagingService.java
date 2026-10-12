package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class SupabaseMessagingService {

    private static final String CONVERSATION_COLUMNS =
            "id,is_group,title,created_by,created_at,"
                    + "members:conversation_members(user_id,joined_at,last_read_at,"
                    + "profile:profiles!conversation_members_user_id_fkey(id,username,full_name,avatar_url,profile_details_completed))";
    private static final String MESSAGE_COLUMNS =
            "id,conversation_id,sender_id,content,created_at,edited_at,"
                    + "sender:profiles!messages_sender_id_fkey(id,username,full_name,avatar_url,profile_details_completed)";

    private final SupabaseRestClient supabaseRestClient;

    public SupabaseMessagingService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode listConversations(Jwt jwt) {
        return supabaseRestClient.get(
                "/rest/v1/conversations",
                jwt,
                Map.of("select", CONVERSATION_COLUMNS, "order", "created_at.desc", "limit", "100"));
    }

    public JsonNode createConversation(Jwt jwt, CreateConversationRequest request) {
        String currentUserId = jwt.getSubject();
        Set<String> memberIds = new LinkedHashSet<>();
        for (UUID memberId : request.memberIds()) {
            if (!memberId.toString().equals(currentUserId)) memberIds.add(memberId.toString());
        }
        if (memberIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Add at least one other participant to the conversation.");
        }

        Map<String, Object> rpcBody = new java.util.LinkedHashMap<>();
        rpcBody.put("p_member_ids", new ArrayList<>(memberIds));
        rpcBody.put("p_is_group", Boolean.TRUE.equals(request.isGroup()));
        rpcBody.put("p_title", request.title());
        JsonNode result = supabaseRestClient.post(
                "/rest/v1/rpc/create_conversation_for_user", jwt, Map.of(), rpcBody);
        if (result == null || result.isNull() || result.isMissingNode()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Supabase did not return the new conversation id.");
        }
        String idValue = result.isTextual() ? result.asText()
                : result.isArray() && !result.isEmpty() ? result.get(0).asText() : result.asText();
        UUID conversationId;
        try {
            conversationId = UUID.fromString(idValue);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Supabase returned an invalid conversation id.");
        }
        JsonNode rows = supabaseRestClient.get(
                "/rest/v1/conversations",
                jwt,
                Map.of("id", "eq." + conversationId, "select", CONVERSATION_COLUMNS, "limit", "1"));
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "The conversation was created but could not be read back.");
        }
        return rows.get(0);
    }

    public JsonNode listMessages(Jwt jwt, UUID conversationId) {
        return supabaseRestClient.get(
                "/rest/v1/messages",
                jwt,
                Map.of(
                        "conversation_id", "eq." + conversationId,
                        "select", MESSAGE_COLUMNS,
                        "order", "created_at.asc",
                        "limit", "100"
                ));
    }

    public JsonNode sendMessage(Jwt jwt, UUID conversationId, CreateMessageRequest request) {
        String content = request.content().trim();
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content cannot be blank.");
        }
        JsonNode rows = supabaseRestClient.post(
                "/rest/v1/messages",
                jwt,
                Map.of("select", MESSAGE_COLUMNS),
                Map.of(
                        "conversation_id", conversationId.toString(),
                        "sender_id", jwt.getSubject(),
                        "content", content
                ));
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Supabase did not return the sent message.");
        }
        return rows.get(0);
    }

    public JsonNode markRead(Jwt jwt, UUID conversationId) {
        JsonNode rows = supabaseRestClient.patch(
                "/rest/v1/conversation_members",
                jwt,
                Map.of(
                        "conversation_id", "eq." + conversationId,
                        "user_id", "eq." + jwt.getSubject(),
                        "select", "conversation_id,user_id,joined_at,last_read_at"
                ),
                Map.of("last_read_at", Instant.now().toString()));
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Conversation not found or not accessible to this account.");
        }
        return rows.get(0);
    }

    private void addMember(Jwt jwt, UUID conversationId, String memberId) {
        supabaseRestClient.post(
                "/rest/v1/conversation_members",
                jwt,
                Map.of("select", "conversation_id,user_id,joined_at,last_read_at"),
                Map.of(
                        "conversation_id", conversationId.toString(),
                        "user_id", memberId
                ));
    }

    private void cleanupConversation(
            Jwt jwt, UUID conversationId, Set<String> memberIds, String currentUserId) {
        Set<String> allMembers = new LinkedHashSet<>(memberIds);
        allMembers.add(currentUserId);
        for (String memberId : allMembers) {
            try {
                supabaseRestClient.delete(
                        "/rest/v1/conversation_members",
                        jwt,
                        Map.of(
                                "conversation_id", "eq." + conversationId,
                                "user_id", "eq." + memberId
                        ));
            } catch (RuntimeException ignored) {
                // Best-effort cleanup without hiding the original failure.
            }
        }
        try {
            supabaseRestClient.delete(
                    "/rest/v1/conversations",
                    jwt,
                    Map.of(
                            "id", "eq." + conversationId,
                            "created_by", "eq." + currentUserId
                    ));
        } catch (RuntimeException ignored) {
            // Best-effort cleanup without hiding the original failure.
        }
    }
}
