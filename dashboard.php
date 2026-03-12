<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

requireLogin();

$userId = $_SESSION['user_id'];
$userName = $_SESSION['user_name'] ?? 'Usuario';

// Get user's projects
$userProjects = getUserProjects($userId);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Sistema de Contabilidad</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="container nav-shell">
            <div class="d-flex justify-between align-center nav-content">
                <a href="dashboard.php" class="navbar-brand">ContaProyectos</a>
                <button type="button" class="nav-toggle" aria-label="Abrir menu" aria-expanded="false" onclick="toggleMobileNav(this)">
                    Menu
                </button>
                <ul class="navbar-nav" id="primaryNav">
                    <li><a href="dashboard.php" class="nav-link active">Dashboard</a></li>
                    <li><a href="projects.php" class="nav-link">Proyectos</a></li>
                    <li><a href="#" class="nav-link" onclick="logout()">Cerrar Sesion</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container dashboard-layout">
        <!-- Welcome Section -->
        <div class="welcome-section">
            <div class="welcome-content">
                <p class="welcome-eyebrow">Panel de control financiero</p>
                <h1>Bienvenido, <?php echo htmlspecialchars($userName); ?></h1>
                <p>Gestiona proyectos, monitorea gastos y controla tu flujo de caja en un solo lugar.</p>
            </div>
            <div class="welcome-meta">
                <div class="welcome-meta-item">
                    <span class="meta-label">Fecha de hoy</span>
                    <strong><?php echo date('d/m/Y'); ?></strong>
                </div>
                <div class="welcome-meta-item">
                    <span class="meta-label">Proyectos activos</span>
                    <strong><?php echo count($userProjects); ?></strong>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card quick-actions-card mb-4">
            <div class="card-header">
                <h3 class="card-title">Acciones Rapidas</h3>
                <p class="card-subtitle">Atajos para operar tu dia a dia sin salir del dashboard.</p>
            </div>
            <div class="quick-actions">
                <button class="btn btn-primary" onclick="showCreateProjectModal()">
                    <span class="quick-action-title">Crear Proyecto</span>
                    <span class="quick-action-subtitle">Inicia un nuevo frente de trabajo</span>
                </button>
                <button class="btn btn-secondary" onclick="showJoinProjectModal()">
                    <span class="quick-action-title">Unirse a Proyecto</span>
                    <span class="quick-action-subtitle">Ingresa con codigo de invitacion</span>
                </button>
                <button class="btn btn-success" onclick="showAddExpenseModal()">
                    <span class="quick-action-title">Agregar Gasto</span>
                    <span class="quick-action-subtitle">Registra un movimiento inmediato</span>
                </button>
            </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid mb-4">
            <div class="stat-card">
                <div class="stat-label">Proyectos Activos</div>
                <div class="stat-value" id="totalProjects"><?php echo count($userProjects); ?></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Balance Total</div>
                <div class="stat-value" id="totalBalance">$0.00</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Gastos del Mes</div>
                <div class="stat-value" id="monthlyExpenses">$0.00</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Gastos Pendientes</div>
                <div class="stat-value" id="pendingExpenses">0</div>
            </div>
        </div>

        <div class="dashboard-main-grid">
            <!-- Recent Projects -->
            <div class="card projects-panel">
                <div class="card-header">
                    <h3 class="card-title">Proyectos Recientes</h3>
                    <a href="projects.php" class="btn btn-sm btn-secondary">Ver Todos</a>
                </div>
                <div id="projectsList">
                    <?php if (empty($userProjects)): ?>
                        <div class="empty-state">
                            <p>No tienes proyectos aun</p>
                            <button class="btn btn-primary" onclick="showCreateProjectModal()">Crear tu primer proyecto</button>
                        </div>
                    <?php else: ?>
                        <div class="projects-grid">
                            <?php foreach (array_slice($userProjects, 0, 6) as $project): ?>
                                <div class="project-card" onclick="window.location.href='project.php?id=<?php echo $project['id']; ?>'">
                                    <div class="project-header">
                                        <h4><?php echo htmlspecialchars($project['name']); ?></h4>
                                        <span class="project-status <?php echo $project['status']; ?>"><?php echo ucfirst($project['status']); ?></span>
                                    </div>
                                    <p class="project-description"><?php echo htmlspecialchars($project['description'] ?? 'Sin descripcion'); ?></p>
                                    <div class="project-stats">
                                        <div class="stat">
                                            <span class="label">Balance</span>
                                            <span class="value"><?php echo formatCurrency($project['current_balance']); ?></span>
                                        </div>
                                        <div class="stat">
                                            <span class="label">Codigo</span>
                                            <span class="value"><?php echo $project['invite_code']; ?></span>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Logbook / Activity -->
            <div class="card activity-panel">
                <div class="card-header activity-head">
                    <div>
                        <h3 class="card-title">Bitacora</h3>
                        <p class="card-subtitle">Seguimiento visual de cada movimiento reciente.</p>
                    </div>
                </div>
                <div class="activity-controls">
                    <input type="search" id="activitySearch" class="form-control" placeholder="Buscar por descripcion o usuario">
                    <select id="activityTypeFilter" class="form-control">
                        <option value="all">Todos los eventos</option>
                        <option value="expense">Gastos</option>
                        <option value="balance">Balance</option>
                        <option value="project">Proyectos</option>
                        <option value="member">Miembros</option>
                        <option value="file">Archivos</option>
                        <option value="general">Otros</option>
                    </select>
                </div>
                <div id="recentActivity">
                    <div class="activity-list"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Project Modal -->
    <div id="createProjectModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Crear Nuevo Proyecto</h2>
                <button class="close" onclick="closeModal('createProjectModal')">&times;</button>
            </div>
            <form id="createProjectForm">
                <div class="form-group">
                    <label for="projectName">Nombre del Proyecto</label>
                    <input type="text" id="projectName" name="name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="projectDescription">Descripcion</label>
                    <textarea id="projectDescription" name="description" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="initialBalance">Balance Inicial</label>
                    <input type="number" id="initialBalance" name="initial_balance" class="form-control" step="0.01" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="currency">Moneda</label>
                    <select id="currency" name="currency" class="form-control">
                        <option value="USD">USD - Dolar Americano</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="MXN">MXN - Peso Mexicano</option>
                        <option value="COP">COP - Peso Colombiano</option>
                        <option value="ARS">ARS - Peso Argentino</option>
                    </select>
                </div>
                <div class="d-flex justify-between">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('createProjectModal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Proyecto</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Join Project Modal -->
    <div id="joinProjectModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Unirse a Proyecto</h2>
                <button class="close" onclick="closeModal('joinProjectModal')">&times;</button>
            </div>
            <form id="joinProjectForm">
                <div class="form-group">
                    <label for="inviteCode">Codigo de Invitacion</label>
                    <input type="text" id="inviteCode" name="invite_code" class="form-control" placeholder="Ingresa el codigo de 8 caracteres" required>
                </div>
                <div class="d-flex justify-between">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('joinProjectModal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Unirse</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Expense Modal -->
    <div id="addExpenseModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Agregar Gasto</h2>
                <button class="close" onclick="closeModal('addExpenseModal')">&times;</button>
            </div>
            <form id="addExpenseForm">
                <div class="form-group">
                    <label for="expenseProject">Proyecto</label>
                    <select id="expenseProject" name="project_id" class="form-control" required>
                        <option value="">Selecciona un proyecto</option>
                        <?php foreach ($userProjects as $project): ?>
                            <option value="<?php echo $project['id']; ?>"><?php echo htmlspecialchars($project['name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="expenseTitle">Titulo del Gasto</label>
                    <input type="text" id="expenseTitle" name="title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="expenseAmount">Monto</label>
                    <input type="number" id="expenseAmount" name="amount" class="form-control" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label for="expenseCategory">Categoria</label>
                    <input type="text" id="expenseCategory" name="category" class="form-control">
                </div>
                <div class="form-group">
                    <label for="expenseDate">Fecha</label>
                    <input type="date" id="expenseDate" name="expense_date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="expenseDescription">Descripcion</label>
                    <textarea id="expenseDescription" name="description" class="form-control" rows="3"></textarea>
                </div>
                <div class="d-flex justify-between">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addExpenseModal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Agregar Gasto</button>
                </div>
            </form>
        </div>
    </div>

    <script src="assets/js/dashboard.js"></script>
</body>
</html>
