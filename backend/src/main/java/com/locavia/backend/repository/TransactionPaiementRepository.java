package com.locavia.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.locavia.backend.entity.TransactionPaiement;
import com.locavia.backend.enums.StatutPaiement;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionPaiementRepository extends JpaRepository<TransactionPaiement, Long> {

    List<TransactionPaiement> findByContratId(Long contratId);

    List<TransactionPaiement> findByClientId(Long clientId);

    List<TransactionPaiement> findByStatutPaiement(StatutPaiement statutPaiement);

    Optional<TransactionPaiement> findByStripeSessionId(String stripeSessionId);

    // ✅ Somme des montants payés pour un contrat donné
    @Query("SELECT COALESCE(SUM(t.montantTotal), 0) FROM TransactionPaiement t WHERE t.contrat.id = :contratId AND t.statutPaiement = :statut")
    BigDecimal sumMontantByContratIdAndStatut(@Param("contratId") Long contratId, @Param("statut") StatutPaiement statut);

    // ✅ Transactions pour un contrat filtrées par statuts
    List<TransactionPaiement> findByContrat_IdAndStatutPaiementIn(Long contratId, List<StatutPaiement> statuts);
}

