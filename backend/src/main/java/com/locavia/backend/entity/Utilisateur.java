package com.locavia.backend.entity;

import com.locavia.backend.enums.Role;
import com.locavia.backend.enums.Statut;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "utilisateurs")
@Getter        // ← remplace @Data
@Setter        // ← remplace @Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "mot_de_passe", length = 255)
    private String motDePasse;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE_EMAIL;

    @Column(name = "email_verifie")
    @Builder.Default
    private Boolean emailVerifie = false;

    @Column(name = "token_verification_email", length = 255)
    private String tokenVerificationEmail;

    @Column(name = "expiration_token_email")
    private LocalDateTime expirationTokenEmail;

    @Column(name = "token_reinit_mdp", length = 255)
    private String tokenReinitMdp;

    @Column(name = "expiration_token_mdp")
    private LocalDateTime expirationTokenMdp;

    @Column(name = "google_id", length = 255)
    private String googleId;

    @Column(name = "photo_profil", length = 500)
    private String photoProfil;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "age")
    private Integer age;

    @Column(name = "tentatives_connexion")
    @Builder.Default
    private Integer tentativesConnexion = 0;

    @Column(name = "bloque_jusqu_a")
    private LocalDateTime bloqueJusquA;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expiration")
    private LocalDateTime otpExpiration;

    @Column(name = "dernier_ip", length = 45)
    private String dernierIp;

    @Column(name = "dernier_user_agent", length = 500)
    private String dernierUserAgent;

    @Column(name = "cree_le", updatable = false)
    private LocalDateTime creeLe;

    @Column(name = "mis_a_jour_le")
    private LocalDateTime misAJourLe;


    // ── Relations ─────────────────────────────────────────
    @OneToMany(mappedBy = "proprietaire", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private List<AnnonceLocation> annonces = new ArrayList<>();

    @OneToMany(mappedBy = "vendeur", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private List<Meuble> meublesPublies = new ArrayList<>();

    @OneToMany(mappedBy = "acheteur", fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private List<Meuble> meublesAchetes = new ArrayList<>();

    @PrePersist
    protected void avantCreation() {
        this.creeLe     = LocalDateTime.now();
        this.misAJourLe = LocalDateTime.now();
    }

    @PreUpdate
    protected void avantMiseAJour() {
        this.misAJourLe = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String  getPassword()             { return motDePasse; }
    @Override public String  getUsername()             { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return statut != Statut.BANNI; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return statut == Statut.ACTIF; }
}