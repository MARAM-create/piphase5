package com.locavia.backend.repository;

import com.locavia.backend.entity.Meuble;
import com.locavia.backend.enums.StatutMeuble;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;


@Repository
public interface MeubleRepository extends JpaRepository<Meuble, Long> {

    List<Meuble> findByStatutOrderByCreeLeDesc(StatutMeuble statut);
    List<Meuble> findByVendeurIdOrderByCreeLeDesc(Long vendeurId);
    @Query("SELECT m FROM Meuble m WHERE m.titre = :titre AND m.acheteur.id = :acheteurId")
    Optional<Meuble> findByTitreAndAcheteurId(
            @Param("titre") String titre,
            @Param("acheteurId") Long acheteurId);
    @Query("SELECT m FROM Meuble m WHERE m.acheteur.id = :id ORDER BY m.misAJourLe DESC")
    List<Meuble> findByAcheteurIdOrderByMisAJourLeDesc(@Param("id") Long id);

}

