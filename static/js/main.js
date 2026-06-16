// BQ Pulse - Application Frontend JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let releases = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let sortOrder = 'newest';
    let currentSelectedRelease = null;

    // Theme Config (check localstorage or default to dark)
    let currentTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeToggleIcons();

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const categoryChipsContainer = document.getElementById('category-chips');
    const releasesGrid = document.getElementById('releases-grid');
    const skeletonLoader = document.getElementById('skeleton-loader');
    const emptyState = document.getElementById('empty-state');
    const connectionStatusText = document.getElementById('connection-status');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeSunIcon = document.getElementById('theme-sun-icon');
    const themeMoonIcon = document.getElementById('theme-moon-icon');
    
    // Modal DOM Elements
    const tweetModal = document.getElementById('tweet-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const tweetCancelBtn = document.getElementById('tweet-cancel-btn');
    const tweetSubmitBtn = document.getElementById('tweet-submit-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const previewText = document.getElementById('preview-text');
    const charCount = document.getElementById('char-count');
    const tagChips = document.querySelectorAll('.tag-chip');
    const previewLinkContainer = document.getElementById('preview-link-container');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // --- Core Functions ---

    // Toast Notification helper
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    // Theme Toggle update icons
    function updateThemeToggleIcons() {
        if (currentTheme === 'light') {
            themeSunIcon.classList.add('hidden');
            themeMoonIcon.classList.remove('hidden');
        } else {
            themeSunIcon.classList.remove('hidden');
            themeMoonIcon.classList.add('hidden');
        }
    }

    // Fetch Release Notes from API
    async function fetchReleases(force = false) {
        toggleLoadingState(true);
        
        try {
            const url = `/api/releases${force ? '?force=true' : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            
            const data = await response.json();
            releases = data.releases || [];
            
            // Update last updated status
            updateLastUpdatedTime(data.last_updated);
            
            // Set network indicator state
            connectionStatusText.textContent = data.source === 'cache' ? 'Connected (Cache)' : 'Connected (Live)';
            
            if (force) {
                showToast("Release notes refreshed successfully!");
            }
        } catch (error) {
            console.error("Failed to fetch release notes:", error);
            showToast("Failed to fetch updates. Displaying cached/mock fallback.");
            connectionStatusText.textContent = "Offline / Connection Error";
        } finally {
            toggleLoadingState(false);
            filterAndRenderReleases();
        }
    }

    // Toggle loader skeletons
    function toggleLoadingState(isLoading) {
        if (isLoading) {
            skeletonLoader.classList.remove('hidden');
            releasesGrid.classList.add('hidden');
            emptyState.classList.add('hidden');
            refreshIcon.classList.add('loading-spinner');
            refreshBtn.disabled = true;
            exportCsvBtn.disabled = true;
        } else {
            skeletonLoader.classList.add('hidden');
            releasesGrid.classList.remove('hidden');
            refreshIcon.classList.remove('loading-spinner');
            refreshBtn.disabled = false;
            exportCsvBtn.disabled = false;
        }
    }

    // Format timestamps to friendly format
    function updateLastUpdatedTime(unixTimestamp) {
        if (!unixTimestamp) {
            lastUpdatedText.textContent = "Updated just now";
            return;
        }
        const date = new Date(unixTimestamp * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        lastUpdatedText.textContent = `Last updated today at ${hours}:${minutes}`;
    }

    // Filter, sort and render the list of releases
    function getFilteredReleases() {
        // 1. Filter by category
        let filtered = releases.filter(item => {
            if (activeCategory === 'all') return true;
            return item.category.toLowerCase() === activeCategory;
        });

        // 2. Filter by Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const inBody = item.body.toLowerCase().includes(query);
                const inCategory = item.category.toLowerCase().includes(query);
                const inDate = item.date.toLowerCase().includes(query);
                return inBody || inCategory || inDate;
            });
        }

        // 3. Sort by Date
        filtered.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (sortOrder === 'newest') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        return filtered;
    }

    function filterAndRenderReleases() {
        const filtered = getFilteredReleases();
        renderGrid(filtered);
    }

    // Render cards into grid DOM
    function renderGrid(items) {
        releasesGrid.innerHTML = '';
        
        if (items.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        items.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'release-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const badgeClass = `badge-${item.category.toLowerCase()}`;
            
            card.innerHTML = `
                <div class="card-wrapper">
                    <div class="card-header">
                        <span class="badge ${badgeClass}">${escapeHtml(item.category)}</span>
                        <time class="card-date">${escapeHtml(item.date)}</time>
                    </div>
                    <div class="card-body">
                        ${item.body}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-copy" data-id="${item.id}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy</span>
                    </button>
                    <button class="btn-share" data-id="${item.id}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Share</span>
                    </button>
                </div>
            `;
            
            releasesGrid.appendChild(card);
        });

        // Add event listeners to copy buttons
        const copyBtns = releasesGrid.querySelectorAll('.btn-copy');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const releaseId = btn.getAttribute('data-id');
                const selected = releases.find(r => r.id === releaseId);
                if (selected) {
                    copyToClipboard(selected, btn);
                }
            });
        });

        // Add event listeners to the new share buttons
        const shareBtns = releasesGrid.querySelectorAll('.btn-share');
        shareBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const releaseId = btn.getAttribute('data-id');
                const selected = releases.find(r => r.id === releaseId);
                if (selected) {
                    openTweetModal(selected);
                }
            });
        });
    }

    // Copy to clipboard helper
    function copyToClipboard(release, button) {
        const cleanText = stripHtml(release.body).trim();
        const formattedCopyText = `BigQuery ${release.category} (${release.date}):\n${cleanText}\n\nRead more: ${release.link || 'https://cloud.google.com/bigquery/docs/release-notes'}`;
        
        navigator.clipboard.writeText(formattedCopyText).then(() => {
            const span = button.querySelector('span');
            const originalText = span.textContent;
            
            // Temporary visual feedback
            span.textContent = 'Copied!';
            button.style.borderColor = 'var(--accent-color)';
            button.style.color = 'var(--accent-color)';
            
            showToast("Copied release note to clipboard!");
            
            setTimeout(() => {
                span.textContent = originalText;
                button.style.borderColor = '';
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error("Clipboard copy failed: ", err);
            showToast("Failed to copy to clipboard.");
        });
    }

    // Export current list to CSV
    function exportToCSV() {
        const filtered = getFilteredReleases();
        
        if (filtered.length === 0) {
            showToast("No release notes available to export!");
            return;
        }

        // CSV headers
        const headers = ["Date", "Category", "Update Detail", "Link Reference"];
        
        // CSV rows structure
        const rows = filtered.map(item => {
            const cleanBody = stripHtml(item.body).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ').trim();
            return [
                `"${item.date.replace(/"/g, '""')}"`,
                `"${item.category.replace(/"/g, '""')}"`,
                `"${cleanBody}"`,
                `"${item.link.replace(/"/g, '""')}"`
            ];
        });

        // Combine to one string
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        // Export using Blob to handle complex encodings
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        // File naming conventions
        const dateTag = new Date().toISOString().slice(0, 10);
        const filename = `bigquery_release_notes_${activeCategory}_${dateTag}.csv`;
        
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup DOM
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast(`Exported ${filtered.length} notes to CSV successfully!`);
    }

    // Helper to strip HTML tags for clean text drafting
    function stripHtml(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    }

    // Helper to escape HTML to prevent XSS in rendering tags
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // --- Modal Tweet Editor Functions ---

    function openTweetModal(release) {
        currentSelectedRelease = release;
        
        // Strip HTML tags for clean tweet draft
        let cleanText = stripHtml(release.body);
        
        // Clean up whitespaces
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        
        // Truncate if text is extremely long to fit nicely in preview
        if (cleanText.length > 180) {
            cleanText = cleanText.substring(0, 177) + "...";
        }
        
        // Generate a draft
        const prefix = `📢 BigQuery ${release.category} (${release.date}):\n\n`;
        const suffix = `\n\n#BigQuery #GoogleCloud`;
        const initialTweet = `${prefix}"${cleanText}"${suffix}`;
        
        tweetTextarea.value = initialTweet;
        updateTweetPreview();
        
        // Set link preview href if any alternate link exists
        if (release.link) {
            previewLinkContainer.classList.remove('hidden');
        } else {
            previewLinkContainer.classList.add('hidden');
        }
        
        tweetModal.classList.add('active');
        tweetTextarea.focus();
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
        currentSelectedRelease = null;
    }

    // Update character counters and rendering in preview
    function updateTweetPreview() {
        const text = tweetTextarea.value;
        const count = text.length;
        
        charCount.textContent = count;
        
        const countWrapper = charCount.parentElement;
        if (count > 280) {
            countWrapper.classList.add('warning');
            tweetSubmitBtn.disabled = true;
        } else {
            countWrapper.classList.remove('warning');
            tweetSubmitBtn.disabled = false;
        }
        
        // Format preview text to render hashtags in a styled blue color
        let formattedText = escapeHtml(text);
        formattedText = formattedText.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="hashtag">$1</span>');
        previewText.innerHTML = formattedText;
    }

    // --- Event Listeners ---

    // Refresh action
    refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });

    // CSV Export action
    exportCsvBtn.addEventListener('click', exportToCSV);

    // Theme toggle action
    themeToggleBtn.addEventListener('click', () => {
        if (currentTheme === 'dark') {
            currentTheme = 'light';
        } else {
            currentTheme = 'dark';
        }
        
        document.body.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeToggleIcons();
        showToast(`Swapped to ${currentTheme} mode!`);
    });

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterAndRenderReleases();
    });

    // Sort order handler
    sortSelect.addEventListener('change', (e) => {
        sortOrder = e.target.value;
        filterAndRenderReleases();
    });

    // Category chips click handler
    categoryChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        // Remove active class from all chips
        categoryChipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        
        // Set clicked chip to active
        chip.classList.add('active');
        
        activeCategory = chip.getAttribute('data-category');
        filterAndRenderReleases();
    });

    // Textarea input watcher
    tweetTextarea.addEventListener('input', updateTweetPreview);

    // Hashtag helper buttons
    tagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            const startPos = tweetTextarea.selectionStart;
            const endPos = tweetTextarea.selectionEnd;
            const text = tweetTextarea.value;
            
            // Insert tag at cursor position, or at the end if not focused
            if (startPos || startPos === 0) {
                tweetTextarea.value = text.substring(0, startPos) + ' ' + tag + ' ' + text.substring(endPos, text.length);
                tweetTextarea.selectionStart = startPos + tag.length + 2;
                tweetTextarea.selectionEnd = startPos + tag.length + 2;
            } else {
                tweetTextarea.value += ' ' + tag;
            }
            
            tweetTextarea.focus();
            updateTweetPreview();
        });
    });

    // Cancel modal actions
    modalCloseBtn.addEventListener('click', closeTweetModal);
    tweetCancelBtn.addEventListener('click', closeTweetModal);
    
    // Close modal on click outside card
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // X Post Tweet Intent execution
    tweetSubmitBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        let shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        if (currentSelectedRelease && currentSelectedRelease.link) {
            shareUrl += `&url=${encodeURIComponent(currentSelectedRelease.link)}`;
        }
        
        // Open X sharing window
        window.open(shareUrl, '_blank', 'width=600,height=400,resizable=yes');
        
        closeTweetModal();
        showToast("Opened Twitter/X composer in a new tab!");
    });

    // Keyboard controls (ESC key to close modal)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('active')) {
            closeTweetModal();
        }
    });

    // --- Init App ---
    fetchReleases();
});
