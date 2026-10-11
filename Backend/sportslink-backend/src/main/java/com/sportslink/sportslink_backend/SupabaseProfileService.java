package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SupabaseProfileService {

    private static final String PROFILE_COLUMNS =
            "id,username,full_name,headline,bio,avatar_url,location,sport,role,skills,created_at,updated_at";

    private final SupabaseRestClient supabaseRestClient;

    public SupabaseProfileService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode getMyProfile(Jwt jwt) {
        JsonNode rows = supabaseRestClient.get(
                "/rest/v1/profiles",
                jwt,
                Map.of(
                        "id", "eq." + jwt.getSubject(),
                        "select", PROFILE_COLUMNS
                ));
        return firstRow(rows);
    }

    public JsonNode updateMyProfile(Jwt jwt, Map<String, Object> updates) {
        JsonNode rows = supabaseRestClient.patch(
                "/rest/v1/profiles",
                jwt,
                Map.of(
                        "id", "eq." + jwt.getSubject(),
                        "select", PROFILE_COLUMNS
                ),
                updates);
        return firstRow(rows);
    }

    private JsonNode firstRow(JsonNode rows) {
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            return null;
        }
        return rows.get(0);
    }
}
