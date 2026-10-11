package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class SupabaseJwtDecoder implements JwtDecoder {

    private final JwtDecoder localDecoder;
    private final RestClient supabaseAuthClient;
    private final ObjectMapper objectMapper;
    private final String publishableKey;
    private final String expectedIssuer;

    public SupabaseJwtDecoder(
            @Value("${sportslink.supabase.url}") String supabaseUrl,
            @Value("${sportslink.supabase.publishable-key:}") String publishableKey,
            ObjectMapper objectMapper) {
        String baseUrl = supabaseUrl.replaceAll("/+$", "");
        this.expectedIssuer = baseUrl + "/auth/v1";
        this.publishableKey = publishableKey;
        this.objectMapper = objectMapper;
        this.supabaseAuthClient = RestClient.builder().baseUrl(baseUrl).build();

        NimbusJwtDecoder nimbusDecoder = NimbusJwtDecoder.withJwkSetUri(
                        expectedIssuer + "/.well-known/jwks.json")
                .jwsAlgorithms(algorithms -> {
                    algorithms.add(SignatureAlgorithm.RS256);
                    algorithms.add(SignatureAlgorithm.ES256);
                })
                .build();
        nimbusDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(expectedIssuer));
        this.localDecoder = nimbusDecoder;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            // Prefer local signature verification against Supabase's public signing keys.
            return localDecoder.decode(token);
        } catch (JwtException localFailure) {
            // Supabase's legacy HS256 signing key is intentionally not exposed via JWKS.
            // Ask Supabase Auth to validate such tokens rather than copying a shared secret
            // into Railway. This also provides a safe recovery path for signing-key rotation.
            return decodeAfterAuthVerification(token, localFailure);
        }
    }

    private Jwt decodeAfterAuthVerification(String token, JwtException localFailure) {
        if (publishableKey == null || publishableKey.isBlank()) {
            throw new JwtException("Supabase token verification is not configured.", localFailure);
        }

        JsonNode verifiedUser;
        try {
            verifiedUser = supabaseAuthClient.get()
                    .uri("/auth/v1/user")
                    .headers(headers -> {
                        headers.set("apikey", publishableKey);
                        headers.setBearerAuth(token);
                    })
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                throw new BadJwtException("Supabase Auth rejected the access token.", localFailure);
            }
            throw new JwtException("Supabase Auth could not verify the access token.", exception);
        } catch (RestClientException exception) {
            throw new JwtException("Unable to reach Supabase Auth to verify the access token.", exception);
        }

        String verifiedUserId = verifiedUser == null ? "" : verifiedUser.path("id").asText("");
        if (verifiedUserId.isBlank()) {
            throw new BadJwtException("Supabase Auth returned no user for the access token.", localFailure);
        }

        try {
            String[] parts = token.split("\\.", -1);
            if (parts.length != 3) {
                throw new BadJwtException("Malformed access token.", localFailure);
            }

            Map<String, Object> headers = readMap(parts[0]);
            Map<String, Object> claims = readMap(parts[1]);

            String subject = Objects.toString(claims.get("sub"), "");
            String issuer = Objects.toString(claims.get("iss"), "");
            if (!verifiedUserId.equals(subject) || !expectedIssuer.equals(issuer)) {
                throw new BadJwtException("Access token claims do not match the verified Supabase user.", localFailure);
            }

            if (!hasAuthenticatedAudience(claims.get("aud"))) {
                throw new BadJwtException("Access token has an unexpected audience.", localFailure);
            }

            Object expiryValue = claims.get("exp");
            if (!(expiryValue instanceof Number expiryNumber)) {
                throw new BadJwtException("Access token has no valid expiry.", localFailure);
            }
            Instant expiry = Instant.ofEpochSecond(expiryNumber.longValue());
            if (!Instant.now().isBefore(expiry)) {
                throw new BadJwtException("Access token has expired.", localFailure);
            }

            // Spring's Jwt accessors expect temporal claims as Instants.
            convertTemporalClaim(claims, "exp");
            convertTemporalClaim(claims, "iat");
            convertTemporalClaim(claims, "nbf");

            return Jwt.withTokenValue(token)
                    .headers(builder -> builder.putAll(headers))
                    .claims(builder -> builder.putAll(claims))
                    .build();
        } catch (IOException | IllegalArgumentException exception) {
            throw new BadJwtException("Unable to read the verified access token claims.", exception);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readMap(String encodedPart) throws IOException {
        byte[] jsonBytes = Base64.getUrlDecoder().decode(encodedPart);
        Map<?, ?> parsed = objectMapper.readValue(jsonBytes, Map.class);
        Map<String, Object> result = new HashMap<>();
        parsed.forEach((key, value) -> {
            if (key instanceof String stringKey) {
                result.put(stringKey, value);
            }
        });
        return result;
    }

    private boolean hasAuthenticatedAudience(Object audience) {
        if (audience instanceof String value) {
            return "authenticated".equals(value);
        }
        return audience instanceof Collection<?> values && values.contains("authenticated");
    }

    private void convertTemporalClaim(Map<String, Object> claims, String name) {
        Object value = claims.get(name);
        if (value instanceof Number number) {
            claims.put(name, Instant.ofEpochSecond(number.longValue()));
        }
    }
}
