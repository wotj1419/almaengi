package com.almaengi.be.domain.chat.client;

import java.util.List;

public interface RagClient {
    String ask(Long storeId, Long roomId, Long userId, Long messageId, String question, List<String> history);
}
