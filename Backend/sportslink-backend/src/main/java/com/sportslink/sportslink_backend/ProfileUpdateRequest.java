package com.sportslink.sportslink_backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

import java.util.LinkedHashMap;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfileUpdateRequest(
        @JsonProperty("full_name") @Size(max = 120) String fullName,
        @JsonProperty("headline") @Size(max = 180) String headline,
        @JsonProperty("bio") @Size(max = 5000) String bio,
        @JsonProperty("location") @Size(max = 160) String location,
        @JsonProperty("sport") @Size(max = 100) String sport) {

    public Map<String, Object> toUpdates() {
        Map<String, Object> updates = new LinkedHashMap<>();
        if (fullName != null) updates.put("full_name", fullName);
        if (headline != null) updates.put("headline", headline);
        if (bio != null) updates.put("bio", bio);
        if (location != null) updates.put("location", location);
        if (sport != null) updates.put("sport", sport);
        return updates;
    }
}
