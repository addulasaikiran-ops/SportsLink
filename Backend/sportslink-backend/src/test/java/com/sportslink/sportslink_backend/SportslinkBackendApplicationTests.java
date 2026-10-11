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

import java.util.Map;
import java.util.UUID;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    @Test
    void profileDirectoryRejectsRequestsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/profiles"))
                .andExpect(result -> assertTrue(
                        result.getResponse().getStatus() == 401
                                || result.getResponse().getStatus() == 403,
                        "Expected an unauthenticated profile directory request to be rejected"));
    }

    @Test
    void profileDirectoryReturnsProfilesVisibleUnderSupabaseRls() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "another-user",
                    "username": "coach-one",
                    "full_name": "Coach One",
                    "sport": "Football"
                  }
                ]
                """);
        when(supabaseRestClient.get(eq("/rest/v1/profiles"), any(Jwt.class), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(get("/api/profiles").with(jwt()
                        .jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("another-user"))
                .andExpect(jsonPath("$[0].full_name").value("Coach One"));

        verify(supabaseRestClient).get(
                eq("/rest/v1/profiles"),
                any(Jwt.class),
                eq(Map.of(
                        "id", "neq.user-123",
                        "select", "id,username,full_name,headline,avatar_url,sport,role,created_at",
                        "order", "created_at.desc",
                        "limit", "100"
                )));
    }

    @Test
    void creatingCommentUsesTheAuthenticatedAuthorId() throws Exception {
        UUID postId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "comment-1",
                    "post_id": "11111111-1111-1111-1111-111111111111",
                    "author_id": "user-123",
                    "content": "Great update"
                  }
                ]
                """);
        when(supabaseRestClient.post(eq("/rest/v1/comments"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(post("/api/posts/{postId}/comments", postId)
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": " Great update ",
                                  "author_id": "another-user"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author_id").value("user-123"))
                .andExpect(jsonPath("$.content").value("Great update"));

        verify(supabaseRestClient).post(
                eq("/rest/v1/comments"), any(Jwt.class),
                eq(Map.of("select", "id,post_id,author_id,content,created_at,author:profiles!comments_author_id_fkey(id,username,full_name,avatar_url)")),
                eq(Map.of(
                        "post_id", postId.toString(),
                        "author_id", "user-123",
                        "content", "Great update"
                )));
    }

    @Test
    void settingReactionUsesAuthenticatedUserId() throws Exception {
        UUID postId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        JsonNode emptyRows = objectMapper.readTree("[]");
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "post_id": "22222222-2222-2222-2222-222222222222",
                    "user_id": "user-123",
                    "reaction": "celebrate"
                  }
                ]
                """);
        when(supabaseRestClient.get(eq("/rest/v1/post_reactions"), any(Jwt.class), anyMap()))
                .thenReturn(emptyRows);
        when(supabaseRestClient.post(eq("/rest/v1/post_reactions"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(put("/api/posts/{postId}/reaction", postId)
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reaction": "celebrate",
                                  "user_id": "another-user"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user_id").value("user-123"))
                .andExpect(jsonPath("$.reaction").value("celebrate"));

        verify(supabaseRestClient).post(
                eq("/rest/v1/post_reactions"), any(Jwt.class),
                eq(Map.of("select", "post_id,user_id,reaction,created_at")),
                eq(Map.of(
                        "post_id", postId.toString(),
                        "user_id", "user-123",
                        "reaction", "celebrate"
                )));
    }

    @Test
    void followingAnotherProfileUsesAuthenticatedFollowerId() throws Exception {
        UUID profileId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        JsonNode emptyRows = objectMapper.readTree("[]");
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "follower_id": "user-123",
                    "following_id": "33333333-3333-3333-3333-333333333333"
                  }
                ]
                """);
        when(supabaseRestClient.get(eq("/rest/v1/follows"), any(Jwt.class), anyMap()))
                .thenReturn(emptyRows);
        when(supabaseRestClient.post(eq("/rest/v1/follows"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(post("/api/follows/{profileId}", profileId)
                        .with(jwt().jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.follower_id").value("user-123"))
                .andExpect(jsonPath("$.following_id").value(profileId.toString()));

        verify(supabaseRestClient).post(
                eq("/rest/v1/follows"), any(Jwt.class),
                anyMap(),
                eq(Map.of("follower_id", "user-123", "following_id", profileId.toString())));
    }

    @Test
    void notificationListIsRestrictedToTheAuthenticatedUserAndUnreadFilter() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "notification-1",
                    "user_id": "user-123",
                    "is_read": false,
                    "message": "Welcome"
                  }
                ]
                """);
        when(supabaseRestClient.get(eq("/rest/v1/notifications"), any(Jwt.class), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(get("/api/notifications")
                        .param("unreadOnly", "true")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].user_id").value("user-123"));

        verify(supabaseRestClient).get(
                eq("/rest/v1/notifications"), any(Jwt.class),
                eq(Map.of(
                        "user_id", "eq.user-123",
                        "select", "id,user_id,actor_id,type,entity_type,entity_id,message,is_read,created_at,actor:profiles!notifications_actor_id_fkey(id,username,full_name,avatar_url)",
                        "order", "created_at.desc",
                        "limit", "100",
                        "is_read", "eq.false"
                )));
    }

    @Test
    void creatingOpportunityUsesAuthenticatedCreatorIdAndSafeDefaults() throws Exception {
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "opportunity-1",
                    "created_by": "user-123",
                    "title": "Football coach"
                  }
                ]
                """);
        when(supabaseRestClient.post(eq("/rest/v1/opportunities"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(post("/api/opportunities")
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": " Football coach ",
                                  "created_by": "another-user"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.created_by").value("user-123"));

        verify(supabaseRestClient).post(
                eq("/rest/v1/opportunities"), any(Jwt.class),
                anyMap(),
                eq(Map.of(
                        "created_by", "user-123",
                        "title", "Football coach",
                        "description", "",
                        "opportunity_type", "other",
                        "is_remote", false,
                        "status", "open"
                )));
    }

    @Test
    void opportunityApplicationUsesAuthenticatedApplicantAndSubmittedStatus() throws Exception {
        UUID opportunityId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "application-1",
                    "opportunity_id": "44444444-4444-4444-4444-444444444444",
                    "applicant_id": "user-123",
                    "status": "submitted"
                  }
                ]
                """);
        when(supabaseRestClient.post(eq("/rest/v1/opportunity_applications"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(post("/api/opportunities/{opportunityId}/applications", opportunityId)
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "message": "I am interested",
                                  "applicant_id": "another-user",
                                  "status": "accepted"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicant_id").value("user-123"))
                .andExpect(jsonPath("$.status").value("submitted"));

        verify(supabaseRestClient).post(
                eq("/rest/v1/opportunity_applications"), any(Jwt.class),
                anyMap(),
                eq(Map.of(
                        "opportunity_id", opportunityId.toString(),
                        "applicant_id", "user-123",
                        "message", "I am interested",
                        "status", "submitted"
                )));
    }

    @Test
    void sendingMessageUsesAuthenticatedSenderId() throws Exception {
        UUID conversationId = UUID.fromString("55555555-5555-5555-5555-555555555555");
        JsonNode rows = objectMapper.readTree("""
                [
                  {
                    "id": "message-1",
                    "conversation_id": "55555555-5555-5555-5555-555555555555",
                    "sender_id": "user-123",
                    "content": "Hello"
                  }
                ]
                """);
        when(supabaseRestClient.post(eq("/rest/v1/messages"), any(Jwt.class), anyMap(), anyMap()))
                .thenReturn(rows);

        mockMvc.perform(post("/api/conversations/{conversationId}/messages", conversationId)
                        .with(jwt().jwt(jwt -> jwt.subject("user-123")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": " Hello ",
                                  "sender_id": "another-user"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sender_id").value("user-123"))
                .andExpect(jsonPath("$.content").value("Hello"));

        verify(supabaseRestClient).post(
                eq("/rest/v1/messages"), any(Jwt.class),
                eq(Map.of("select", "id,conversation_id,sender_id,content,created_at,edited_at,sender:profiles!messages_sender_id_fkey(id,username,full_name,avatar_url)")),
                eq(Map.of(
                        "conversation_id", conversationId.toString(),
                        "sender_id", "user-123",
                        "content", "Hello"
                )));
    }

}
