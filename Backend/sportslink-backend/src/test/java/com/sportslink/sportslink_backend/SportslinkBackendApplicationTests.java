package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SportslinkBackendApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper objectMapper;

    @MockitoBean
    private SupabaseRestClient supabaseRestClient;

    @Test
    void contextLoads() {
    }

    @Test
    void healthEndpointIsPublicAndReturnsUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().json("""
                        {
                          "status": "UP",
                          "application": "SPORTSLINK Backend"
                        }
                        """));
    }

    @Test
    void meEndpointRejectsRequestsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(result -> assertTrue(
                        result.getResponse().getStatus() == 401
                                || result.getResponse().getStatus() == 403,
                        "Expected an unauthenticated request to be rejected"));
    }

    @Test
    void meEndpointReturnsIdentityForAuthenticatedJwt() throws Exception {
        mockMvc.perform(get("/api/me").with(jwt()
                        .jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.authenticated").value(true));
    }

    @Test
    void profileEndpointRejectsRequestsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/profiles/me"))
                .andExpect(result -> assertTrue(
                        result.getResponse().getStatus() == 401
                                || result.getResponse().getStatus() == 403,
                        "Expected an unauthenticated profile request to be rejected"));
    }

    @Test
    void profileEndpointReturnsCurrentUsersProfile() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "user-123",
                    "username": "sporty-user",
                    "full_name": "SPORTSLINK Member"
                  }
                ]
                """);
        when(supabaseRestClient.get(eq("/rest/v1/profiles"), any(Jwt.class), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(get("/api/profiles/me").with(jwt()
                        .jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.full_name").value("SPORTSLINK Member"));

        verify(supabaseRestClient).get(eq("/rest/v1/profiles"), any(Jwt.class),
                eq(Map.of(
                        "id", "eq.user-123",
                        "select", "id,username,full_name,headline,bio,avatar_url,location,sport,role,skills,created_at,updated_at"
                )));
    }

    @Test
    void profileUpdateCannotChangeRoleOrIdentityFields() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "user-123",
                    "full_name": "Updated Member",
                    "headline": "Coach"
                  }
                ]
                """);
        when(supabaseRestClient.patch(eq("/rest/v1/profiles"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(patch("/api/profiles/me")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "full_name": "Updated Member",
                                  "headline": "Coach",
                                  "role": "admin",
                                  "id": "another-user",
                                  "username": "hacked"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.full_name").value("Updated Member"));

        verify(supabaseRestClient).patch(
                eq("/rest/v1/profiles"),
                any(Jwt.class),
                eq(Map.of(
                        "id", "eq.user-123",
                        "select", "id,username,full_name,headline,bio,avatar_url,location,sport,role,skills,created_at,updated_at"
                )),
                eq(Map.of(
                        "full_name", "Updated Member",
                        "headline", "Coach"
                )));
    }

    @Test
    void profileUpdateRejectsEmptyChanges() throws Exception {
        mockMvc.perform(patch("/api/profiles/me")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postsFeedRejectsRequestsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/posts"))
                .andExpect(result -> assertTrue(
                        result.getResponse().getStatus() == 401
                                || result.getResponse().getStatus() == 403,
                        "Expected an unauthenticated feed request to be rejected"));
    }

    @Test
    void postsFeedReturnsPostsForAuthenticatedUser() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "post-1",
                    "author_id": "user-123",
                    "content": "Welcome to SPORTSLINK",
                    "visibility": "public"
                  }
                ]
                """);
        when(supabaseRestClient.get(eq("/rest/v1/posts"), any(Jwt.class), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(get("/api/posts").with(jwt()
                        .jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("post-1"))
                .andExpect(jsonPath("$[0].content").value("Welcome to SPORTSLINK"));
    }

    @Test
    void creatingPostUsesAuthenticatedUserRatherThanSubmittedAuthorId() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "post-2",
                    "author_id": "user-123",
                    "content": "My first post",
                    "visibility": "public"
                  }
                ]
                """);
        when(supabaseRestClient.post(eq("/rest/v1/posts"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(post("/api/posts")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "  My first post  ",
                                  "visibility": "public",
                                  "author_id": "another-user"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("post-2"))
                .andExpect(jsonPath("$.author_id").value("user-123"));

        verify(supabaseRestClient).post(
                eq("/rest/v1/posts"),
                any(Jwt.class),
                eq(Map.of("select", "id,author_id,content,visibility,created_at,author:profiles!posts_author_id_fkey(id,username,full_name,headline,avatar_url,sport,role)")),
                eq(Map.of(
                        "author_id", "user-123",
                        "content", "My first post",
                        "visibility", "public"
                )));
    }

    @Test
    void creatingBlankPostIsRejected() throws Exception {
        mockMvc.perform(post("/api/posts")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "   ",
                                  "visibility": "public"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unsupportedPostVisibilityIsRejected() throws Exception {
        mockMvc.perform(post("/api/posts")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "My first post",
                                  "visibility": "admin"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
