package com.sportslink.sportslink_backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateConversationRequest(
        @JsonProperty("is_group") Boolean isGroup,
        @Size(max = 160) String title,
        @JsonProperty("member_ids") @NotEmpty @Size(max = 20) List<UUID> memberIds) {
}
