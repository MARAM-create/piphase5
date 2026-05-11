// ChambreController.java
package com.locavia.backend.controller;

import com.locavia.backend.dto.ChambreDTO;
import com.locavia.backend.service.IChambreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/chambres")
public class ChambreController {

    @Autowired
    private IChambreService chambreService;

    @GetMapping
    public ResponseEntity<List<ChambreDTO>> getAll() {
        return ResponseEntity.ok(chambreService.retrieveAllChambres());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChambreDTO> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(chambreService.retrieveChambre(id));
    }

    @PostMapping
    public ResponseEntity<ChambreDTO> create(@RequestBody ChambreDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chambreService.addChambre(dto));
    }

    @PutMapping
    public ResponseEntity<ChambreDTO> update(@RequestBody ChambreDTO dto) {
        return ResponseEntity.ok(chambreService.modifyChambre(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        chambreService.removeChambre(id);
        return ResponseEntity.noContent().build();
    }
}