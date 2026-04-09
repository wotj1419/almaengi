package com.almaengi.be.domain.chat.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChatRoomType {
    DM("1:1 대화"),
    GROUP("단체방"),
    BOT("알맹이 봇");

    private final String description;
}
