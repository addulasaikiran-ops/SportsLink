package com.sportslink.sportslink_backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateOpportunityRequest(
        @NotBlank @Size(max = 250) String title,
        @Size(max = 10000) String description,
        @JsonProperty("opportunity_type")
        @Pattern(regexp = "job|trial|scholarship|team|sponsorship|volunteer|other") String opportunityType,
        @Size(max = 100) String sport,
        @Size(max = 160) String location,
        @JsonProperty("is_remote") Boolean isRemote,
        @Pattern(regexp = "open|draft") String status,
        @JsonProperty("application_deadline") OffsetDateTime applicationDeadline) {

    public Map<String, Object> toInsert(String createdBy) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("created_by", createdBy);
        values.put("title", title.trim());
        values.put("description", description == null ? "" : description.trim());
        values.put("opportunity_type", opportunityType == null ? "other" : opportunityType);
        values.put("is_remote", Boolean.TRUE.equals(isRemote));
        values.put("status", status == null ? "open" : status);
        if (sport != null && !sport.isBlank()) values.put("sport", sport.trim());
        if (location != null && !location.isBlank()) values.put("location", location.trim());
        if (applicationDeadline != null) values.put("application_deadline", applicationDeadline);
        return values;
    }
}
