package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class SupabaseRestClient {

    private final RestClient restClient;
    private final String publishableKey;

    public SupabaseRestClient(
            @Value("${sportslink.supabase.url}") String supabaseUrl,
            @Value("${sportslink.supabase.publishable-key:}") String publishableKey) {
        this.restClient = RestClient.builder()
                .baseUrl(supabaseUrl.replaceAll("/+$", ""))
                .build();
        this.publishableKey = publishableKey;
    }

    public JsonNode get(String path, Jwt jwt, Map<String, String> query) {
        ensureConfigured();
        try {
            return restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path(path);
                        query.forEach(uriBuilder::queryParam);
                        return uriBuilder.build();
                    })
                    .headers(headers -> setUserHeaders(headers, jwt))
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        } catch (RestClientException exception) {
            throw unreachable();
        }
    }

    public JsonNode post(String path, Jwt jwt, Map<String, String> query, Map<String, Object> body) {
        ensureConfigured();
        try {
            return restClient.post()
                    .uri(uriBuilder -> {
                        uriBuilder.path(path);
                        query.forEach(uriBuilder::queryParam);
                        return uriBuilder.build();
                    })
                    .headers(headers -> {
                        setUserHeaders(headers, jwt);
                        headers.set("Prefer", "return=representation");
                    })
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        } catch (RestClientException exception) {
            throw unreachable();
        }
    }

    public JsonNode patch(String path, Jwt jwt, Map<String, String> query, Map<String, Object> body) {
        ensureConfigured();
        try {
            return restClient.patch()
                    .uri(uriBuilder -> {
                        uriBuilder.path(path);
                        query.forEach(uriBuilder::queryParam);
                        return uriBuilder.build();
                    })
                    .headers(headers -> {
                        setUserHeaders(headers, jwt);
                        headers.set("Prefer", "return=representation");
                    })
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        } catch (RestClientException exception) {
            throw unreachable();
        }
    }

    public void delete(String path, Jwt jwt, Map<String, String> query) {
        ensureConfigured();
        try {
            restClient.delete()
                    .uri(uriBuilder -> {
                        uriBuilder.path(path);
                        query.forEach(uriBuilder::queryParam);
                        return uriBuilder.build();
                    })
                    .headers(headers -> setUserHeaders(headers, jwt))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw upstreamFailure(exception);
        } catch (RestClientException exception) {
            throw unreachable();
        }
    }

    private void setUserHeaders(HttpHeaders headers, Jwt jwt) {
        headers.set("apikey", publishableKey);
        headers.setBearerAuth(jwt.getTokenValue());
    }

    private void ensureConfigured() {
        if (publishableKey == null || publishableKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Supabase REST APIs are not configured. Set SUPABASE_PUBLISHABLE_KEY in the backend environment.");
        }
    }

    private ResponseStatusException upstreamFailure(RestClientResponseException exception) {
        int status = exception.getStatusCode().value();
        if (status == 400) {
            return new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Supabase rejected the request. Check the supplied values and resource constraints.");
        }
        if (status == 401) {
            return new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Supabase rejected the access token. Sign in again and retry.");
        }
        if (status == 403) {
            return new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Supabase denied this operation under the current database permissions or Row Level Security policies.");
        }
        if (status == 409) {
            return new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The requested change conflicts with an existing database record.");
        }
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Supabase REST request failed (HTTP " + status + "). Check the requested resource and database configuration.");
    }

    private ResponseStatusException unreachable() {
        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Unable to reach the Supabase REST API. Verify SUPABASE_URL and network connectivity.");
    }
}
