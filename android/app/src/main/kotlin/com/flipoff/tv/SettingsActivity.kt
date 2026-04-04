package com.flipoff.tv

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {

    private val prefs by lazy {
        getSharedPreferences("flipoff_prefs", MODE_PRIVATE)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val editUrl = findViewById<EditText>(R.id.editServerUrl)
        val btnSave = findViewById<Button>(R.id.btnSave)
        val txtError = findViewById<TextView>(R.id.txtError)

        prefs.getString("server_url", null)?.let { editUrl.setText(it) }

        btnSave.setOnClickListener {
            val url = editUrl.text.toString().trim()
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                txtError.text = getString(R.string.error_invalid_url)
                txtError.visibility = View.VISIBLE
                return@setOnClickListener
            }

            prefs.edit().putString("server_url", url).apply()

            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }
}
