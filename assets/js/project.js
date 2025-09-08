// Project Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize project page
    loadProjectStats();
    
    // Set today's date as default for expense form
    const today = new Date().toISOString().split('T')[0];
    const expenseDateField = document.getElementById('expenseDate');
    if (expenseDateField) {
        expenseDateField.value = today;
    }
    
    // Form event listeners
    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', handleAddExpense);
    }
    
    const uploadFileForm = document.getElementById('uploadFileForm');
    if (uploadFileForm) {
        uploadFileForm.addEventListener('submit', handleFileUpload);
    }
    
    const balanceForm = document.getElementById('balanceForm');
    if (balanceForm) {
        balanceForm.addEventListener('submit', handleBalanceAdjustment);
    }
    
    // File upload drag and drop
    setupFileUpload();
});

// Load project statistics
async function loadProjectStats() {
    try {
        const projectId = getProjectIdFromUrl();
        const response = await fetch(`api/projects/stats.php?id=${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            updateProjectStats(data.data);
        }
    } catch (error) {
        console.error('Error loading project stats:', error);
    }
}

// Update project statistics display
function updateProjectStats(stats) {
    const totalExpensesEl = document.getElementById('totalExpenses');
    const pendingExpensesEl = document.getElementById('pendingExpenses');
    
    if (totalExpensesEl) {
        totalExpensesEl.textContent = formatCurrency(stats.totalExpenses || 0);
    }
    
    if (pendingExpensesEl) {
        pendingExpensesEl.textContent = stats.pendingExpenses || 0;
    }
}

// Modal functions
function showAddExpenseModal() {
    document.getElementById('addExpenseModal').style.display = 'block';
}

function showUploadFileModal() {
    document.getElementById('uploadFileModal').style.display = 'block';
}

function showBalanceModal() {
    document.getElementById('balanceModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form data
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        clearFormErrors(form);
        
        // Clear file upload state
        if (modalId === 'uploadFileModal') {
            clearFileUpload();
        }
    }
}

// Handle add expense form submission
async function handleAddExpense(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseData = {
        project_id: formData.get('project_id'),
        title: formData.get('title'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        expense_date: formData.get('expense_date'),
        description: formData.get('description')
    };
    
    // Validation
    if (!expenseData.title.trim()) {
        showFormError('expenseTitle', 'El título es requerido');
        return;
    }
    
    if (!expenseData.amount || expenseData.amount <= 0) {
        showFormError('expenseAmount', 'El monto debe ser mayor a 0');
        return;
    }
    
    if (!expenseData.expense_date) {
        showFormError('expenseDate', 'La fecha es requerida');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Agregando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('api/expenses/create.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Gasto agregado exitosamente', 'success');
            closeModal('addExpenseModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage(data.message || 'Error al agregar el gasto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle file upload
async function handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Por favor selecciona un archivo', 'error');
        return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showMessage('El archivo es demasiado grande (máximo 10MB)', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Subiendo...';
    submitBtn.disabled = true;
    
    // Show upload progress
    showUploadProgress(0);
    
    try {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                showUploadProgress(percentComplete);
            }
        });
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    showMessage('Archivo subido exitosamente', 'success');
                    closeModal('uploadFileModal');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showMessage(data.message || 'Error al subir el archivo', 'error');
                }
            } else {
                showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            hideUploadProgress();
        };
        
        xhr.onerror = function() {
            showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            hideUploadProgress();
        };
        
        xhr.open('POST', 'api/files/upload.php');
        xhr.send(formData);
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        hideUploadProgress();
    }
}

// Handle balance adjustment
async function handleBalanceAdjustment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    let amount = parseFloat(formData.get('amount'));
    const type = formData.get('type');
    
    // For withdrawals, make amount negative
    if (type === 'withdrawal') {
        amount = -Math.abs(amount);
    }
    
    const balanceData = {
        project_id: formData.get('project_id'),
        amount: amount,
        type: type,
        description: formData.get('description'),
        reference_number: formData.get('reference_number')
    };
    
    // Validation
    if (!balanceData.description.trim()) {
        showFormError('balanceDescription', 'La descripción es requerida');
        return;
    }
    
    if (Math.abs(balanceData.amount) <= 0) {
        showFormError('balanceAmount', 'El monto debe ser mayor a 0');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Ajustando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('api/balance/adjust.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(balanceData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Balance ajustado exitosamente', 'success');
            closeModal('balanceModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage(data.message || 'Error al ajustar el balance', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Setup file upload drag and drop
function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!fileUploadArea || !fileInput) return;
    
    // Click to select file
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File selected
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            showSelectedFile(e.target.files[0]);
        }
    });
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            showSelectedFile(files[0]);
        }
    });
}

// Show selected file info
function showSelectedFile(file) {
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    // Remove existing file info
    const existingInfo = fileUploadArea.querySelector('.file-selected');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Create file info element
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-selected';
    fileInfo.innerHTML = `
        <div class="file-name">${file.name}</div>
        <div class="file-size">${formatFileSize(file.size)}</div>
    `;
    
    fileUploadArea.appendChild(fileInfo);
}

// Clear file upload
function clearFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (fileUploadArea) {
        const existingInfo = fileUploadArea.querySelector('.file-selected');
        if (existingInfo) {
            existingInfo.remove();
        }
    }
}

// Show upload progress
function showUploadProgress(percent) {
    let progressContainer = document.querySelector('.upload-progress');
    
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
            <div class="progress-text">Subiendo... 0%</div>
        `;
        
        const modal = document.getElementById('uploadFileModal');
        const form = modal.querySelector('form');
        form.appendChild(progressContainer);
    }
    
    const progressBar = progressContainer.querySelector('.progress-bar-fill');
    const progressText = progressContainer.querySelector('.progress-text');
    
    progressBar.style.width = percent + '%';
    progressText.textContent = `Subiendo... ${Math.round(percent)}%`;
}

// Hide upload progress
function hideUploadProgress() {
    const progressContainer = document.querySelector('.upload-progress');
    if (progressContainer) {
        progressContainer.remove();
    }
}

// Copy invite code to clipboard
function copyInviteCode(code) {
    navigator.clipboard.writeText(code).then(function() {
        showMessage('Código copiado al portapapeles', 'success');
    }).catch(function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Código copiado al portapapeles', 'success');
    });
}

// Logout function
async function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        try {
            const response = await fetch('api/auth/logout.php', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = 'index.php';
            } else {
                showMessage('Error al cerrar sesión', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            // Force redirect even if logout fails
            window.location.href = 'index.php';
        }
    }
}

// Utility functions
function getProjectIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer') || createMessageContainer();
    
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

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

function showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Remove existing error
    field.classList.remove('error');
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error
    field.classList.add('error');
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
    
    // Focus the field
    field.focus();
}

function clearFormErrors(form) {
    const errorFields = form.querySelectorAll('.error');
    const errorMessages = form.querySelectorAll('.error-message');
    
    errorFields.forEach(field => field.classList.remove('error'));
    errorMessages.forEach(message => message.remove());
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            const modalId = modal.id;
            closeModal(modalId);
        }
    });
});

// Real-time form validation
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('error')) {
        e.target.classList.remove('error');
        const errorMessage = e.target.parentElement.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
});
