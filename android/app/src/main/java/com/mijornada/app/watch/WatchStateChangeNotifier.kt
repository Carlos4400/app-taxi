package com.mijornada.app.watch

import android.content.Context
import android.content.Intent

object WatchStateChangeNotifier {
    const val ACTION_STATE_CHANGED = "com.mijornada.app.WATCH_STATE_CHANGED"

    @JvmStatic
    fun notify(context: Context) {
        context.sendBroadcast(
            Intent(ACTION_STATE_CHANGED).setPackage(context.packageName),
        )
    }
}
