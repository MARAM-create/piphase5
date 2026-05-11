package com.locavia.backend.repository;

import com.locavia.backend.entity.Avis;
import com.locavia.backend.enums.SentimentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvisRepository extends JpaRepository<Avis, Long> {

    List<Avis> findByRating(Integer rating);

    List<Avis> findBySentiment(SentimentType sentiment);

    long countBySentiment(SentimentType sentiment);

    @Query("SELECT AVG(a.rating) FROM Avis a")
    Double getAverageRating();

    @Query("SELECT a.sentiment, COUNT(a) FROM Avis a WHERE a.sentiment IS NOT NULL GROUP BY a.sentiment")
    List<Object[]> getSentimentDistribution();
}
