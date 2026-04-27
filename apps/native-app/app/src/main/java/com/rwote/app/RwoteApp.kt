package com.rwote.app

import android.app.Application
import com.rwote.app.data.api.SupabaseApi

class RwoteApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SupabaseApi.init(this)
    }
}