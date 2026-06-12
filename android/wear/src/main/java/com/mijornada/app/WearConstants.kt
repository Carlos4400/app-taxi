package com.mijornada.app

object WearConstants {
    const val HANDLED_OPERATION_LIMIT = 128

    object Response {
        const val PREFS = "mobile_response_prefs"
        const val LAST_RESPONSE = "last_response"
        const val RESPONSE_TIMESTAMP = "response_timestamp"
    }

    /**
     * Única fuente de verdad sobre si una respuesta del móvil es terminal
     * (zanja el comando: sale del outbox, se suelta el WakeLock) o provisional
     * (la app aún no está lista: se reintenta). La usan MobileResponseService
     * y WearMainActivity; no debe duplicarse.
     */
    fun isTerminalResponse(responseType: String, code: String): Boolean {
        if (responseType == "OK" || responseType == "DUPLICATE_IGNORED") return true
        return responseType == "ERROR" && code != "USER_NOT_PREPARED" && code != "APP_NOT_READY"
    }
}
