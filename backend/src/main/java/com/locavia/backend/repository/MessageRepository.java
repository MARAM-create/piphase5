
package com.locavia.backend.repository;

import com.locavia.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends  JpaRepository<Message, Long>{

    List<Message> findByConversationIdOrderByDateEnvoiAsc(Long conversationId);

    Message findTopByConversationIdOrderByDateEnvoiDesc(Long conversationId);

    List<Message> findByConversationIdAndEstLuFalse(Long conversationId);

    List<Message> findByDestinataireIdAndEstLuFalse(Long destinataireId);

    long countByDestinataireIdAndEstLuFalse(Long destinataireId);

    long countByConversationIdAndDestinataireIdAndEstLuFalse(Long conversationId, Long destinataireId);
}
