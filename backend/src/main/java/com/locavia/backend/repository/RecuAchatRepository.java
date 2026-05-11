package com.locavia.backend.repository;

import com.locavia.backend.entity.RecuAchat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecuAchatRepository extends JpaRepository<RecuAchat, Long> {
    Optional<RecuAchat> findByNumeroRecu(String numeroRecu); // ← doit exister
}