// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    loadDashboardData();
    loadRecentActivity();
    
    // Set today's date as default for expense form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    
    // Form event listeners
    document.getElementById('createProjectForm').addEventListener('submit', handleCreateProject);
    document.getElementById('joinProjectForm').addEventListener('submit', handleJoinProject);
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
});

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch('api/dashboard/stats.php');
        const data = await response.json();
        
        if (data.success) {
            updateStatistics(data.data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update statistics display
function updateStatistics(stats) {
    document.getElementById('totalBalance').textContent = formatCurrency(stats.totalBalance || 0);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(stats.monthlyExpenses || 0);
    document.getElementById('pendingExpenses').textContent = stats.pendingExpenses || 0;
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch('api/dashboard/activity.php');
        const data = await response.json();
        
        if (data.success) {
            displayRecentActivity(data.data);
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Display recent activity
function displayRecentActivity(activities) {
    const activityList = document.querySelector('.activity-list');
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<div class="empty-state"><p>No hay actividad reciente</p></div>';
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                ${getActivityIcon(activity.action)}
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.description}</div>
                <div class="activity-time">${formatRelativeTime(activity.created_at)}</div>
            </div>
        </div>
    `).join('');
}

// Get activity icon based on action
function getActivityIcon(action) {
    const icons = {
        'project_created': '📁',
        'expense_added': '💰',
        'balance_updated': '💳',
        'member_joined': '👥',
        'file_uploaded': '📎'
    };
    return icons[action] || '📋';
}

// Modal functions
function showCreateProjectModal() {
    document.getElementById('createProjectModal').style.display = 'block';
}

function showJoinProjectModal() {
    document.getElementById('joinProjectModal').style.display = 'block';
}

function showAddExpenseModal() {
    const projectSelect = document.getElementById('expenseProject');
    if (projectSelect.options.length <= 1) {
        showMessage('Primero debes crear o unirte a un proyecto', 'warning');
        return;
    }
    document.getElementById('addExpenseModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form data
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        clearFormErrors(form);
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Handle create project form submission
async function handleCreateProject(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const projectData = {
        name: formData.get('name'),
        description: formData.get('description'),
        initial_balance: parseFloat(formData.get('initial_balance')) || 0,
        currency: formData.get('currency')
    };
    
    // Validation
    if (!projectData.name.trim()) {
        showFormError('projectName', 'El nombre del proyecto es requerido');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Creando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('api/projects/create.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Proyecto creado exitosamente', 'success');
            closeModal('createProjectModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage(data.message || 'Error al crear el proyecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle join project form submission
async function handleJoinProject(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const inviteCode = formData.get('invite_code').trim().toUpperCase();
    
    if (!inviteCode) {
        showFormError('inviteCode', 'El código de invitación es requerido');
        return;
    }
    
    if (inviteCode.length !== 8) {
        showFormError('inviteCode', 'El código debe tener 8 caracteres');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Uniéndose...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('api/projects/join.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invite_code: inviteCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Te has unido al proyecto exitosamente', 'success');
            closeModal('joinProjectModal');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage(data.message || 'Error al unirse al proyecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Inténtalo de nuevo.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
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
    if (!expenseData.project_id) {
        showFormError('expenseProject', 'Selecciona un proyecto');
        return;
    }
    
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
            loadDashboardData(); // Refresh statistics
            loadRecentActivity(); // Refresh activity
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
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
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

// Auto-uppercase invite code
document.getElementById('inviteCode').addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});
