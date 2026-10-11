package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final SupabaseOpportunityService opportunityService;

    public OpportunityController(SupabaseOpportunityService opportunityService) {
        this.opportunityService = opportunityService;
    }

    @GetMapping
    public JsonNode list(@AuthenticationPrincipal Jwt jwt) {
        return opportunityService.listOpportunities(jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JsonNode create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateOpportunityRequest request) {
        return opportunityService.createOpportunity(jwt, request);
    }
}
