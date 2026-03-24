package com.almaengi.be.domain.chat.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChatMemberRole {
    OWNER("방장"),
    MEMBER("참가자");

    private final String description;
}
