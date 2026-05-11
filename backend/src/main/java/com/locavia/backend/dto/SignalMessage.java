package com.locavia.backend.dto;

import lombok.Data;

@Data
public class SignalMessage {
    private String type;      // offer, answer, candidate, call-request, call-accepted, call-rejected, call-ended
    private String from;      // email expéditeur
    private String to;        // email destinataire
    private String fromNom;   // prénom nom expéditeur
    private Object data;      // SDP offer/answer ou ICE candidate
}