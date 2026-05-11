package com.locavia.backend.config;

import com.locavia.backend.service.ServiceJwt;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final ServiceJwt serviceJwt;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        // Canaux utilisés pour envoyer les messages vers les clients
        registry.enableSimpleBroker("/topic", "/queue");

        // Préfixe utilisé par Angular pour envoyer vers le backend
        registry.setApplicationDestinationPrefixes("/app");

        // Préfixe utile pour les messages privés : /user/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        /*
         * Ancien endpoint utilisé dans une version du projet.
         * On le garde pour éviter de casser les services frontend déjà branchés dessus.
         */
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        /*
         * Endpoint direct utilisé par Angular.
         * Celui-ci est utile si le frontend se connecte sans SockJS.
         */
        registry.addEndpoint("/ws-locavia")
                .setAllowedOriginPatterns("*");

        /*
         * Endpoint SockJS utilisé par Angular si besoin.
         * On le garde aussi pour compatibilité.
         */
        registry.addEndpoint("/ws-locavia-sockjs")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {

        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {

                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {

                        String token = authHeader.substring(7);

                        try {
                            String email = serviceJwt.extraireEmail(token);

                            if (email != null) {
                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(
                                                email,
                                                null,
                                                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                                        );

                                accessor.setUser(authentication);

                                System.out.println("✅ WebSocket authentifié : " + email);
                            }

                        } catch (Exception e) {
                            System.err.println("❌ Token WebSocket invalide : " + e.getMessage());
                        }

                    } else {
                        System.err.println("⚠️ Connexion WebSocket sans token");
                    }
                }

                return message;
            }
        });
    }
}