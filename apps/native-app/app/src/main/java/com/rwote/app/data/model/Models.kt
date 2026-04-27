package com.rwote.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Note(
    val id: String,
    val userId: String? = null,
    val title: String,
    val content: String? = null,
    val sourceUrl: String? = null,
    val tags: List<String> = emptyList(),
    val pinned: Boolean = false,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class User(
    val id: String,
    val email: String? = null
)

@Serializable
data class Session(
    val accessToken: String,
    val user: User
)