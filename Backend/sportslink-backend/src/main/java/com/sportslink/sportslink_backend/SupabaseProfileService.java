package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;

@Service
public class SupabaseProfileService {

    private static final String PROFILE_COLUMNS =
            "id,username,full_name,headline,bio,avatar_url,location,sport,role,skills,created_at,updated_at";

    private final RestClient restClient;
    private final String publishableKey;

    public SupabaseProfileService(
            @Value("${sportslink.supabase.url}") String supabaseUrl,
            @Value("${sportslink.supabase.publishable-key:}") String publishableKey) {
        this.restClient = RestClient.builder()
                .baseUrl(supabaseUrl.replaceAll("/+$", ""))
                .build();
        this.publishableKey = publishableKey;
    }

    public JsonNode getMyProfile(Jwt jwt) {
        ensureConfigured();
        try {
            JsonNode rows = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/rest/v1/profiles")
                            .queryParam("id", "eq." + jwt.getSubject())
                            .queryParam("select", PROFILE_COLUMNS)
                            .build())
                    .header("apikey", publishableKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt.getTokenValue())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);
            return firstRow(rows);
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to reach the Supabase REST API. Verify SUPABASE_URL and network connectivity.");
        }
    }

    public JsonNode updateMyProfile(Jwt jwt, Map<String, Object> updates) {
        ensureConfigured();
        try {
            JsonNode rows = restClient.patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/rest/v1/profiles")
                            .queryParam("id", "eq." + jwt.getSubject())
                            .queryParam("select", PROFILE_COLUMNS)
                            .build())
                    .header("apikey", publishableKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt.getTokenValue())
                    .header("Prefer", "return=representation")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(updates)
                    .retrieve()
                    .body(JsonNode.class);
            return firstRow(rows);
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to reach the Supabase REST API. Verify SUPABASE_URL and network connectivity.");
        }
    }

    private void ensureConfigured() {
        if (publishableKey == null || publishableKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Profile APIs are not configured. Set SUPABASE_PUBLISHABLE_KEY in the backend environment.");
        }
    }

    private JsonNode firstRow(JsonNode rows) {
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            return null;
        }
        return rows.get(0);
    }

    private ResponseStatusException upstreamFailure(RestClientResponseException exception) {
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Supabase profile request failed (HTTP " + exception.getStatusCode().value()
                        + "). Check the profile table and its Row Level Security policies.");
    }
}
