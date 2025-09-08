// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Card elements
    const loginCard = document.querySelector('.auth-card:first-child');
    const registerCard = document.getElementById('registerCard');
    const forgotPasswordCard = document.getElementById('forgotPasswordCard');
    
    // Link elements
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const showForgotPasswordLink = document.getElementById('showForgotPassword');
    const backToLoginLink = document.getElementById('backToLogin');
    
    // Message container
    const messageContainer = document.getElementById('messageContainer');
    
    // Show/hide forms
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        showCard(registerCard);
    });
    
    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        showCard(loginCard);
    });
    
    showForgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        showCard(forgotPasswordCard);
    });
    
    backToLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        showCard(loginCard);
    });
    
    function showCard(cardToShow) {
        // Hide all cards
        loginCard.style.display = 'none';
        registerCard.style.display = 'none';
        forgotPasswordCard.style.display = 'none';
        
        // Show selected card
        cardToShow.style.display = 'block';
        
        // Clear any existing messages
        clearMessages();
    }
    
    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un correo válido', 'error');
            return;
        }
        
        if (!password) {
            showMessage('Por favor ingresa tu contraseña', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading-spinner"></span>Iniciando sesión...';
        submitBtn.disabled = true;
        
        // Make login request
        fetch('api/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Inicio de sesión exitoso', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.php';
                }, 1000);
            } else {
                showMessage(data.message || 'Error al iniciar sesión', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
    
    // Register form submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        // Validation
        if (!name.trim()) {
            showMessage('Por favor ingresa tu nombre', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un correo válido', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading-spinner"></span>Creando cuenta...';
        submitBtn.disabled = true;
        
        // Make register request
        fetch('api/auth/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Cuenta creada exitosamente. Revisa tu correo para confirmar.', 'success');
                setTimeout(() => {
                    showCard(loginCard);
                }, 2000);
            } else {
                showMessage(data.message || 'Error al crear la cuenta', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
    
    // Forgot password form submission
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(forgotPasswordForm);
        const email = formData.get('email');
        
        if (!validateEmail(email)) {
            showMessage('Por favor ingresa un correo válido', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading-spinner"></span>Enviando...';
        submitBtn.disabled = true;
        
        // Make forgot password request
        fetch('api/auth/forgot-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Se ha enviado un enlace de recuperación a tu correo', 'success');
                setTimeout(() => {
                    showCard(loginCard);
                }, 2000);
            } else {
                showMessage(data.message || 'Error al enviar el enlace', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
    
    // Password strength indicator
    const passwordInput = document.getElementById('reg_password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    function checkPasswordStrength(password) {
        const strengthIndicator = document.querySelector('.password-strength');
        if (!strengthIndicator) return;
        
        let strength = 0;
        
        // Length check
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Update indicator
        strengthIndicator.className = 'password-strength';
        if (strength < 3) {
            strengthIndicator.classList.add('weak');
        } else if (strength < 5) {
            strengthIndicator.classList.add('medium');
        } else {
            strengthIndicator.classList.add('strong');
        }
    }
    
    // Utility functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            ${message}
            <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        messageContainer.appendChild(messageElement);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }
    
    function clearMessages() {
        messageContainer.innerHTML = '';
    }
    
    // Real-time form validation
    function addRealTimeValidation() {
        const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
    }
    
    function validateField(field) {
        const value = field.value.trim();
        const fieldType = field.type;
        const fieldName = field.name;
        
        // Remove existing validation classes
        field.classList.remove('error', 'success');
        
        // Remove existing error messages
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        let isValid = true;
        let errorMessage = '';
        
        // Validation rules
        switch (fieldType) {
            case 'email':
                if (value && !validateEmail(value)) {
                    isValid = false;
                    errorMessage = 'Correo electrónico inválido';
                }
                break;
                
            case 'password':
                if (fieldName === 'password' && value && value.length < 6) {
                    isValid = false;
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                } else if (fieldName === 'confirm_password') {
                    const passwordField = document.querySelector('input[name="password"]');
                    if (value && passwordField && value !== passwordField.value) {
                        isValid = false;
                        errorMessage = 'Las contraseñas no coinciden';
                    }
                }
                break;
                
            case 'text':
                if (fieldName === 'name' && value && value.length < 2) {
                    isValid = false;
                    errorMessage = 'El nombre debe tener al menos 2 caracteres';
                }
                break;
        }
        
        // Apply validation result
        if (value) {
            if (isValid) {
                field.classList.add('success');
            } else {
                field.classList.add('error');
                const errorElement = document.createElement('span');
                errorElement.className = 'error-message';
                errorElement.textContent = errorMessage;
                field.parentElement.appendChild(errorElement);
            }
        }
    }
    
    // Initialize real-time validation
    addRealTimeValidation();
});
