// BotFactory Main JavaScript
(function() {
    'use strict';

    // Initialize application when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });

    function initializeApp() {
        // Initialize Bootstrap tooltips
        initializeTooltips();
        
        // Initialize form validation
        initializeFormValidation();
        
        // Initialize notification system
        initializeNotifications();
        
        // Initialize smooth scrolling
        initializeSmoothScrolling();
        
        // Initialize theme management
        initializeTheme();
        
        // Initialize keyboard shortcuts
        initializeKeyboardShortcuts();
        
        // Initialize loading states
        initializeLoadingStates();
        
        console.log('BotFactory application initialized');
    }

    // Bootstrap Tooltips
    function initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Form Validation
    function initializeFormValidation() {
        const forms = document.querySelectorAll('.needs-validation');
        
        Array.from(forms).forEach(function(form) {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });

        // Real-time validation
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }

    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        // Clear previous errors
        clearFieldError(event);
        
        // Email validation
        if (field.type === 'email' && value) {
            if (!isValidEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Password strength validation
        if (field.type === 'password' && field.name === 'password' && value) {
            const strength = getPasswordStrength(value);
            showPasswordStrength(field, strength);
            
            if (strength.score < 2) {
                showFieldError(field, 'Password is too weak');
                return false;
            }
        }
        
        // Confirm password validation
        if (field.name === 'password2' && value) {
            const password = document.querySelector('input[name="password"]');
            if (password && value !== password.value) {
                showFieldError(field, 'Passwords do not match');
                return false;
            }
        }
        
        return true;
    }

    function clearFieldError(event) {
        const field = event.target;
        const errorElement = field.parentElement.querySelector('.field-error');
        const strengthElement = field.parentElement.querySelector('.password-strength');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        if (strengthElement && field.type !== 'password') {
            strengthElement.remove();
        }
        
        field.classList.remove('is-invalid');
    }

    function showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.textContent = message;
            return;
        }
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-danger small mt-1';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function getPasswordStrength(password) {
        let score = 0;
        const feedback = [];
        
        if (password.length >= 8) score++;
        else feedback.push('Use at least 8 characters');
        
        if (/[a-z]/.test(password)) score++;
        else feedback.push('Include lowercase letters');
        
        if (/[A-Z]/.test(password)) score++;
        else feedback.push('Include uppercase letters');
        
        if (/[0-9]/.test(password)) score++;
        else feedback.push('Include numbers');
        
        if (/[^A-Za-z0-9]/.test(password)) score++;
        else feedback.push('Include special characters');
        
        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['danger', 'warning', 'info', 'primary', 'success'];
        
        return {
            score: score,
            label: labels[score] || 'Very Weak',
            color: colors[score] || 'danger',
            feedback: feedback
        };
    }

    function showPasswordStrength(field, strength) {
        let strengthElement = field.parentElement.querySelector('.password-strength');
        
        if (!strengthElement) {
            strengthElement = document.createElement('div');
            strengthElement.className = 'password-strength mt-1';
            field.parentElement.appendChild(strengthElement);
        }
        
        const percentage = (strength.score / 5) * 100;
        
        strengthElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted">Password Strength</small>
                <small class="text-${strength.color}">${strength.label}</small>
            </div>
            <div class="progress" style="height: 4px;">
                <div class="progress-bar bg-${strength.color}" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    // Notification System
    function initializeNotifications() {
        window.showNotification = function(message, type = 'info', duration = 5000) {
            const notification = createNotification(message, type);
            document.body.appendChild(notification);
            
            // Trigger animation
            setTimeout(() => notification.classList.add('show'), 100);
            
            // Auto-dismiss
            setTimeout(() => {
                dismissNotification(notification);
            }, duration);
            
            return notification;
        };

        window.showSuccess = function(message) {
            return showNotification(message, 'success');
        };

        window.showError = function(message) {
            return showNotification(message, 'danger', 8000);
        };

        window.showWarning = function(message) {
            return showNotification(message, 'warning', 6000);
        };
    }

    function createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification alert alert-${type} alert-dismissible fade position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            max-width: 500px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        const icons = {
            success: 'fas fa-check-circle',
            danger: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${icons[type] || icons.info} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" onclick="dismissNotification(this.closest('.notification'))"></button>
            </div>
        `;
        
        return notification;
    }

    function dismissNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }

    window.dismissNotification = dismissNotification;

    // Smooth Scrolling
    function initializeSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                const href = link.getAttribute('href');
                
                if (href === '#' || !href || href.trim() === '') {
                    return;
                }
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    
                    const offsetTop = target.offsetTop - 80; // Account for navbar
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Theme Management
    function initializeTheme() {
        const theme = localStorage.getItem('botfactory-theme') || 'light';
        applyTheme(theme);
        
        // Theme toggle functionality
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('botfactory-theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // Keyboard Shortcuts
    function initializeKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    const modal = bootstrap.Modal.getInstance(openModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            }
            
            // Ctrl/Cmd + Enter to submit forms
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
                    const form = activeElement.closest('form');
                    if (form) {
                        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
                        if (submitButton) {
                            submitButton.click();
                        }
                    }
                }
            }
        });
    }

    // Loading States
    function initializeLoadingStates() {
        window.setLoading = function(element, isLoading) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            
            if (!element) return;
            
            if (isLoading) {
                element.classList.add('loading');
                element.disabled = true;
                
                const originalText = element.textContent;
                element.setAttribute('data-original-text', originalText);
                
                element.innerHTML = `
                    <span class="spinner me-2"></span>
                    Loading...
                `;
            } else {
                element.classList.remove('loading');
                element.disabled = false;
                
                const originalText = element.getAttribute('data-original-text');
                if (originalText) {
                    element.textContent = originalText;
                    element.removeAttribute('data-original-text');
                }
            }
        };
    }

    // Utility Functions
    window.BotFactory = {
        // API helper
        api: async function(endpoint, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            const config = Object.assign(defaultOptions, options);
            
            try {
                const response = await fetch(endpoint, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                
                return await response.text();
            } catch (error) {
                console.error('API Error:', error);
                showError(`API Error: ${error.message}`);
                throw error;
            }
        },
        
        // Format utilities
        formatDate: function(date, locale = 'en-US') {
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(new Date(date));
        },
        
        formatDateTime: function(date, locale = 'en-US') {
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(date));
        },
        
        formatNumber: function(number, locale = 'en-US') {
            return new Intl.NumberFormat(locale).format(number);
        },
        
        // Copy to clipboard
        copyToClipboard: async function(text) {
            try {
                await navigator.clipboard.writeText(text);
                showSuccess('Copied to clipboard!');
                return true;
            } catch (error) {
                console.error('Copy failed:', error);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    showSuccess('Copied to clipboard!');
                    return true;
                } catch (fallbackError) {
                    showError('Failed to copy to clipboard');
                    return false;
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        },
        
        // Debounce function
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function(event) {
        // Handle state changes if using pushState for navigation
        if (event.state) {
            console.log('Navigation state:', event.state);
        }
    });

    // Handle offline/online status
    window.addEventListener('online', function() {
        showSuccess('Connection restored');
    });

    window.addEventListener('offline', function() {
        showWarning('You are offline. Some features may not work.');
    });

    // Performance monitoring
    window.addEventListener('load', function() {
        if ('performance' in window) {
            const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
            console.log(`Page loaded in ${loadTime}ms`);
            
            // Log slow page loads
            if (loadTime > 3000) {
                console.warn('Slow page load detected');
            }
        }
    });

    // Error handling
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        
        // Don't show error notifications for script loading errors
        if (event.filename && event.filename.includes('.js')) {
            return;
        }
        
        showError('An unexpected error occurred. Please refresh the page.');
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showError('An error occurred while processing your request.');
    });

})();
