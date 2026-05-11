package com.locavia.backend.controller;

import com.locavia.backend.dto.AvisDTO;
import com.locavia.backend.service.AvisReclamation.AvisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/avis")
@CrossOrigin(origins = "*")
public class AvisController {

    private final AvisService avisService;

    public AvisController(AvisService avisService) {
        this.avisService = avisService;
    }

    @GetMapping
    public ResponseEntity<List<AvisDTO>> getAll() {
        return ResponseEntity.ok(avisService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AvisDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(avisService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AvisDTO> create(@Valid @RequestBody AvisDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(avisService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AvisDTO> update(@PathVariable Long id, @Valid @RequestBody AvisDTO dto) {
        return ResponseEntity.ok(avisService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        avisService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(avisService.getStats());
    }
}
