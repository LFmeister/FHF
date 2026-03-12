// Dashboard JavaScript
let allActivities = [];

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadRecentActivity();

    // Set today's date as default for expense form
    const today = new Date().toISOString().split('T')[0];
    const expenseDateField = document.getElementById('expenseDate');
    if (expenseDateField) {
        expenseDateField.value = today;
    }

    // Form event listeners
    const createProjectForm = document.getElementById('createProjectForm');
    const joinProjectForm = document.getElementById('joinProjectForm');
    const addExpenseForm = document.getElementById('addExpenseForm');

    if (createProjectForm) createProjectForm.addEventListener('submit', handleCreateProject);
    if (joinProjectForm) joinProjectForm.addEventListener('submit', handleJoinProject);
    if (addExpenseForm) addExpenseForm.addEventListener('submit', handleAddExpense);

    // Logbook controls
    const searchInput = document.getElementById('activitySearch');
    const typeFilter = document.getElementById('activityTypeFilter');
    if (searchInput) searchInput.addEventListener('input', renderRecentActivity);
    if (typeFilter) typeFilter.addEventListener('change', renderRecentActivity);

    // Auto-uppercase invite code
    const inviteInput = document.getElementById('inviteCode');
    if (inviteInput) {
        inviteInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Close mobile nav on desktop resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 780) {
            closeMobileNav();
        }
    });

    const navLinks = document.querySelectorAll('#primaryNav .nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', closeMobileNav);
    });
});

