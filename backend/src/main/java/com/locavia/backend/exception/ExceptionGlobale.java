package com.locavia.backend.exception;

import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestControllerAdvice
public class ExceptionGlobale {

    @ExceptionHandler(ExceptionMetier.class)
    public ResponseEntity<Map<String, String>> gererExceptionMetier(ExceptionMetier ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erreur", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> gererValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(e -> {
            String champ = ((FieldError) e).getField();
            erreurs.put(champ, e.getDefaultMessage());
        });
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erreurs", erreurs));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> gererException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erreur", "Erreur interne du serveur"));
    }
}

