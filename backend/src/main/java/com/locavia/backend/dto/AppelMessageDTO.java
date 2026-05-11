package com.locavia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppelMessageDTO {

    private String type;

    private Long conversationId;

    private Long appelantId;
    private String appelantNom;
    private String appelantPrenom;

    private Long destinataireId;
    private String destinataireNom;
    private String destinatairePrenom;

    private String roomName;

    private String message;
}
