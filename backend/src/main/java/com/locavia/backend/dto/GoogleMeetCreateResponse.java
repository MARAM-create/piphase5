package com.locavia.backend.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class GoogleMeetCreateResponse {
    private String name;
    private String meetingCode;
    private String meetingUri;
}
