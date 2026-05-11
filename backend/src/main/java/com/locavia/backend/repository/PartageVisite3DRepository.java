package com.locavia.backend.repository;


import com.locavia.backend.entity.PartageVisite3D;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


public interface PartageVisite3DRepository extends JpaRepository<PartageVisite3D, Long> {

    @Query(value = """
            SELECT *
            FROM partage_visite_3d
            WHERE id_visite3d = :visite3dId
            AND id_demande = :demandeId
            LIMIT 1
            """, nativeQuery = true)
    Optional<PartageVisite3D> findByVisiteAndDemande(
            @Param("visite3dId") Long visite3dId,
            @Param("demandeId") Long demandeId
    );

    @Query(value = """
            SELECT id_demande
            FROM partage_visite_3d
            WHERE etudiant_id = :etudiantId
            AND statut = 'ENVOYEE'
            """, nativeQuery = true)
    List<Long> findDemandesPartageesByEtudiant(@Param("etudiantId") Long etudiantId);

    @Query(value = """
            SELECT *
            FROM partage_visite_3d
            WHERE id_demande = :demandeId
            AND statut = 'ENVOYEE'
            ORDER BY date_envoi DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<PartageVisite3D> findDernierPartageByDemande(@Param("demandeId") Long demandeId);
}
