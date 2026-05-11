package com.locavia.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Levée quand le service IA (Gemini) est inaccessible depuis la région actuelle.
 * La vérification de conformité étant obligatoirement IA-based, le processus
 * s'arrête ici — aucun fallback algorithmique n'est autorisé.
 *
 * <p>HTTP 503 Service Unavailable.
 *
 * <p><b>Solution recommandée :</b> utiliser un proxy HTTPS (ex : Cloudflare Worker,
 * VPN avec IP US/EU) ou basculer vers un modèle accessible hors quota régional
 * (ex : {@code gemini-1.5-flash} via {@code v1beta} avec un projet Firebase).
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message) {
        super(message);
    }

    public ServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
