package com.locavia.backend.dto;


import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class EnvoyerVisite3DRequest {
    private Long annonceId;
    private List<Destinataire3D> destinataires;

    @Getter
    @Setter
    public static class Destinataire3D {
        private Long demandeId;
        private Long etudiantId;
    }
}
