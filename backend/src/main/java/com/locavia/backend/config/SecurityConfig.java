package com.locavia.backend.config;

import com.locavia.backend.security.FiltreJwt;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final FiltreJwt              filtreJwt;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(sourceCors()))
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── OPTIONS preflight (MUST BE FIRST) ────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── Public ───────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers("/api/chat").permitAll()
                        .requestMatchers("/photos/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/verification/**").permitAll()
                        .requestMatchers("/api/paiements/success/**",
                                "/api/paiements/cancel/**").permitAll()
                        .requestMatchers("/api/paiements/**",
                                "/api/contrats/**").permitAll()

                        // ── WebSocket ────────────────────────────────
                        .requestMatchers("/ws").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/ws-locavia").permitAll()
                        .requestMatchers("/ws-locavia/**").permitAll()
                        .requestMatchers("/ws-locavia-sockjs").permitAll()
                        .requestMatchers("/ws-locavia-sockjs/**").permitAll()
                        .requestMatchers("/ws-locavia/info").permitAll()
                        .requestMatchers("/ws-locavia/info/**").permitAll()
                        .requestMatchers("/ws-locavia///websocket").permitAll()
                        .requestMatchers("/ws-locavia///xhr").permitAll()
                        .requestMatchers("/ws-locavia///xhr_send").permitAll()
                        .requestMatchers("/ws-locavia///xhr_streaming").permitAll()

                        // ── Meubles lecture publique ─────────────────
                        .requestMatchers(HttpMethod.GET, "/api/meubles").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/meubles/**").permitAll()

                        // ── Annonces ─────────────────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/annonces").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/annonces/**").authenticated()

                        // ── Admin ────────────────────────────────────
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ── Rôles spécifiques ────────────────────────
                        .requestMatchers("/api/etudiant/**").hasRole("ETUDIANT")
                        .requestMatchers("/api/proprietaire/**").hasRole("PROPRIETAIRE")
                        .requestMatchers("/api/prestataire/**").hasRole("PRESTATAIRE")
                        .requestMatchers("/api/profil/etudiant/**").hasRole("ETUDIANT")
                        .requestMatchers("/api/profil/proprietaire/**").hasRole("PROPRIETAIRE")
                        .requestMatchers("/api/profil/prestataire/**").hasRole("PRESTATAIRE")

                        // ── Annonces modification ────────────────────
                        .requestMatchers("/api/annonces/mes-annonces").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/annonces").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/annonces").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/annonces/**").authenticated()

                        // ── Services ─────────────────────────────────
                        .requestMatchers("/api/services/**").authenticated()

                        // ── Tout le reste ────────────────────────────
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(filtreJwt, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource sourceCors() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:4200",
                "http://localhost:4201",
                "http://192.168.1.175:30080",
                "http://192.168.1.175:30808",
                "http://192.168.1.175.nip.io:30080",
                "http://192.168.1.175.nip.io:30808",
                "http://192.168.1.129:30080",
                "http://192.168.1.129:30808",
                "https://elongated-frosted-tribute.ngrok-free.dev",
                "https://gumming-bobbed-negligee.ngrok-free.dev"
        ));
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}