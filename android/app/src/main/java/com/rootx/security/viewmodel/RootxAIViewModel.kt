package com.rootx.security.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.rootx.security.data.api.RootXApiService
import com.rootx.security.data.model.AIChatRequest
import com.rootx.security.data.model.ChatMessage
import com.rootx.security.data.sync.ScanCloudSyncManager
import com.rootx.security.service.DeviceContextService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RootxAIViewModel @Inject constructor(
    private val app: Application,
    private val syncManager: ScanCloudSyncManager,
    private val api: RootXApiService,
    private val deviceContextService: DeviceContextService,
) : AndroidViewModel(app) {

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()

    private val _isStreaming = MutableStateFlow(false)
    val isStreaming: StateFlow<Boolean> = _isStreaming.asStateFlow()

    fun setInputText(text: String) {
        _inputText.value = text
    }

    fun sendPrompt(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _isStreaming.value) return
        _inputText.value = ""
        dispatchQuery(trimmed)
    }

    fun sendMessage() {
        val text = _inputText.value.trim()
        if (text.isEmpty() || _isStreaming.value) return
        _inputText.value = ""
        dispatchQuery(text)
    }

    fun regenerateLastResponse() {
        if (_isStreaming.value) return
        val current = _messages.value
        val lastUserMsg = current.lastOrNull { it.role == "user" } ?: return

        // Remove the trailing assistant message if present
        if (current.isNotEmpty() && current.last().role == "assistant") {
            _messages.value = current.dropLast(1)
        }
        dispatchQuery(lastUserMsg.content, isRegen = true)
    }

    fun setFeedback(index: Int, rating: Int) {
        val list = _messages.value.toMutableList()
        if (index in list.indices) {
            list[index] = list[index].copy(feedback = rating)
            _messages.value = list
        }
    }

    private fun dispatchQuery(query: String, isRegen: Boolean = false) {
        if (!isRegen) {
            val userMsg = ChatMessage(role = "user", content = query)
            _messages.value = _messages.value + userMsg
        }

        viewModelScope.launch {
            _isStreaming.value = true

            // Placeholder assistant bubble with typing indicator
            val assistantMsg = ChatMessage(role = "assistant", content = "Analyzing device telemetry...")
            _messages.value = _messages.value + assistantMsg
            val msgIndex = _messages.value.lastIndex

            val latestScan = syncManager.syncedScans.value.firstOrNull()
            val deviceContext = deviceContextService.buildContextForQuery(query, latestScan)

            // Try backend Gemini AI endpoint first with structured Android telemetry
            var responseText = ""
            try {
                val apiRes = api.queryAi(
                    AIChatRequest(
                        message = query,
                        deviceContext = deviceContext,
                        history = _messages.value.dropLast(1).takeLast(6)
                    )
                )
                if (apiRes.response.isNotBlank()) {
                    responseText = apiRes.response
                }
            } catch (e: Exception) {
                // Fallback to local grounded intelligence engine
                android.util.Log.w("RootX-AI", "Remote AI call failed, using local telemetry engine: ${e.message}")
            }

            if (responseText.isBlank()) {
                responseText = deviceContextService.generateGroundedResponse(query, latestScan)
            }

            // Stream response with realistic typewriter effect
            val words = responseText.split(" ")
            val currentContent = StringBuilder()

            for (i in words.indices) {
                currentContent.append(words[i]).append(" ")
                val updated = _messages.value.toMutableList()
                if (msgIndex in updated.indices) {
                    updated[msgIndex] = updated[msgIndex].copy(content = currentContent.toString().trimEnd())
                    _messages.value = updated
                }
                delay(8)
            }

            // Ensure complete text without truncation
            val finalUpdated = _messages.value.toMutableList()
            if (msgIndex in finalUpdated.indices) {
                finalUpdated[msgIndex] = finalUpdated[msgIndex].copy(content = responseText.trim())
                _messages.value = finalUpdated
            }

            _isStreaming.value = false
        }
    }

    fun clearChat() {
        _messages.value = emptyList()
    }
}
