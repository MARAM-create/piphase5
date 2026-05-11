package com.locavia.backend.controller;

import com.locavia.backend.dto.SignalMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    // Relayer tous les messages WebRTC au destinataire
    @MessageMapping("/signal")
    public void relayerSignal(
            @Payload SignalMessage message,
            Principal principal) {

        if (principal != null) {
            message.setFrom(principal.getName());
        }

        // Envoyer au destinataire via sa queue personnelle
        messagingTemplate.convertAndSendToUser(
                message.getTo(),
                "/queue/signal",
                message
        );
    }
}