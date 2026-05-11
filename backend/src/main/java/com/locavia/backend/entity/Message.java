package com.locavia.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi;

    @Column(name = "est_lu", nullable = false)
    private Boolean estLu = false;

    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Utilisateur expediteur;

    @ManyToOne
    @JoinColumn(name = "destinataire_id")
    private Utilisateur destinataire;

    @Column(name = "piece_jointe_url")
    private String pieceJointeUrl;

    @Column(name = "piece_jointe_nom")
    private String pieceJointeNom;

    @Column(name = "piece_jointe_type")
    private String pieceJointeType;

    private String typeMessage = "NORMAL";

    private Boolean supprime = false;

    private Boolean modifie = false;

    private LocalDateTime dateModification;

    private String reactionEmoji;


}
