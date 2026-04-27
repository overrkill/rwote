package com.rwote.app.ui.theme

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.edit

private const val PREFS_NAME = "rwote_theme"
private const val KEY_DARK_MODE = "dark_mode"
private const val KEY_USE_SYSTEM = "use_system"

object ThemeManager {
    private lateinit var prefs: SharedPreferences

    var isDarkMode by mutableStateOf(false)
        private set

    var useSystemTheme by mutableStateOf(true)
        private set

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        useSystemTheme = prefs.getBoolean(KEY_USE_SYSTEM, true)
        isDarkMode = prefs.getBoolean(KEY_DARK_MODE, false)
    }

    fun setTheme(mode: ThemeMode) {
        when (mode) {
            ThemeMode.LIGHT -> {
                isDarkMode = false
                useSystemTheme = false
                prefs.edit {
                    putBoolean(KEY_DARK_MODE, false)
                    putBoolean(KEY_USE_SYSTEM, false)
                }
            }
            ThemeMode.DARK -> {
                isDarkMode = true
                useSystemTheme = false
                prefs.edit {
                    putBoolean(KEY_DARK_MODE, true)
                    putBoolean(KEY_USE_SYSTEM, false)
                }
            }
            ThemeMode.SYSTEM -> {
                useSystemTheme = true
                prefs.edit {
                    putBoolean(KEY_USE_SYSTEM, true)
                }
            }
        }
    }

    fun getDarkThemeFromSystem(systemDark: Boolean): Boolean {
        return if (useSystemTheme) systemDark else isDarkMode
    }
}

enum class ThemeMode {
    LIGHT, DARK, SYSTEM
}