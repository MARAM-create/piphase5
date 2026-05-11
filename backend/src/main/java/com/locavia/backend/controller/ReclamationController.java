package com.locavia.backend.controller;

import com.locavia.backend.dto.ReclamationDTO;
import com.locavia.backend.service.AvisReclamation.ReclamationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reclamations")
@CrossOrigin(origins = "*")
public class ReclamationController {

    private final ReclamationService reclamationService;

    public ReclamationController(ReclamationService reclamationService) {
        this.reclamationService = reclamationService;
    }

    @GetMapping
    public ResponseEntity<List<ReclamationDTO>> getAll() {
        return ResponseEntity.ok(reclamationService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReclamationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reclamationService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ReclamationDTO> create(@Valid @RequestBody ReclamationDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reclamationService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReclamationDTO> update(@PathVariable Long id, @Valid @RequestBody ReclamationDTO dto) {
        return ResponseEntity.ok(reclamationService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reclamationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(reclamationService.getStats());
    }
}
