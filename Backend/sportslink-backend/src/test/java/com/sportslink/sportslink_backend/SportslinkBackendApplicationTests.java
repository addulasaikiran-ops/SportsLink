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
    private SupabaseProfileService profileService;

    @MockitoBean
    private SupabasePostService postService;

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
    void profileEndpointReturnsOnlyTheAuthenticatedUsersProfile() throws Exception {
        JsonNode profile = objectMapper.readTree("""
                {
                  "id": "user-123",
                  "username": "sporty-user",
                  "full_name": "SPORTSLINK Member"
                }
                """);
        when(profileService.getMyProfile(any(Jwt.class))).thenReturn(profile);

        mockMvc.perform(get("/api/profiles/me").with(jwt()
                        .jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.full_name").value("SPORTSLINK Member"));
    }

    @Test
    void profileUpdateAcceptsOnlyEditableProfileFields() throws Exception {
        JsonNode profile = objectMapper.readTree("""
                {
                  "id": "user-123",
                  "full_name": "Updated Member",
                  "headline": "Coach"
                }
                """);
        when(profileService.updateMyProfile(any(Jwt.class), anyMap())).thenReturn(profile);

        mockMvc.perform(patch("/api/profiles/me")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "full_name": "Updated Member",
                                  "headline": "Coach",
                                  "role": "admin"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.full_name").value("Updated Member"));
        verify(profileService).updateMyProfile(any(Jwt.class), eq(java.util.Map.of(
                "full_name", "Updated Member",
                "headline", "Coach")));
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
        JsonNode posts = objectMapper.readTree("""
                [
                  {
                    "id": "post-1",
                    "author_id": "user-123",
                    "content": "Welcome to SPORTSLINK",
                    "visibility": "public"
                  }
                ]
                """);
        when(postService.getFeed(any(Jwt.class))).thenReturn(posts);

        mockMvc.perform(get("/api/posts").with(jwt()
                        .jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("post-1"))
                .andExpect(jsonPath("$[0].content").value("Welcome to SPORTSLINK"));
    }

    @Test
    void creatingPostReturnsCreatedAndUsesAuthenticatedRequest() throws Exception {
        JsonNode createdPost = objectMapper.readTree("""
                {
                  "id": "post-2",
                  "author_id": "user-123",
                  "content": "My first post",
                  "visibility": "public"
                }
                """);
        when(postService.createPost(any(Jwt.class), any(CreatePostRequest.class))).thenReturn(createdPost);

        mockMvc.perform(post("/api/posts")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "My first post",
                                  "visibility": "public",
                                  "author_id": "another-user"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("post-2"))
                .andExpect(jsonPath("$.author_id").value("user-123"));
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
