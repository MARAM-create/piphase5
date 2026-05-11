package com.locavia.backend.service;


import com.locavia.backend.entity.Utilisateur;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class ServiceJwt {

    @Value("${application.jwt.secret}")
    private String cleSecrete;

    @Value("${application.jwt.expiration}")
    private long expiration;

    public String genererToken(Utilisateur utilisateur) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role",   utilisateur.getRole().name());
        claims.put("id",     utilisateur.getId());
        claims.put("prenom", utilisateur.getPrenom());
        claims.put("nom",    utilisateur.getNom());

        return Jwts.builder()
                .claims(claims)
                .subject(utilisateur.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getCleSignature())
                .compact();
    }

    public boolean estValide(String token, UserDetails userDetails) {
        final String email = extraireEmail(token);
        return email.equals(userDetails.getUsername()) && !estExpire(token);
    }

    public String extraireEmail(String token) {
        return extraireClaim(token, Claims::getSubject);
    }

    public <T> T extraireClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extraireTousClaims(token));
    }

    private boolean estExpire(String token) {
        return extraireClaim(token, Claims::getExpiration).before(new Date());
    }

    private Claims extraireTousClaims(String token) {
        return Jwts.parser()
                .verifyWith(getCleSignature())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getCleSignature() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(cleSecrete));
    }
}