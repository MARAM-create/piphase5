package com.locavia.backend.security;

import com.locavia.backend.service.ServiceJwt;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class FiltreJwt extends OncePerRequestFilter {

    private final ServiceJwt          serviceJwt;
    private final UserDetailsService  userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/photos/");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  requete,
            @NonNull HttpServletResponse reponse,
            @NonNull FilterChain         chaine
    ) throws ServletException, IOException {

        final String enteteAuth = requete.getHeader("Authorization");

        if (enteteAuth == null || !enteteAuth.startsWith("Bearer ")) {
            chaine.doFilter(requete, reponse);
            return;
        }

        final String token = enteteAuth.substring(7);
        final String email;

        try {
            email = serviceJwt.extraireEmail(token);
        } catch (Exception e) {
            chaine.doFilter(requete, reponse);
            return;
        }

        if (email != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails utilisateur = userDetailsService.loadUserByUsername(email);

            if (serviceJwt.estValide(token, utilisateur)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                utilisateur, null, utilisateur.getAuthorities());
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(requete));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        chaine.doFilter(requete, reponse);
    }
}