// AnnonceLocationRepository.java
package com.locavia.backend.repository;

import com.locavia.backend.entity.AnnonceLocation;
import com.locavia.backend.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnonceLocationRepository extends JpaRepository<AnnonceLocation, Long> {
    @Query("SELECT DISTINCT a FROM AnnonceLocation a " +
            "LEFT JOIN FETCH a.photos " +
            "LEFT JOIN FETCH a.chambres " +
            "LEFT JOIN FETCH a.proprietaire " +
            "WHERE a.proprietaire.email = :email")
    List<AnnonceLocation> findByProprietaireEmailWithDetails(@Param("email") String email);
    // added by user
    List<AnnonceLocation> findByProprietaire(Utilisateur proprietaire);
    List<AnnonceLocation> findByProprietaireId(Long proprietaireId);
}