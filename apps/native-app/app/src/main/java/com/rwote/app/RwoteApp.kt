package com.rwote.app

import android.app.Application
import com.rwote.app.data.api.SupabaseApi
import com.rwote.app.data.local.NotesCache
import com.rwote.app.ui.theme.ThemeManager

class RwoteApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ThemeManager.init(this)
        SupabaseApi.init(this)
        NotesCache.init(this)
    }
}