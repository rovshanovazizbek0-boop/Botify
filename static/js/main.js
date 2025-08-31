// BotFactory Main JavaScript - Mobile First

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Add smooth transition effect
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.className = `fas fa-${theme === 'light' ? 'moon' : 'sun'} theme-icon`;
    }
}

// Header Scroll Effect
function initializeHeaderScroll() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide header on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Mobile Navigation
function initializeMobileNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href.split('/')[1])) {
            item.classList.add('active');
        }
    });
}

// Card Interactions
function initializeCardInteractions() {
    const interactiveCards = document.querySelectorAll('.interactive');
    
    interactiveCards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

// File Upload Enhancement
function initializeFileUpload() {
    const fileUploads = document.querySelectorAll('.file-upload-modern');
    
    fileUploads.forEach(upload => {
        const input = upload.querySelector('input[type="file"]');
        if (!input) return;
        
        // Drag and drop functionality
        upload.addEventListener('dragover', (e) => {
            e.preventDefault();
            upload.classList.add('dragover');
        });
        
        upload.addEventListener('dragleave', () => {
            upload.classList.remove('dragover');
        });
        
        upload.addEventListener('drop', (e) => {
            e.preventDefault();
            upload.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(files[0], upload);
            }
        });
        
        // Click to upload
        upload.addEventListener('click', () => {
            input.click();
        });
        
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0], upload);
            }
        });
    });
}

function handleFileUpload(file, uploadElement) {
    const fileName = uploadElement.querySelector('.file-name');
    const fileSize = uploadElement.querySelector('.file-size');
    
    if (fileName) {
        fileName.textContent = file.name;
    }
    
    if (fileSize) {
        const size = (file.size / 1024 / 1024).toFixed(2);
        fileSize.textContent = `${size} MB`;
    }
    
    // Show loading state
    uploadElement.classList.add('uploading');
    
    // Remove loading state after a delay (replace with actual upload logic)
    setTimeout(() => {
        uploadElement.classList.remove('uploading');
        uploadElement.classList.add('uploaded');
    }, 2000);
}

// Loading States
function showLoading(element) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay show';
    loadingOverlay.innerHTML = '<div class="spinner-premium"></div>';
    
    element.style.position = 'relative';
    element.appendChild(loadingOverlay);
}

function hideLoading(element) {
    const loadingOverlay = element.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('BotFactory application initialized');
    
    // Initialize all components
    initializeTheme();
    initializeHeaderScroll();
    initializeMobileNav();
    initializeCardInteractions();
    initializeFileUpload();
    
    // Initialize Bootstrap components
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Log page load time
    window.addEventListener('load', function() {
        const loadTime = Date.now() - performance.timing.navigationStart;
        console.log(`Page loaded in ${loadTime}ms`);
    });
    
    // Prevent zoom on double tap on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// Add toast CSS if not already included
if (!document.querySelector('#toast-styles')) {
    const toastStyles = document.createElement('style');
    toastStyles.id = 'toast-styles';
    toastStyles.textContent = `
        .toast-notification {
            position: fixed;
            top: var(--space-lg);
            right: var(--space-lg);
            background: var(--card-bg);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border-color);
            padding: var(--space-md);
            display: flex;
            align-items: center;
            gap: var(--space-md);
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        }
        
        .toast-success {
            border-left: 4px solid var(--success-color);
        }
        
        .toast-error {
            border-left: 4px solid var(--danger-color);
        }
        
        .toast-warning {
            border-left: 4px solid var(--warning-color);
        }
        
        .toast-info {
            border-left: 4px solid var(--info-color);
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            flex: 1;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: var(--space-xs);
            border-radius: var(--radius-sm);
        }
        
        .toast-close:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .toast-notification {
                top: var(--space-md);
                right: var(--space-md);
                left: var(--space-md);
                min-width: auto;
            }
        }
    `;
    document.head.appendChild(toastStyles);
}