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
public class SupabaseNotificationService {

    private static final String NOTIFICATION_COLUMNS =
            "id,user_id,actor_id,type,entity_type,entity_id,message,is_read,created_at,"
                    + "actor:profiles!notifications_actor_id_fkey(id,username,full_name,avatar_url)";

    private final SupabaseRestClient supabaseRestClient;

    public SupabaseNotificationService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode list(Jwt jwt, boolean unreadOnly) {
        Map<String, String> query = new LinkedHashMap<>();
        query.put("user_id", "eq." + jwt.getSubject());
        query.put("select", NOTIFICATION_COLUMNS);
        query.put("order", "created_at.desc");
        query.put("limit", "100");
        if (unreadOnly) {
            query.put("is_read", "eq.false");
        }
        return supabaseRestClient.get("/rest/v1/notifications", jwt, query);
    }

    public JsonNode markRead(Jwt jwt, UUID notificationId) {
        JsonNode rows = supabaseRestClient.patch(
                "/rest/v1/notifications",
                jwt,
                Map.of(
                        "id", "eq." + notificationId,
                        "user_id", "eq." + jwt.getSubject(),
                        "select", NOTIFICATION_COLUMNS
                ),
                Map.of("is_read", true));
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Notification not found or not accessible to this account.");
        }
        return rows.get(0);
    }

    public void delete(Jwt jwt, UUID notificationId) {
        supabaseRestClient.delete(
                "/rest/v1/notifications",
                jwt,
                Map.of(
                        "id", "eq." + notificationId,
                        "user_id", "eq." + jwt.getSubject()
                ));
    }
}
