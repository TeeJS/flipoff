package com.flipoff.tv

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private var webView: WebView? = null
    private var selectPressedAt: Long = 0

    private val prefs by lazy {
        getSharedPreferences("flipoff_prefs", MODE_PRIVATE)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        var serverUrl = prefs.getString("server_url", null)
        if (serverUrl.isNullOrBlank()) {
            startActivity(Intent(this, SettingsActivity::class.java))
            finish()
            return
        }

        // Default to /main board if pointing at the root
        if (serverUrl.trimEnd('/').matches(Regex("^https?://[^/]+(:\\d+)?$"))) {
            serverUrl = serverUrl.trimEnd('/') + "/main"
        }

        // Append ?tv=1 to auto-enter fullscreen board mode
        val separator = if (serverUrl.contains('?')) "&" else "?"
        serverUrl = "$serverUrl${separator}tv=1"

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

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
        enterImmersiveMode()
        webView?.loadUrl(serverUrl)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Long-press Select/OK (2 seconds) opens settings
        if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER || keyCode == KeyEvent.KEYCODE_ENTER) {
            if (event?.repeatCount == 0) {
                selectPressedAt = System.currentTimeMillis()
            } else if (System.currentTimeMillis() - selectPressedAt >= 2000) {
                selectPressedAt = Long.MAX_VALUE // prevent re-triggering
                startActivity(Intent(this, SettingsActivity::class.java))
                return true
            }
        }
        if (keyCode == KeyEvent.KEYCODE_BACK && webView?.canGoBack() == true) {
            webView?.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        enterImmersiveMode()
        // Reload in case URL was changed in settings
        val savedUrl = prefs.getString("server_url", null)
        if (!savedUrl.isNullOrBlank()) {
            var url = savedUrl
            if (url.trimEnd('/').matches(Regex("^https?://[^/]+(:\\d+)?$"))) {
                url = url.trimEnd('/') + "/main"
            }
            val sep = if (url.contains('?')) "&" else "?"
            webView?.loadUrl("$url${sep}tv=1")
        }
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }

    @Suppress("DEPRECATION")
    private fun enterImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }
}
