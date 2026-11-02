package com.rootx.security.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rootx.security.data.api.RootXApiService
import com.rootx.security.data.model.NewsItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NewsViewModel @Inject constructor(
    private val api: RootXApiService,
) : ViewModel() {

    private val _news = MutableStateFlow<List<NewsItem>>(emptyList())
    val news: StateFlow<List<NewsItem>> = _news.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _activeCategory = MutableStateFlow("all")
    val activeCategory: StateFlow<String> = _activeCategory.asStateFlow()

    private val _selectedNews = MutableStateFlow<NewsItem?>(null)
    val selectedNews: StateFlow<NewsItem?> = _selectedNews.asStateFlow()

    private val _isLive = MutableStateFlow(false)
    val isLive: StateFlow<Boolean> = _isLive.asStateFlow()

    val categories: StateFlow<List<String>> = _news.map { items ->
        listOf("all") + items.map { it.category }.distinct()
    }.stateIn(viewModelScope, SharingStarted.Lazily, listOf("all"))

    val filteredNews: StateFlow<List<NewsItem>> = combine(
        _news, _activeCategory
    ) { items, cat ->
        if (cat == "all") items else items.filter { it.category == cat }
    }.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    init { fetchNews() }

    fun fetchNews(forceRefresh: Boolean = false) {
        viewModelScope.launch {
            if (forceRefresh) _isRefreshing.value = true else _isLoading.value = true
            try {
                val response = if (forceRefresh) api.refreshNews() else api.getNewsFeed()
                if (response.items.isNotEmpty()) {
                    _news.value = response.items
                    _isLive.value = true
                } else {
                    _news.value = fallbackNews
                }
            } catch (_: Exception) {
                if (_news.value.isEmpty()) _news.value = fallbackNews
            }
            _isLoading.value = false
            _isRefreshing.value = false
        }
    }

    fun setCategory(cat: String) { _activeCategory.value = cat }
    fun selectNews(item: NewsItem?) { _selectedNews.value = item }
    fun refresh() { fetchNews(forceRefresh = true) }

    companion object {
        private val fallbackNews = listOf(
            NewsItem("fb-1", "Critical Zero-Day Vulnerability Found in Chrome V8 Engine",
                "Google has patched a high-severity use-after-free vulnerability in Chrome's V8 JavaScript engine.",
                "Google released an emergency security update for Chrome to fix a critical zero-day vulnerability.",
                "Today", "Google Security Blog", null, "critical", "Zero-Day"),
            NewsItem("fb-2", "Android Banking Trojan \"Anatsa\" Spreads via Play Store",
                "Security researchers discovered over 90 malicious apps on Google Play Store.",
                "A sophisticated Android banking trojan called Anatsa has been found in seemingly legitimate apps.",
                "Yesterday", "Zscaler ThreatLabZ", null, "high", "Malware"),
            NewsItem("fb-3", "New Phishing Kit \"Tycoon 2FA\" Bypasses Multi-Factor Authentication",
                "An advanced phishing-as-a-service platform enables attackers to bypass MFA.",
                "Security researchers have identified a sophisticated phishing kit called Tycoon 2FA.",
                "2 days ago", "Sekoia", null, "high", "Phishing"),
        )
    }
}
