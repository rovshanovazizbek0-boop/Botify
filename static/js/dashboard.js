// BotFactory Dashboard JavaScript
(function() {
    'use strict';

    let dashboard = {};

    // Initialize dashboard when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeDashboard();
    });

    function initializeDashboard() {
        initializeCharts();
        initializeBotManagement();
        initializeRealTimeUpdates();
        initializeSearchAndFilters();
        initializeQuickActions();
        initializeKeyboardShortcuts();
        
        console.log('Dashboard initialized');
    }

    // Charts and Analytics
    function initializeCharts() {
        const chartElements = {
            overview: document.getElementById('overviewChart'),
            activity: document.getElementById('activityChart'),
            performance: document.getElementById('performanceChart')
        };

        // Initialize charts if elements exist
        Object.keys(chartElements).forEach(key => {
            const element = chartElements[key];
            if (element) {
                dashboard[key + 'Chart'] = createChart(element, key);
            }
        });

        // Update charts with real data
        updateDashboardCharts();
    }

    function createChart(canvas, type) {
        const ctx = canvas.getContext('2d');
        
        const chartConfigs = {
            overview: {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Messages',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            },
            activity: {
                type: 'doughnut',
                data: {
                    labels: ['Active Bots', 'Inactive Bots'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#28a745', '#6c757d']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            },
            performance: {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: [],
                        backgroundColor: 'rgba(255, 193, 7, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            }
        };

        if (chartConfigs[type]) {
            return new Chart(ctx, chartConfigs[type]);
        }

        return null;
    }

    function updateDashboardCharts() {
        // Update overview chart with last 7 days data
        if (dashboard.overviewChart) {
            const last7Days = getLast7Days();
            const messageData = generateMockData(7, 0, 100);
            
            dashboard.overviewChart.data.labels = last7Days;
            dashboard.overviewChart.data.datasets[0].data = messageData;
            dashboard.overviewChart.update();
        }

        // Update activity chart
        if (dashboard.activityChart) {
            const activeBots = document.querySelectorAll('.bot-status .badge-success').length;
            const totalBots = document.querySelectorAll('.bot-status .badge').length;
            const inactiveBots = totalBots - activeBots;
            
            dashboard.activityChart.data.datasets[0].data = [activeBots, inactiveBots];
            dashboard.activityChart.update();
        }

        // Update performance chart
        if (dashboard.performanceChart) {
            const botNames = Array.from(document.querySelectorAll('.bot-name')).map(el => 
                el.textContent.trim().substring(0, 10) + (el.textContent.length > 10 ? '...' : '')
            );
            const responseData = generateMockData(botNames.length, 100, 2000);
            
            dashboard.performanceChart.data.labels = botNames;
            dashboard.performanceChart.data.datasets[0].data = responseData;
            dashboard.performanceChart.update();
        }
    }

    function getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return days;
    }

    function generateMockData(count, min, max) {
        return Array.from({ length: count }, () => 
            Math.floor(Math.random() * (max - min + 1)) + min
        );
    }

    // Bot Management
    function initializeBotManagement() {
        initializeBotActions();
        initializeBotCreation();
        initializeBotSettings();
        initializeBotTesting();
    }

    function initializeBotActions() {
        // Bot toggle actions
        document.addEventListener('click', function(e) {
            if (e.target.matches('.bot-toggle') || e.target.closest('.bot-toggle')) {
                e.preventDefault();
                const button = e.target.closest('.bot-toggle');
                const botId = button.dataset.botId;
                const isActive = button.dataset.active === 'true';
                
                toggleBot(botId, !isActive);
            }
            
            // Bot delete actions
            if (e.target.matches('.bot-delete') || e.target.closest('.bot-delete')) {
                e.preventDefault();
                const button = e.target.closest('.bot-delete');
                const botId = button.dataset.botId;
                const botName = button.dataset.botName || 'this bot';
                
                confirmBotDeletion(botId, botName);
            }
            
            // Bot duplicate actions
            if (e.target.matches('.bot-duplicate') || e.target.closest('.bot-duplicate')) {
                e.preventDefault();
                const button = e.target.closest('.bot-duplicate');
                const botId = button.dataset.botId;
                
                duplicateBot(botId);
            }
        });
    }

    function toggleBot(botId, activate) {
        setLoading(`.bot-toggle[data-bot-id="${botId}"]`, true);
        
        BotFactory.api(`/dashboard/bot/${botId}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ active: activate })
        })
        .then(response => {
            if (response.success) {
                showSuccess(`Bot ${activate ? 'activated' : 'deactivated'} successfully`);
                updateBotStatus(botId, activate);
            } else {
                showError(response.message || 'Failed to update bot status');
            }
        })
        .catch(error => {
            showError('Failed to update bot status');
        })
        .finally(() => {
            setLoading(`.bot-toggle[data-bot-id="${botId}"]`, false);
        });
    }

    function updateBotStatus(botId, isActive) {
        const statusBadge = document.querySelector(`[data-bot-id="${botId}"] .bot-status .badge`);
        const toggleButton = document.querySelector(`.bot-toggle[data-bot-id="${botId}"]`);
        
        if (statusBadge) {
            statusBadge.className = `badge ${isActive ? 'bg-success' : 'bg-secondary'}`;
            statusBadge.textContent = isActive ? 'Active' : 'Inactive';
        }
        
        if (toggleButton) {
            toggleButton.dataset.active = isActive.toString();
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.className = isActive ? 'fas fa-pause' : 'fas fa-play';
            }
        }
        
        // Update charts
        updateDashboardCharts();
    }

    function confirmBotDeletion(botId, botName) {
        const modal = createConfirmationModal(
            'Delete Bot',
            `Are you sure you want to delete "${botName}"? This action cannot be undone and will remove all associated data.`,
            'danger',
            () => deleteBot(botId)
        );
        
        modal.show();
    }

    function deleteBot(botId) {
        setLoading(`.bot-delete[data-bot-id="${botId}"]`, true);
        
        BotFactory.api(`/dashboard/bot/${botId}/delete`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.success) {
                showSuccess('Bot deleted successfully');
                removeBotFromUI(botId);
            } else {
                showError(response.message || 'Failed to delete bot');
            }
        })
        .catch(error => {
            showError('Failed to delete bot');
        })
        .finally(() => {
            setLoading(`.bot-delete[data-bot-id="${botId}"]`, false);
        });
    }

    function removeBotFromUI(botId) {
        const botRow = document.querySelector(`tr[data-bot-id="${botId}"]`);
        const botCard = document.querySelector(`.bot-card[data-bot-id="${botId}"]`);
        
        if (botRow) {
            botRow.style.transition = 'opacity 0.3s ease';
            botRow.style.opacity = '0';
            setTimeout(() => botRow.remove(), 300);
        }
        
        if (botCard) {
            botCard.style.transition = 'opacity 0.3s ease';
            botCard.style.opacity = '0';
            setTimeout(() => botCard.remove(), 300);
        }
        
        // Update stats
        updateBotStats();
        updateDashboardCharts();
    }

    function duplicateBot(botId) {
        setLoading(`.bot-duplicate[data-bot-id="${botId}"]`, true);
        
        BotFactory.api(`/dashboard/bot/${botId}/duplicate`, {
            method: 'POST'
        })
        .then(response => {
            if (response.success) {
                showSuccess('Bot duplicated successfully');
                // Redirect to new bot settings
                window.location.href = `/dashboard/bot/${response.new_bot_id}/settings`;
            } else {
                showError(response.message || 'Failed to duplicate bot');
            }
        })
        .catch(error => {
            showError('Failed to duplicate bot');
        })
        .finally(() => {
            setLoading(`.bot-duplicate[data-bot-id="${botId}"]`, false);
        });
    }

    function initializeBotCreation() {
        const createBotForm = document.querySelector('#createBotForm');
        if (createBotForm) {
            createBotForm.addEventListener('submit', handleBotCreation);
        }
        
        // Quick create bot functionality
        const quickCreateBtn = document.querySelector('.quick-create-bot');
        if (quickCreateBtn) {
            quickCreateBtn.addEventListener('click', showQuickCreateModal);
        }
    }

    function handleBotCreation(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        setLoading(form.querySelector('button[type="submit"]'), true);
        
        BotFactory.api('/dashboard/bot/create', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.success) {
                showSuccess('Bot created successfully!');
                window.location.href = `/dashboard/bot/${response.bot_id}/settings`;
            } else {
                showError(response.message || 'Failed to create bot');
            }
        })
        .catch(error => {
            showError('Failed to create bot');
        })
        .finally(() => {
            setLoading(form.querySelector('button[type="submit"]'), false);
        });
    }

    function showQuickCreateModal() {
        const modal = createQuickCreateModal();
        modal.show();
    }

    function createQuickCreateModal() {
        const modalHtml = `
            <div class="modal fade" id="quickCreateModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Quick Create Bot</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="quickCreateForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Bot Name</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Purpose</label>
                                    <select class="form-select" name="template">
                                        <option value="customer_support">Customer Support</option>
                                        <option value="sales_assistant">Sales Assistant</option>
                                        <option value="faq_helper">FAQ Helper</option>
                                        <option value="lead_generation">Lead Generation</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Create Bot</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('quickCreateModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('quickCreateModal'));
        
        // Handle form submission
        document.getElementById('quickCreateForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            setLoading(e.target.querySelector('button[type="submit"]'), true);
            
            BotFactory.api('/dashboard/bot/quick-create', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.success) {
                    modal.hide();
                    showSuccess('Bot created successfully!');
                    setTimeout(() => {
                        window.location.href = `/dashboard/bot/${response.bot_id}/settings`;
                    }, 1000);
                } else {
                    showError(response.message || 'Failed to create bot');
                }
            })
            .catch(error => {
                showError('Failed to create bot');
            })
            .finally(() => {
                setLoading(e.target.querySelector('button[type="submit"]'), false);
            });
        });
        
        return modal;
    }

    function initializeBotSettings() {
        // Auto-save functionality for bot settings
        const settingsForm = document.querySelector('#botSettingsForm');
        if (settingsForm) {
            const debouncedSave = BotFactory.debounce(autoSaveBotSettings, 2000);
            
            settingsForm.addEventListener('input', debouncedSave);
            settingsForm.addEventListener('change', debouncedSave);
        }
        
        // Telegram token validation
        const telegramTokenInput = document.querySelector('input[name="telegram_token"]');
        if (telegramTokenInput) {
            telegramTokenInput.addEventListener('blur', validateTelegramToken);
        }
    }

    function autoSaveBotSettings() {
        const form = document.querySelector('#botSettingsForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const botId = form.dataset.botId;
        
        BotFactory.api(`/dashboard/bot/${botId}/auto-save`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.success) {
                showAutoSaveIndicator();
            }
        })
        .catch(error => {
            console.warn('Auto-save failed:', error);
        });
    }

    function showAutoSaveIndicator() {
        const indicator = document.querySelector('.auto-save-indicator');
        if (indicator) {
            indicator.textContent = 'Auto-saved';
            indicator.classList.add('text-success');
            setTimeout(() => {
                indicator.textContent = '';
                indicator.classList.remove('text-success');
            }, 2000);
        }
    }

    function validateTelegramToken(e) {
        const token = e.target.value.trim();
        if (!token) return;
        
        const tokenPattern = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
        const isValid = tokenPattern.test(token);
        
        const feedback = e.target.parentElement.querySelector('.token-feedback');
        if (feedback) {
            feedback.remove();
        }
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'token-feedback small mt-1';
        
        if (isValid) {
            feedbackElement.className += ' text-success';
            feedbackElement.innerHTML = '<i class="fas fa-check me-1"></i>Token format is valid';
        } else {
            feedbackElement.className += ' text-danger';
            feedbackElement.innerHTML = '<i class="fas fa-times me-1"></i>Invalid token format';
        }
        
        e.target.parentElement.appendChild(feedbackElement);
    }

    function initializeBotTesting() {
        const testBotButtons = document.querySelectorAll('.test-bot');
        testBotButtons.forEach(button => {
            button.addEventListener('click', function() {
                const botId = this.dataset.botId;
                openBotTestInterface(botId);
            });
        });
    }

    function openBotTestInterface(botId) {
        const modal = createBotTestModal(botId);
        modal.show();
    }

    function createBotTestModal(botId) {
        const modalHtml = `
            <div class="modal fade" id="botTestModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Test Your Bot</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="chat-interface" style="height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; background: #f8f9fa;">
                                <div class="chat-messages"></div>
                            </div>
                            <div class="chat-input mt-3">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Type your message..." id="testMessage">
                                    <button class="btn btn-primary" type="button" onclick="sendTestMessage('${botId}')">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('botTestModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('botTestModal'));
        
        // Add welcome message
        addTestMessage('bot', 'Hello! I\'m your bot. Ask me anything!');
        
        // Handle Enter key in input
        document.getElementById('testMessage').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendTestMessage(botId);
            }
        });
        
        return modal;
    }

    window.sendTestMessage = function(botId) {
        const input = document.getElementById('testMessage');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        addTestMessage('user', message);
        input.value = '';
        
        // Add typing indicator
        addTypingIndicator();
        
        // Send to bot
        BotFactory.api(`/dashboard/bot/${botId}/test`, {
            method: 'POST',
            body: JSON.stringify({ message: message })
        })
        .then(response => {
            removeTypingIndicator();
            if (response.success) {
                addTestMessage('bot', response.response);
            } else {
                addTestMessage('bot', 'Sorry, I couldn\'t process your message.');
            }
        })
        .catch(error => {
            removeTypingIndicator();
            addTestMessage('bot', 'Sorry, there was an error processing your message.');
        });
    };

    function addTestMessage(sender, message) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message mb-2`;
        
        const isBot = sender === 'bot';
        messageElement.innerHTML = `
            <div class="d-flex ${isBot ? '' : 'justify-content-end'}">
                <div class="message-bubble ${isBot ? 'bg-light' : 'bg-primary text-white'}" 
                     style="max-width: 70%; padding: 0.75rem 1rem; border-radius: 18px;">
                    ${message}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const chatMessages = document.querySelector('.chat-messages');
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator mb-2';
        typingElement.innerHTML = `
            <div class="d-flex">
                <div class="message-bubble bg-light" style="padding: 0.75rem 1rem; border-radius: 18px;">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS for typing animation
        if (!document.querySelector('#typingStyles')) {
            const style = document.createElement('style');
            style.id = 'typingStyles';
            style.textContent = `
                .typing-dots span {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: #6c757d;
                    margin: 0 1px;
                    animation: typing 1.4s infinite;
                }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Real-time Updates
    function initializeRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(updateBotStats, 30000);
        
        // Update charts every 2 minutes
        setInterval(updateDashboardCharts, 120000);
        
        // Check for notifications every minute
        setInterval(checkNotifications, 60000);
    }

    function updateBotStats() {
        BotFactory.api('/dashboard/stats')
        .then(response => {
            if (response.success) {
                updateStatsDisplay(response.stats);
            }
        })
        .catch(error => {
            console.warn('Failed to update stats:', error);
        });
    }

    function updateStatsDisplay(stats) {
        const elements = {
            totalBots: document.querySelector('.stat-total-bots .stats-number'),
            totalConversations: document.querySelector('.stat-total-conversations .stats-number'),
            totalMessages: document.querySelector('.stat-total-messages .stats-number'),
            daysRemaining: document.querySelector('.stat-days-remaining .stats-number')
        };
        
        if (elements.totalBots) elements.totalBots.textContent = stats.total_bots || 0;
        if (elements.totalConversations) elements.totalConversations.textContent = stats.total_conversations || 0;
        if (elements.totalMessages) elements.totalMessages.textContent = BotFactory.formatNumber(stats.total_messages || 0);
        if (elements.daysRemaining) elements.daysRemaining.textContent = stats.days_remaining || 0;
    }

    function checkNotifications() {
        BotFactory.api('/dashboard/notifications')
        .then(response => {
            if (response.success && response.notifications.length > 0) {
                response.notifications.forEach(notification => {
                    showNotification(notification.message, notification.type);
                });
            }
        })
        .catch(error => {
            console.warn('Failed to check notifications:', error);
        });
    }

    // Search and Filters
    function initializeSearchAndFilters() {
        const searchInput = document.querySelector('#botSearch');
        if (searchInput) {
            const debouncedSearch = BotFactory.debounce(performBotSearch, 300);
            searchInput.addEventListener('input', debouncedSearch);
        }
        
        const filterButtons = document.querySelectorAll('.bot-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.dataset.filter;
                applyBotFilter(filter);
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function performBotSearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const botRows = document.querySelectorAll('.bot-row, .bot-card');
        
        botRows.forEach(row => {
            const botName = row.querySelector('.bot-name')?.textContent.toLowerCase() || '';
            const botDescription = row.querySelector('.bot-description')?.textContent.toLowerCase() || '';
            
            const matches = botName.includes(searchTerm) || botDescription.includes(searchTerm);
            row.style.display = matches ? '' : 'none';
        });
        
        // Update results count
        const visibleBots = document.querySelectorAll('.bot-row:not([style*="display: none"]), .bot-card:not([style*="display: none"])').length;
        updateSearchResults(visibleBots);
    }

    function applyBotFilter(filter) {
        const botRows = document.querySelectorAll('.bot-row, .bot-card');
        
        botRows.forEach(row => {
            const botStatus = row.querySelector('.bot-status .badge')?.textContent.toLowerCase() || '';
            
            let shouldShow = true;
            
            if (filter === 'active') {
                shouldShow = botStatus.includes('active');
            } else if (filter === 'inactive') {
                shouldShow = botStatus.includes('inactive') || botStatus.includes('not configured');
            } else if (filter === 'configured') {
                shouldShow = !botStatus.includes('not configured');
            }
            // 'all' filter shows everything
            
            row.style.display = shouldShow ? '' : 'none';
        });
        
        // Update results count
        const visibleBots = document.querySelectorAll('.bot-row:not([style*="display: none"]), .bot-card:not([style*="display: none"])').length;
        updateSearchResults(visibleBots);
    }

    function updateSearchResults(count) {
        const resultsElement = document.querySelector('.search-results');
        if (resultsElement) {
            resultsElement.textContent = `${count} bot${count !== 1 ? 's' : ''} found`;
        }
    }

    // Quick Actions
    function initializeQuickActions() {
        // Keyboard shortcuts for quick actions
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + N for new bot
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                const createButton = document.querySelector('.btn[href*="create"]');
                if (createButton) {
                    createButton.click();
                }
            }
        });
        
        // Quick action buttons
        const quickActionButtons = document.querySelectorAll('.quick-action');
        quickActionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                handleQuickAction(action);
            });
        });
    }

    function handleQuickAction(action) {
        switch (action) {
            case 'export-data':
                exportDashboardData();
                break;
            case 'backup-bots':
                backupAllBots();
                break;
            case 'refresh-stats':
                refreshDashboardStats();
                break;
            default:
                console.warn('Unknown quick action:', action);
        }
    }

    function exportDashboardData() {
        setLoading('.quick-action[data-action="export-data"]', true);
        
        BotFactory.api('/dashboard/export', { method: 'POST' })
        .then(response => {
            if (response.success) {
                // Trigger download
                const link = document.createElement('a');
                link.href = response.download_url;
                link.download = response.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showSuccess('Data exported successfully');
            } else {
                showError('Failed to export data');
            }
        })
        .catch(error => {
            showError('Failed to export data');
        })
        .finally(() => {
            setLoading('.quick-action[data-action="export-data"]', false);
        });
    }

    function backupAllBots() {
        setLoading('.quick-action[data-action="backup-bots"]', true);
        
        BotFactory.api('/dashboard/backup', { method: 'POST' })
        .then(response => {
            if (response.success) {
                showSuccess('Backup created successfully');
            } else {
                showError('Failed to create backup');
            }
        })
        .catch(error => {
            showError('Failed to create backup');
        })
        .finally(() => {
            setLoading('.quick-action[data-action="backup-bots"]', false);
        });
    }

    function refreshDashboardStats() {
        setLoading('.quick-action[data-action="refresh-stats"]', true);
        
        Promise.all([
            updateBotStats(),
            updateDashboardCharts()
        ])
        .then(() => {
            showSuccess('Dashboard refreshed');
        })
        .catch(() => {
            showError('Failed to refresh dashboard');
        })
        .finally(() => {
            setLoading('.quick-action[data-action="refresh-stats"]', false);
        });
    }

    // Dashboard-specific keyboard shortcuts
    function initializeKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Alt + S to focus search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const searchInput = document.querySelector('#botSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Alt + F to toggle filters
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                const filterContainer = document.querySelector('.filter-container');
                if (filterContainer) {
                    filterContainer.classList.toggle('d-none');
                }
            }
        });
    }

    // Utility Functions
    function createConfirmationModal(title, message, type, onConfirm) {
        const modalHtml = `
            <div class="modal fade" id="confirmationModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-${type}" id="confirmButton">Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('confirmationModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        
        document.getElementById('confirmButton').addEventListener('click', function() {
            modal.hide();
            if (onConfirm) onConfirm();
        });
        
        return modal;
    }

    // Expose dashboard object for external access
    window.Dashboard = dashboard;

})();
