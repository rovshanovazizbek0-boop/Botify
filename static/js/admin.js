// BotFactory Admin Panel JavaScript
(function() {
    'use strict';

    let admin = {};

    // Initialize admin panel when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeAdminPanel();
    });

    function initializeAdminPanel() {
        initializeBroadcastManagement();
        initializeUserManagement();
        initializeAnalyticsDashboard();
        initializeAdminCharts();
        initializeAdminNotifications();
        initializeAdminKeyboardShortcuts();
        
        console.log('Admin panel initialized');
    }

    // Broadcast Management
    function initializeBroadcastManagement() {
        initializeBroadcastForm();
        initializeBroadcastPreview();
        initializeBroadcastTemplates();
        initializeBroadcastScheduling();
        initializeBroadcastHistory();
    }

    function initializeBroadcastForm() {
        const broadcastForm = document.querySelector('#broadcastForm');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', handleBroadcastSubmission);
        }

        // Real-time content preview
        const contentInput = document.querySelector('#content');
        const htmlContentInput = document.querySelector('#html_content');
        
        if (contentInput) {
            contentInput.addEventListener('input', updateBroadcastPreview);
        }
        
        if (htmlContentInput) {
            htmlContentInput.addEventListener('input', updateBroadcastPreview);
        }

        // Target subscription change handler
        const targetSelect = document.querySelector('#target_subscription');
        if (targetSelect) {
            targetSelect.addEventListener('change', updateTargetAudience);
            // Initialize with current selection
            updateTargetAudience({ target: targetSelect });
        }
    }

    function handleBroadcastSubmission(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate form
        if (!validateBroadcastForm(formData)) {
            return;
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        setLoading(submitButton, true);
        
        // Check if scheduling is enabled
        const scheduleCheckbox = document.querySelector('#scheduleMessage');
        const scheduleDateTime = document.querySelector('#scheduleDateTime');
        
        if (scheduleCheckbox && scheduleCheckbox.checked && scheduleDateTime.value) {
            formData.append('scheduled_at', scheduleDateTime.value);
        }
        
        BotFactory.api('/admin/broadcast', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.success) {
                showSuccess('Broadcast sent successfully!');
                form.reset();
                updateBroadcastPreview();
                updateBroadcastHistory();
            } else {
                showError(response.message || 'Failed to send broadcast');
            }
        })
        .catch(error => {
            showError('Failed to send broadcast');
        })
        .finally(() => {
            setLoading(submitButton, false);
        });
    }

    function validateBroadcastForm(formData) {
        const title = formData.get('title');
        const content = formData.get('content');
        
        if (!title || title.trim().length === 0) {
            showError('Broadcast title is required');
            return false;
        }
        
        if (!content || content.trim().length === 0) {
            showError('Broadcast content is required');
            return false;
        }
        
        if (title.length > 200) {
            showError('Title must be less than 200 characters');
            return false;
        }
        
        if (content.length > 2000) {
            showError('Content must be less than 2000 characters');
            return false;
        }
        
        return true;
    }

    function updateBroadcastPreview() {
        const contentInput = document.querySelector('#content');
        const htmlContentInput = document.querySelector('#html_content');
        const previewContent = document.querySelector('.preview-content');
        
        if (!previewContent) return;
        
        const htmlContent = htmlContentInput ? htmlContentInput.value.trim() : '';
        const textContent = contentInput ? contentInput.value.trim() : '';
        
        if (htmlContent) {
            // Sanitize HTML content for preview
            const sanitizedHtml = sanitizeHtmlForPreview(htmlContent);
            previewContent.innerHTML = sanitizedHtml;
        } else if (textContent) {
            previewContent.textContent = textContent;
        } else {
            previewContent.textContent = 'Type your message above to see preview...';
        }
    }

    function sanitizeHtmlForPreview(html) {
        // Basic HTML sanitization for preview (remove potentially dangerous tags)
        const dangerousTags = /<script[^>]*>.*?<\/script>/gi;
        const cleanHtml = html.replace(dangerousTags, '');
        
        // Allow only safe HTML tags
        const allowedTags = /<(\/?)([bius]|strong|em|br|p|div|span|h[1-6])[^>]*>/gi;
        return cleanHtml.replace(/<[^>]*>/gi, function(match) {
            if (allowedTags.test(match)) {
                allowedTags.lastIndex = 0; // Reset regex
                return match;
            }
            return '';
        });
    }

    function updateTargetAudience(e) {
        const target = e.target.value;
        
        // Mock user counts - in production, this would fetch from API
        const userCounts = {
            free: 150,
            business: 45,
            enterprise: 12
        };
        
        const freeCountElement = document.querySelector('#freeUserCount');
        const businessCountElement = document.querySelector('#businessUserCount');
        const enterpriseCountElement = document.querySelector('#enterpriseUserCount');
        const totalCountElement = document.querySelector('#totalRecipients');
        
        if (freeCountElement) freeCountElement.textContent = userCounts.free;
        if (businessCountElement) businessCountElement.textContent = userCounts.business;
        if (enterpriseCountElement) enterpriseCountElement.textContent = userCounts.enterprise;
        
        let targetCount = 0;
        if (target === 'free') {
            targetCount = userCounts.free;
        } else if (target === 'business') {
            targetCount = userCounts.business;
        } else if (target === 'enterprise') {
            targetCount = userCounts.enterprise;
        }
        
        if (totalCountElement) {
            totalCountElement.textContent = targetCount;
            totalCountElement.style.color = targetCount > 0 ? '#007bff' : '#6c757d';
        }
    }

    function initializeBroadcastTemplates() {
        // Template buttons are handled by onclick events in HTML
        // This function sets up any additional template functionality
        
        window.useTemplate = function(templateType) {
            const templates = {
                welcome: {
                    title: 'Welcome to BotFactory!',
                    content: 'Thank you for joining BotFactory! 🎉\n\nYour 14-day free trial has started. Create your first AI chatbot and discover the power of automated conversations.\n\nNeed help getting started? Check out our quick start guide or contact support.\n\nHappy bot building!'
                },
                upgrade: {
                    title: 'Upgrade Your BotFactory Experience',
                    content: '🚀 Ready to take your chatbots to the next level?\n\nUpgrade to Business or Enterprise plan and unlock:\n• Unlimited messages\n• Advanced analytics\n• Multi-channel support\n• Priority support\n\nSpecial offer: Use code UPGRADE20 for 20% off your first month!\n\n[Upgrade Now]'
                },
                feature: {
                    title: 'New Feature: Advanced Analytics Dashboard',
                    content: '📊 Exciting news! We\'ve just launched our new Advanced Analytics Dashboard!\n\nNew features include:\n• Real-time conversation insights\n• User behavior tracking\n• Performance metrics\n• Custom reports\n\nAvailable now for Business and Enterprise users. Check it out in your dashboard!'
                },
                maintenance: {
                    title: 'Scheduled Maintenance Notice',
                    content: '🔧 Scheduled Maintenance Notice\n\nWe\'ll be performing system maintenance on [DATE] from [TIME] to [TIME].\n\nDuring this time:\n• Chatbots will continue working normally\n• Dashboard may be temporarily unavailable\n• No data will be lost\n\nWe apologize for any inconvenience. Thank you for your patience!'
                }
            };
            
            const template = templates[templateType];
            if (template) {
                const titleInput = document.querySelector('#title');
                const contentInput = document.querySelector('#content');
                
                if (titleInput) titleInput.value = template.title;
                if (contentInput) contentInput.value = template.content;
                
                updateBroadcastPreview();
                showSuccess(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template loaded`);
            }
        };
    }

    function initializeBroadcastScheduling() {
        const scheduleCheckbox = document.querySelector('#scheduleMessage');
        const scheduleOptions = document.querySelector('#scheduleOptions');
        
        if (scheduleCheckbox && scheduleOptions) {
            scheduleCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    scheduleOptions.classList.remove('d-none');
                    // Set minimum date to now
                    const now = new Date();
                    const minDateTime = now.toISOString().slice(0, 16);
                    const dateTimeInput = scheduleOptions.querySelector('input[type="datetime-local"]');
                    if (dateTimeInput) {
                        dateTimeInput.min = minDateTime;
                    }
                } else {
                    scheduleOptions.classList.add('d-none');
                }
            });
        }
    }

    function initializeBroadcastHistory() {
        // Initialize broadcast history functionality
        const historyTable = document.querySelector('.broadcast-history-table');
        if (historyTable) {
            // Add event listeners for broadcast actions
            historyTable.addEventListener('click', function(e) {
                const target = e.target.closest('button');
                if (!target) return;
                
                const broadcastId = target.dataset.broadcastId;
                
                if (target.classList.contains('view-broadcast')) {
                    viewBroadcastDetails(broadcastId);
                } else if (target.classList.contains('clone-broadcast')) {
                    cloneBroadcast(broadcastId);
                } else if (target.classList.contains('delete-broadcast')) {
                    deleteBroadcast(broadcastId);
                }
            });
        }
    }

    function updateBroadcastHistory() {
        // Refresh broadcast history table
        BotFactory.api('/admin/broadcast/history')
        .then(response => {
            if (response.success) {
                const historyContainer = document.querySelector('.broadcast-history');
                if (historyContainer) {
                    historyContainer.innerHTML = response.html;
                }
            }
        })
        .catch(error => {
            console.warn('Failed to update broadcast history:', error);
        });
    }

    // User Management
    function initializeUserManagement() {
        initializeUserFilters();
        initializeUserSearch();
        initializeBulkActions();
        initializeUserActions();
        initializeUserModals();
    }

    function initializeUserFilters() {
        const filterForm = document.querySelector('.user-filters');
        if (filterForm) {
            // Apply filters button
            const applyButton = filterForm.querySelector('.apply-filters');
            if (applyButton) {
                applyButton.addEventListener('click', applyUserFilters);
            }
            
            // Clear filters button
            const clearButton = filterForm.querySelector('.clear-filters');
            if (clearButton) {
                clearButton.addEventListener('click', clearUserFilters);
            }
            
            // Enter key in search input
            const searchInput = filterForm.querySelector('#searchUsers');
            if (searchInput) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        applyUserFilters();
                    }
                });
            }
        }
    }

    function applyUserFilters() {
        const searchInput = document.querySelector('#searchUsers');
        const subscriptionFilter = document.querySelector('#filterSubscription');
        const statusFilter = document.querySelector('#filterStatus');
        const languageFilter = document.querySelector('#filterLanguage');
        
        const params = new URLSearchParams(window.location.search);
        
        // Clear existing filter params
        params.delete('search');
        params.delete('subscription');
        params.delete('status');
        params.delete('language');
        params.delete('page'); // Reset to first page
        
        // Add new filter params
        if (searchInput && searchInput.value.trim()) {
            params.set('search', searchInput.value.trim());
        }
        if (subscriptionFilter && subscriptionFilter.value) {
            params.set('subscription', subscriptionFilter.value);
        }
        if (statusFilter && statusFilter.value) {
            params.set('status', statusFilter.value);
        }
        if (languageFilter && languageFilter.value) {
            params.set('language', languageFilter.value);
        }
        
        // Redirect with new params
        window.location.href = window.location.pathname + '?' + params.toString();
    }

    function clearUserFilters() {
        window.location.href = window.location.pathname;
    }

    function initializeUserSearch() {
        const searchInput = document.querySelector('#searchUsers');
        if (searchInput) {
            // Add search icon animation
            searchInput.addEventListener('focus', function() {
                const searchButton = this.parentElement.querySelector('button');
                if (searchButton) {
                    searchButton.classList.add('btn-primary');
                    searchButton.classList.remove('btn-outline-secondary');
                }
            });
            
            searchInput.addEventListener('blur', function() {
                const searchButton = this.parentElement.querySelector('button');
                if (searchButton && !this.value.trim()) {
                    searchButton.classList.remove('btn-primary');
                    searchButton.classList.add('btn-outline-secondary');
                }
            });
        }
    }

    function initializeBulkActions() {
        // Select all checkbox
        const selectAllCheckbox = document.querySelector('#selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const userCheckboxes = document.querySelectorAll('.user-checkbox');
                userCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateBulkActionState();
            });
        }
        
        // Individual user checkboxes
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        userCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateBulkActionState);
        });
        
        // Bulk action modal
        const bulkActionModal = document.querySelector('#bulkActionModal');
        if (bulkActionModal) {
            const actionSelect = bulkActionModal.querySelector('#bulkActionType');
            if (actionSelect) {
                actionSelect.addEventListener('change', updateBulkActionOptions);
            }
        }
    }

    function updateBulkActionState() {
        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        const selectedCount = selectedCheckboxes.length;
        
        // Update count display
        const countElements = document.querySelectorAll('#selectedCount');
        countElements.forEach(element => {
            element.textContent = selectedCount;
        });
        
        // Update select all checkbox state
        const selectAllCheckbox = document.querySelector('#selectAll');
        const allCheckboxes = document.querySelectorAll('.user-checkbox');
        
        if (selectAllCheckbox && allCheckboxes.length > 0) {
            if (selectedCount === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (selectedCount === allCheckboxes.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
            }
        }
        
        // Enable/disable bulk action button
        const bulkActionButton = document.querySelector('.bulk-action-btn');
        if (bulkActionButton) {
            bulkActionButton.disabled = selectedCount === 0;
        }
    }

    function updateBulkActionOptions(e) {
        const actionType = e.target.value;
        const optionsContainer = document.querySelector('#bulkActionOptions');
        
        if (!optionsContainer) return;
        
        let optionsHtml = '';
        
        switch (actionType) {
            case 'upgrade_subscription':
                optionsHtml = `
                    <div class="mb-3">
                        <label class="form-label">New Subscription Type</label>
                        <select class="form-select" name="subscription_type">
                            <option value="business">Business ($49/month)</option>
                            <option value="enterprise">Enterprise ($99/month)</option>
                        </select>
                    </div>
                `;
                break;
            case 'send_email':
                optionsHtml = `
                    <div class="mb-3">
                        <label class="form-label">Email Subject</label>
                        <input type="text" class="form-control" name="email_subject" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email Content</label>
                        <textarea class="form-control" name="email_content" rows="4" required></textarea>
                    </div>
                `;
                break;
            case 'extend_trial':
                optionsHtml = `
                    <div class="mb-3">
                        <label class="form-label">Extension Days</label>
                        <input type="number" class="form-control" name="extension_days" value="7" min="1" max="30" required>
                    </div>
                `;
                break;
        }
        
        optionsContainer.innerHTML = optionsHtml;
    }

    function initializeUserActions() {
        // User action buttons are handled via onclick attributes in templates
        // This function defines the global functions used by those buttons
        
        window.viewUser = function(userId) {
            // Load user details modal
            BotFactory.api(`/admin/user/${userId}/details`)
            .then(response => {
                if (response.success) {
                    showUserDetailsModal(response.user);
                } else {
                    showError('Failed to load user details');
                }
            })
            .catch(error => {
                showError('Failed to load user details');
            });
        };
        
        window.editUser = function(userId) {
            // Navigate to user edit page or show edit modal
            window.location.href = `/admin/user/${userId}/edit`;
        };
        
        window.changeSubscription = function(userId) {
            showChangeSubscriptionModal(userId);
        };
        
        window.extendTrial = function(userId) {
            showExtendTrialModal(userId);
        };
        
        window.resetPassword = function(userId) {
            if (confirm('Are you sure you want to reset this user\'s password? They will receive an email with instructions.')) {
                performUserAction(userId, 'reset_password');
            }
        };
        
        window.suspendUser = function(userId) {
            if (confirm('Are you sure you want to suspend this user? They will not be able to access their account.')) {
                performUserAction(userId, 'suspend');
            }
        };
        
        window.deleteUser = function(userId) {
            if (confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all their bots and data.')) {
                if (confirm('This is permanent. Are you absolutely sure?')) {
                    performUserAction(userId, 'delete');
                }
            }
        };
        
        window.exportUsers = function() {
            const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
            
            BotFactory.api('/admin/users/export', {
                method: 'POST',
                body: JSON.stringify({ user_ids: selectedUsers })
            })
            .then(response => {
                if (response.success) {
                    // Trigger download
                    const link = document.createElement('a');
                    link.href = response.download_url;
                    link.download = response.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showSuccess('User data exported successfully');
                } else {
                    showError('Failed to export user data');
                }
            })
            .catch(error => {
                showError('Failed to export user data');
            });
        };
        
        window.bulkAction = function() {
            const selectedUsers = document.querySelectorAll('.user-checkbox:checked');
            if (selectedUsers.length === 0) {
                showWarning('Please select users first');
                return;
            }
            
            const modal = document.querySelector('#bulkActionModal');
            if (modal) {
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
            }
        };
        
        window.executeBulkAction = function() {
            const actionType = document.querySelector('#bulkActionType').value;
            const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
            
            if (!actionType) {
                showError('Please select an action');
                return;
            }
            
            if (selectedUsers.length === 0) {
                showError('No users selected');
                return;
            }
            
            // Collect additional options
            const optionsContainer = document.querySelector('#bulkActionOptions');
            const options = {};
            
            if (optionsContainer) {
                const inputs = optionsContainer.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (input.name) {
                        options[input.name] = input.value;
                    }
                });
            }
            
            if (confirm(`Execute ${actionType.replace('_', ' ')} for ${selectedUsers.length} users?`)) {
                performBulkAction(actionType, selectedUsers, options);
            }
        };
    }

    function performUserAction(userId, action) {
        BotFactory.api(`/admin/user/${userId}/${action}`, {
            method: 'POST'
        })
        .then(response => {
            if (response.success) {
                showSuccess(response.message || 'Action completed successfully');
                
                // Refresh page if user was deleted
                if (action === 'delete') {
                    setTimeout(() => window.location.reload(), 1000);
                }
            } else {
                showError(response.message || 'Action failed');
            }
        })
        .catch(error => {
            showError('Action failed');
        });
    }

    function performBulkAction(actionType, userIds, options) {
        const executeButton = document.querySelector('#bulkActionModal .btn-primary');
        setLoading(executeButton, true);
        
        BotFactory.api('/admin/users/bulk-action', {
            method: 'POST',
            body: JSON.stringify({
                action: actionType,
                user_ids: userIds,
                options: options
            })
        })
        .then(response => {
            if (response.success) {
                showSuccess(`Bulk action completed successfully. ${response.affected_count} users affected.`);
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.querySelector('#bulkActionModal'));
                if (modal) modal.hide();
                
                // Refresh page
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showError(response.message || 'Bulk action failed');
            }
        })
        .catch(error => {
            showError('Bulk action failed');
        })
        .finally(() => {
            setLoading(executeButton, false);
        });
    }

    function initializeUserModals() {
        // Initialize user-related modals
        // These are created dynamically as needed
    }

    function showUserDetailsModal(user) {
        const modalHtml = `
            <div class="modal fade" id="userDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Details: ${user.username}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Basic Information</h6>
                                    <p><strong>Email:</strong> ${user.email}</p>
                                    <p><strong>Username:</strong> ${user.username}</p>
                                    <p><strong>Language:</strong> ${user.language}</p>
                                    <p><strong>Member Since:</strong> ${BotFactory.formatDate(user.created_at)}</p>
                                    <p><strong>Last Login:</strong> ${user.last_login ? BotFactory.formatDateTime(user.last_login) : 'Never'}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Subscription</h6>
                                    <p><strong>Type:</strong> ${user.subscription_type}</p>
                                    <p><strong>Status:</strong> ${user.is_active ? 'Active' : 'Expired'}</p>
                                    <p><strong>Expires:</strong> ${BotFactory.formatDate(user.subscription_end)}</p>
                                    <p><strong>Is Trial:</strong> ${user.is_trial ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                            <hr>
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Usage Statistics</h6>
                                    <p><strong>Bots Created:</strong> ${user.bots_count}</p>
                                    <p><strong>Total Conversations:</strong> ${user.conversations_count}</p>
                                    <p><strong>Total Messages:</strong> ${user.messages_count}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Account Status</h6>
                                    <p><strong>Is Admin:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
                                    <p><strong>Account Status:</strong> ${user.is_suspended ? 'Suspended' : 'Active'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="editUser(${user.id})">Edit User</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.querySelector('#userDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.querySelector('#userDetailsModal'));
        modal.show();
    }

    function showChangeSubscriptionModal(userId) {
        const modalHtml = `
            <div class="modal fade" id="changeSubscriptionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Change Subscription</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="changeSubscriptionForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">New Subscription Type</label>
                                    <select class="form-select" name="subscription_type" required>
                                        <option value="free">Free</option>
                                        <option value="business">Business ($49/month)</option>
                                        <option value="enterprise">Enterprise ($99/month)</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Duration (days)</label>
                                    <input type="number" class="form-control" name="duration" value="30" min="1" required>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Change Subscription</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.querySelector('#changeSubscriptionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.querySelector('#changeSubscriptionModal'));
        
        // Handle form submission
        document.querySelector('#changeSubscriptionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            BotFactory.api(`/admin/user/${userId}/change-subscription`, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.success) {
                    modal.hide();
                    showSuccess('Subscription changed successfully');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showError(response.message || 'Failed to change subscription');
                }
            })
            .catch(error => {
                showError('Failed to change subscription');
            });
        });
        
        modal.show();
    }

    function showExtendTrialModal(userId) {
        const modalHtml = `
            <div class="modal fade" id="extendTrialModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Extend Trial</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="extendTrialForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Extension Days</label>
                                    <input type="number" class="form-control" name="days" value="7" min="1" max="30" required>
                                    <div class="form-text">Extend the trial period by the specified number of days</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Reason (Optional)</label>
                                    <textarea class="form-control" name="reason" rows="3" placeholder="Internal note about the extension"></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">Extend Trial</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.querySelector('#extendTrialModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.querySelector('#extendTrialModal'));
        
        // Handle form submission
        document.querySelector('#extendTrialForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            BotFactory.api(`/admin/user/${userId}/extend-trial`, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.success) {
                    modal.hide();
                    showSuccess('Trial extended successfully');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showError(response.message || 'Failed to extend trial');
                }
            })
            .catch(error => {
                showError('Failed to extend trial');
            });
        });
        
        modal.show();
    }

    // Analytics Dashboard
    function initializeAnalyticsDashboard() {
        initializeAnalyticsFilters();
        initializeAnalyticsRefresh();
        initializeAnalyticsExport();
    }

    function initializeAnalyticsFilters() {
        const periodButtons = document.querySelectorAll('[data-period]');
        periodButtons.forEach(button => {
            button.addEventListener('click', function() {
                const period = this.dataset.period;
                updateAnalyticsPeriod(period);
                
                // Update active state
                periodButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function updateAnalyticsPeriod(period) {
        // Update analytics data based on period
        BotFactory.api(`/admin/analytics?period=${period}`)
        .then(response => {
            if (response.success) {
                updateAnalyticsDisplay(response.data);
                updateAnalyticsCharts(response.data);
            }
        })
        .catch(error => {
            console.warn('Failed to update analytics period:', error);
        });
    }

    function updateAnalyticsDisplay(data) {
        // Update stats cards
        const statsElements = {
            totalUsers: document.querySelector('.stat-total-users .stats-number'),
            totalBots: document.querySelector('.stat-total-bots .stats-number'),
            revenue: document.querySelector('.stat-revenue .stats-number'),
            growthRate: document.querySelector('.stat-growth .stats-number')
        };
        
        if (statsElements.totalUsers) statsElements.totalUsers.textContent = data.total_users || 0;
        if (statsElements.totalBots) statsElements.totalBots.textContent = data.total_bots || 0;
        if (statsElements.revenue) statsElements.revenue.textContent = `$${data.revenue || 0}`;
        if (statsElements.growthRate) statsElements.growthRate.textContent = `+${data.growth_rate || 0}%`;
    }

    function initializeAnalyticsRefresh() {
        const refreshButton = document.querySelector('.refresh-analytics');
        if (refreshButton) {
            refreshButton.addEventListener('click', function() {
                setLoading(this, true);
                
                // Refresh all analytics data
                Promise.all([
                    updateAnalyticsPeriod('month'),
                    updateAnalyticsCharts()
                ])
                .then(() => {
                    showSuccess('Analytics refreshed');
                })
                .catch(() => {
                    showError('Failed to refresh analytics');
                })
                .finally(() => {
                    setLoading(this, false);
                });
            });
        }
    }

    function initializeAnalyticsExport() {
        const exportButton = document.querySelector('.export-analytics');
        if (exportButton) {
            exportButton.addEventListener('click', function() {
                setLoading(this, true);
                
                BotFactory.api('/admin/analytics/export', {
                    method: 'POST'
                })
                .then(response => {
                    if (response.success) {
                        // Trigger download
                        const link = document.createElement('a');
                        link.href = response.download_url;
                        link.download = response.filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        showSuccess('Analytics exported successfully');
                    } else {
                        showError('Failed to export analytics');
                    }
                })
                .catch(error => {
                    showError('Failed to export analytics');
                })
                .finally(() => {
                    setLoading(this, false);
                });
            });
        }
    }

    // Admin Charts
    function initializeAdminCharts() {
        // Charts are initialized in the analytics template
        // This function handles chart updates and interactions
        admin.charts = {};
        
        // Growth chart period toggle
        const growthPeriodButtons = document.querySelectorAll('input[name="growthPeriod"]');
        growthPeriodButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                updateGrowthChart(this.id);
            });
        });
    }

    function updateGrowthChart(period) {
        const chart = admin.charts.growth;
        if (!chart) return;
        
        if (period === 'quarter') {
            chart.data.labels = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
            chart.data.datasets[0].data = [54, 156, 267, 356];
            chart.data.datasets[1].data = [2400, 7200, 14800, 22400];
        } else {
            chart.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            chart.data.datasets[0].data = [12, 19, 23, 31, 45, 67, 89, 134, 167, 203, 251, 289];
            chart.data.datasets[1].data = [500, 800, 1200, 1800, 2400, 3200, 4100, 5300, 6800, 8200, 9900, 11500];
        }
        chart.update();
    }

    function updateAnalyticsCharts(data) {
        // Update charts with new data
        if (data && admin.charts) {
            Object.keys(admin.charts).forEach(chartKey => {
                const chart = admin.charts[chartKey];
                if (chart && data[chartKey]) {
                    chart.data = data[chartKey];
                    chart.update();
                }
            });
        }
    }

    // Admin Notifications
    function initializeAdminNotifications() {
        // Check for admin notifications every 5 minutes
        setInterval(checkAdminNotifications, 300000);
        
        // Initial check
        checkAdminNotifications();
    }

    function checkAdminNotifications() {
        BotFactory.api('/admin/notifications')
        .then(response => {
            if (response.success && response.notifications.length > 0) {
                response.notifications.forEach(notification => {
                    showAdminNotification(notification);
                });
            }
        })
        .catch(error => {
            console.warn('Failed to check admin notifications:', error);
        });
    }

    function showAdminNotification(notification) {
        // Show admin-specific notifications
        const notificationHtml = `
            <div class="admin-notification alert alert-${notification.type} alert-dismissible fade show position-fixed" 
                 style="top: 80px; right: 20px; z-index: 1070; min-width: 350px; max-width: 500px;">
                <div class="d-flex align-items-center">
                    <i class="fas fa-crown me-2"></i>
                    <div class="flex-grow-1">
                        <strong>Admin Alert:</strong> ${notification.message}
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', notificationHtml);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            const alertElement = document.querySelector('.admin-notification');
            if (alertElement) {
                const alert = bootstrap.Alert.getOrCreateInstance(alertElement);
                alert.close();
            }
        }, 10000);
    }

    // Admin Keyboard Shortcuts
    function initializeAdminKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Shift + B for new broadcast
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                const broadcastPage = document.querySelector('a[href*="broadcast"]');
                if (broadcastPage) {
                    broadcastPage.click();
                }
            }
            
            // Ctrl/Cmd + Shift + U for users page
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
                e.preventDefault();
                const usersPage = document.querySelector('a[href*="users"]');
                if (usersPage) {
                    usersPage.click();
                }
            }
            
            // Ctrl/Cmd + Shift + A for analytics page
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                const analyticsPage = document.querySelector('a[href*="analytics"]');
                if (analyticsPage) {
                    analyticsPage.click();
                }
            }
        });
    }

    // Global functions for template usage
    window.saveDraft = function() {
        const form = document.querySelector('#broadcastForm');
        if (form) {
            const formData = new FormData(form);
            
            BotFactory.api('/admin/broadcast/save-draft', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.success) {
                    showSuccess('Draft saved successfully');
                } else {
                    showError('Failed to save draft');
                }
            })
            .catch(error => {
                showError('Failed to save draft');
            });
        }
    };

    window.viewBroadcast = function(broadcastId) {
        window.location.href = `/admin/broadcast/${broadcastId}/view`;
    };

    window.sendBroadcast = function(broadcastId) {
        if (confirm('Are you sure you want to send this broadcast?')) {
            BotFactory.api(`/admin/broadcast/${broadcastId}/send`, {
                method: 'POST'
            })
            .then(response => {
                if (response.success) {
                    showSuccess('Broadcast sent successfully');
                    updateBroadcastHistory();
                } else {
                    showError(response.message || 'Failed to send broadcast');
                }
            })
            .catch(error => {
                showError('Failed to send broadcast');
            });
        }
    };

    window.cloneBroadcast = function(broadcastId) {
        BotFactory.api(`/admin/broadcast/${broadcastId}/clone`, {
            method: 'POST'
        })
        .then(response => {
            if (response.success) {
                showSuccess('Broadcast cloned successfully');
                
                // Load cloned data into form
                const titleInput = document.querySelector('#title');
                const contentInput = document.querySelector('#content');
                
                if (titleInput) titleInput.value = response.title + ' (Copy)';
                if (contentInput) contentInput.value = response.content;
                
                updateBroadcastPreview();
            } else {
                showError(response.message || 'Failed to clone broadcast');
            }
        })
        .catch(error => {
            showError('Failed to clone broadcast');
        });
    };

    // Expose admin object for external access
    window.Admin = admin;

})();
