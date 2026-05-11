package com.locavia.backend.repository;
import com.locavia.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByDemandeLocationIdDemande(Long demandeId);

    List<Conversation> findByEtudiantId(Long etudiantId);

    List<Conversation> findByProprietaireId(Long proprietaireId);}