// Mobile navigation
function toggleMobileNav(buttonEl) {
    const nav = document.getElementById('primaryNav');
    if (!nav) return;

    const isOpen = nav.classList.toggle('nav-open');
    if (buttonEl) {
        buttonEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

function closeMobileNav() {
    const nav = document.getElementById('primaryNav');
    const toggle = document.querySelector('.nav-toggle');
    if (nav) nav.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

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
    const totalBalanceEl = document.getElementById('totalBalance');
    const monthlyExpensesEl = document.getElementById('monthlyExpenses');
    const pendingExpensesEl = document.getElementById('pendingExpenses');

    if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(stats.totalBalance || 0);
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = formatCurrency(stats.monthlyExpenses || 0);
    if (pendingExpensesEl) pendingExpensesEl.textContent = stats.pendingExpenses || 0;
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch('api/dashboard/activity.php');
        const data = await response.json();

        if (data.success) {
            allActivities = Array.isArray(data.data) ? data.data : [];
            renderRecentActivity();
        } else {
            renderActivityEmpty('No se pudo cargar la bitacora.');
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        renderActivityEmpty('Error de conexion al cargar la bitacora.');
    }
}

// Render activity list with search and type filter
function renderRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    const filteredActivities = getFilteredActivities(allActivities);
    if (filteredActivities.length === 0) {
        renderActivityEmpty('No hay registros que coincidan con el filtro.');
        return;
    }

    const grouped = groupActivitiesByDate(filteredActivities);

    activityList.innerHTML = grouped.map(group => `
        <div class="activity-day-group fade-in">
            <span class="activity-day-label">${group.label}</span>
            <div class="activity-items">
                ${group.items.map(activity => renderActivityItem(activity)).join('')}
            </div>
        </div>
    `).join('');
}

function renderActivityItem(activity) {
    const meta = getActivityMeta(activity.action, activity.type);
    const safeTitle = escapeHtml(activity.description || 'Movimiento registrado');
    const safeUser = escapeHtml(activity.user_name || 'Usuario');
    const absoluteDate = formatAbsoluteDate(activity.created_at);
    const relativeDate = formatRelativeTime(activity.created_at);

    return `
        <div class="activity-item ${meta.type}">
            <div class="activity-marker">${meta.marker}</div>
            <div class="activity-card">
                <div class="activity-top">
                    <p class="activity-title">${safeTitle}</p>
                    <span class="activity-tag">${meta.label}</span>
                </div>
                <p class="activity-description">Por ${safeUser} · ${absoluteDate}</p>
                <span class="activity-time">${relativeDate}</span>
            </div>
        </div>
    `;
}

function renderActivityEmpty(message) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    activityList.innerHTML = `
        <div class="activity-empty">
            <strong>Bitacora sin resultados</strong>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
}

function getFilteredActivities(activities) {
    const searchValue = (document.getElementById('activitySearch')?.value || '').toLowerCase().trim();
    const selectedType = document.getElementById('activityTypeFilter')?.value || 'all';

    return activities.filter(activity => {
        const meta = getActivityMeta(activity.action, activity.type);
        const matchesType = selectedType === 'all' || meta.type === selectedType;
        if (!matchesType) return false;

        if (!searchValue) return true;

        const searchableText = [
            activity.description || '',
            activity.user_name || '',
            meta.label
        ].join(' ').toLowerCase();

        return searchableText.includes(searchValue);
    });
}

function groupActivitiesByDate(activities) {
    const groups = [];
    const mapByDate = new Map();

    activities.forEach(activity => {
        const dateKey = toDateKey(activity.created_at);
        if (!mapByDate.has(dateKey)) {
            mapByDate.set(dateKey, []);
            groups.push({
                key: dateKey,
                label: formatDayLabel(dateKey),
                items: mapByDate.get(dateKey)
            });
        }
        mapByDate.get(dateKey).push(activity);
    });

    return groups;
}

function getActivityMeta(action, fallbackType) {
    const map = {
        project_created: { type: 'project', label: 'Proyecto', marker: 'PR' },
        expense_added: { type: 'expense', label: 'Gasto', marker: 'GS' },
        balance_updated: { type: 'balance', label: 'Balance', marker: 'BL' },
        member_joined: { type: 'member', label: 'Miembro', marker: 'MB' },
        file_uploaded: { type: 'file', label: 'Archivo', marker: 'FL' }
    };

    if (map[action]) return map[action];

    const type = fallbackType || 'general';
    const labelByType = {
        project: 'Proyecto',
        expense: 'Gasto',
        balance: 'Balance',
        member: 'Miembro',
        file: 'Archivo',
        general: 'General'
    };

    return {
        type,
        label: labelByType[type] || 'General',
        marker: 'EV'
    };
}

function toDateKey(dateValue) {
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDayLabel(dateKey) {
    const target = new Date(`${dateKey}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (target.getTime() === today.getTime()) return 'Hoy';
    if (target.getTime() === yesterday.getTime()) return 'Ayer';

    return target.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatAbsoluteDate(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
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
    if (!projectSelect || projectSelect.options.length <= 1) {
        showMessage('Primero debes crear o unirte a un proyecto', 'warning');
        return;
    }
    document.getElementById('addExpenseModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';

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
            closeModal(modal.id);
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
            setTimeout(function() {
                window.location.reload();
            }, 1000);
        } else {
            showMessage(data.message || 'Error al crear el proyecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexion. Intentalo de nuevo.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle join project form submission
async function handleJoinProject(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const inviteCode = (formData.get('invite_code') || '').trim().toUpperCase();

    if (!inviteCode) {
        showFormError('inviteCode', 'El codigo de invitacion es requerido');
        return;
    }

    if (inviteCode.length !== 8) {
        showFormError('inviteCode', 'El codigo debe tener 8 caracteres');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Uniendose...';
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
            setTimeout(function() {
                window.location.reload();
            }, 1000);
        } else {
            showMessage(data.message || 'Error al unirse al proyecto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexion. Intentalo de nuevo.', 'error');
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

    if (!expenseData.project_id) {
        showFormError('expenseProject', 'Selecciona un proyecto');
        return;
    }

    if (!expenseData.title.trim()) {
        showFormError('expenseTitle', 'El titulo es requerido');
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
            loadDashboardData();
            loadRecentActivity();
        } else {
            showMessage(data.message || 'Error al agregar el gasto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexion. Intentalo de nuevo.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Logout function
async function logout() {
    if (!confirm('Estas seguro de que quieres cerrar sesion?')) return;

    try {
        const response = await fetch('api/auth/logout.php', {
            method: 'POST'
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = 'index.php';
        } else {
            showMessage('Error al cerrar sesion', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'index.php';
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
        return `Hace ${days} dia${days > 1 ? 's' : ''}`;
    }
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer') || createMessageContainer();

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        ${escapeHtml(message)}
        <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    messageContainer.appendChild(messageElement);

    setTimeout(function() {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    document.body.appendChild(container);
    return container;
}

function showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('error');
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) existingError.remove();

    field.classList.add('error');
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
    field.focus();
}

function clearFormErrors(form) {
    const errorFields = form.querySelectorAll('.error');
    const errorMessages = form.querySelectorAll('.error-message');
    errorFields.forEach(function(field) { field.classList.remove('error'); });
    errorMessages.forEach(function(message) { message.remove(); });
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Real-time form validation
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('error')) {
        e.target.classList.remove('error');
        const errorMessage = e.target.parentElement.querySelector('.error-message');
        if (errorMessage) errorMessage.remove();
    }
});
