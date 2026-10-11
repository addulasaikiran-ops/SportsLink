package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class OpportunityApplicationController {

    private final SupabaseOpportunityService opportunityService;

    public OpportunityApplicationController(SupabaseOpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping("/applications/me")
    public JsonNode listMyApplications(@AuthenticationPrincipal Jwt jwt) {
        return opportunityService.listMyApplications(jwt);
    }

    @GetMapping("/opportunities/{opportunityId}/applications")
    public JsonNode listApplicationsForOpportunity(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID opportunityId) {
        return opportunityService.listApplicationsForOpportunity(jwt, opportunityId);
    }

    @PostMapping("/opportunities/{opportunityId}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public JsonNode apply(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID opportunityId,
            @Valid @RequestBody ApplyToOpportunityRequest request) {
        return opportunityService.apply(jwt, opportunityId, request);
    }

    @PatchMapping("/applications/{applicationId}/status")
    public JsonNode review(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID applicationId,
            @Valid @RequestBody ReviewApplicationRequest request) {
        return opportunityService.reviewApplication(jwt, applicationId, request);
    }
}
