package com.sportslink.sportslink_backend;

import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Service
public class SupabaseOpportunityService {

    private static final String OPPORTUNITY_COLUMNS =
            "id,created_by,title,description,opportunity_type,sport,location,is_remote,status,"
                    + "application_deadline,created_at,updated_at,"
                    + "creator:profiles!opportunities_created_by_fkey(id,username,full_name,avatar_url,role)";
    private static final String APPLICANT_COLUMNS =
            "id,opportunity_id,applicant_id,message,status,created_at,updated_at,"
                    + "opportunity:opportunities!opportunity_applications_opportunity_id_fkey("
                    + "id,title,opportunity_type,sport,location,status,application_deadline,created_by)";
    private static final String APPLICATION_COLUMNS =
            "id,opportunity_id,applicant_id,message,status,created_at,updated_at,"
                    + "applicant:profiles!opportunity_applications_applicant_id_fkey(id,username,full_name,avatar_url,role)";

    private final SupabaseRestClient supabaseRestClient;

    public SupabaseOpportunityService(SupabaseRestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    public JsonNode listOpportunities(Jwt jwt) {
        return supabaseRestClient.get(
                "/rest/v1/opportunities",
                jwt,
                Map.of("select", OPPORTUNITY_COLUMNS, "order", "created_at.desc", "limit", "100"));
    }

    public JsonNode createOpportunity(Jwt jwt, CreateOpportunityRequest request) {
        JsonNode rows = supabaseRestClient.post(
                "/rest/v1/opportunities",
                jwt,
                Map.of("select", OPPORTUNITY_COLUMNS),
                request.toInsert(jwt.getSubject()));
        return firstRowOrBadGateway(rows, "Supabase did not return the created opportunity.");
    }

    public JsonNode listMyApplications(Jwt jwt) {
        return supabaseRestClient.get(
                "/rest/v1/opportunity_applications",
                jwt,
                Map.of(
                        "applicant_id", "eq." + jwt.getSubject(),
                        "select", APPLICANT_COLUMNS,
                        "order", "created_at.desc",
                        "limit", "100"
                ));
    }

    public JsonNode listApplicationsForOpportunity(Jwt jwt, UUID opportunityId) {
        return supabaseRestClient.get(
                "/rest/v1/opportunity_applications",
                jwt,
                Map.of(
                        "opportunity_id", "eq." + opportunityId,
                        "select", APPLICATION_COLUMNS,
                        "order", "created_at.desc",
                        "limit", "100"
                ));
    }

    public JsonNode apply(Jwt jwt, UUID opportunityId, ApplyToOpportunityRequest request) {
        Map<String, Object> values = Map.of(
                "opportunity_id", opportunityId.toString(),
                "applicant_id", jwt.getSubject(),
                "message", request.message() == null ? "" : request.message().trim(),
                "status", "submitted"
        );
        JsonNode rows = supabaseRestClient.post(
                "/rest/v1/opportunity_applications",
                jwt,
                Map.of("select", APPLICANT_COLUMNS),
                values);
        return firstRowOrBadGateway(rows, "Supabase did not return the created application.");
    }

    public JsonNode reviewApplication(Jwt jwt, UUID applicationId, ReviewApplicationRequest request) {
        JsonNode rows = supabaseRestClient.patch(
                "/rest/v1/opportunity_applications",
                jwt,
                Map.of("id", "eq." + applicationId, "select", APPLICATION_COLUMNS),
                Map.of("status", request.status()));
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Application not found or you do not manage its opportunity.");
        }
        return rows.get(0);
    }

    private JsonNode firstRowOrBadGateway(JsonNode rows, String message) {
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
        }
        return rows.get(0);
    }
}
