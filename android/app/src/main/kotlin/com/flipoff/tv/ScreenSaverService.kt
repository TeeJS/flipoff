package com.flipoff.tv

import android.service.dreams.DreamService
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class ScreenSaverService : DreamService() {

    private var webView: WebView? = null

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        isInteractive = false
        isFullscreen = true

        val prefs = getSharedPreferences("flipoff_prefs", MODE_PRIVATE)
        var serverUrl = prefs.getString("server_url", null) ?: return

        if (serverUrl.trimEnd('/').matches(Regex("^https?://[^/]+(:\\d+)?$"))) {
            serverUrl = serverUrl.trimEnd('/') + "/main"
        }

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()
        }

        setContentView(webView)
        webView?.loadUrl(serverUrl)
    }

    override fun onDetachedFromWindow() {
        webView?.destroy()
        webView = null
        super.onDetachedFromWindow()
    }
}
