package com.locavia.backend.service;


import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class ServiceTwilio {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String twilioPhone;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    public String genererOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    public void envoyerOtpSms(String telephone, String otp) {
        try {
            Message.creator(
                    new PhoneNumber(telephone),
                    new PhoneNumber(twilioPhone),
                    "🏠 Locavia — Votre code de vérification : " + otp +
                            "\nCe code expire dans 10 minutes. Ne le partagez pas."
            ).create();
        } catch (Exception e) {
            throw new RuntimeException("Échec envoi SMS: " + e.getMessage());
        }
    }
}