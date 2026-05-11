package com.locavia.backend.repository;

import com.locavia.backend.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    List<Photo> findByAnnonceIdAnnonceOrderByOrdreAsc(Long annonceId);
}
