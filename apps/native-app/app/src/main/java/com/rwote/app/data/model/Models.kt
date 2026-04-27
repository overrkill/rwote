package com.rwote.app.data.model

data class Note(
    val id: String,
    val userId: String?,
    val title: String,
    val content: String?,
    val sourceUrl: String? = null,
    val tags: List<String> = emptyList(),
    val pinned: Boolean = false,
    val createdAt: String?,
    val updatedAt: String?
)

data class User(
    val id: String,
    val email: String?
)

data class Session(
    val accessToken: String,
    val user: User
)