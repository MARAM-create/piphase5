package com.locavia.backend.repository;

import com.locavia.backend.entity.Visite3D;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface Visite3DRepository  extends JpaRepository<Visite3D, Long> {

    @Query(value = """
        SELECT *
        FROM visite_3d
        WHERE id_annonce = :annonceId
        ORDER BY date_publication DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Visite3D> findDerniereByAnnonceId(@Param("annonceId") Long annonceId);

    @Query(value = """
            SELECT *
            FROM visite_3d
            WHERE id_demande = :demandeId
            ORDER BY date_publication DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<Visite3D> findDerniereByDemandeId(@Param("demandeId") Long demandeId);
}
