package com.locavia.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {

    private Long id;
    private String contenu;
    private LocalDateTime dateEnvoi;
    private Boolean estLu;

    private Long expediteurId;
    private String expediteurNom;
    private String expediteurPrenom;

    private Long destinataireId;
    private String destinataireNom;
    private String destinatairePrenom;

    private String typeMessage;

    private String pieceJointeUrl;
    private String pieceJointeNom;
    private String pieceJointeType;

    private Boolean supprime;
    private Boolean modifie;
    private LocalDateTime dateModification;
    private String reactionEmoji;
}
