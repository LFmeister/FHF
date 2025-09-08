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
        <div class="container">
            <div class="d-flex justify-between align-center">
                <a href="dashboard.php" class="navbar-brand">ContaProyectos</a>
                <ul class="navbar-nav">
                    <li><a href="dashboard.php" class="nav-link active">Dashboard</a></li>
                    <li><a href="projects.php" class="nav-link">Proyectos</a></li>
                    <li><a href="#" class="nav-link" onclick="logout()">Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container">
        <!-- Welcome Section -->
        <div class="welcome-section">
            <h1>Bienvenido, <?php echo htmlspecialchars($userName); ?></h1>
            <p>Gestiona tus proyectos de contabilidad de manera eficiente</p>
        </div>

        <!-- Quick Actions -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Acciones Rápidas</h3>
                    </div>
                    <div class="quick-actions">
                        <button class="btn btn-primary" onclick="showCreateProjectModal()">
                            <span class="icon">+</span>
                            Crear Proyecto
                        </button>
                        <button class="btn btn-secondary" onclick="showJoinProjectModal()">
                            <span class="icon">🔗</span>
                            Unirse a Proyecto
                        </button>
                        <button class="btn btn-success" onclick="showAddExpenseModal()">
                            <span class="icon">💰</span>
                            Agregar Gasto
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid mb-4">
            <div class="stat-card">
                <div class="stat-value" id="totalProjects"><?php echo count($userProjects); ?></div>
                <div class="stat-label">Proyectos Activos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalBalance">$0.00</div>
                <div class="stat-label">Balance Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="monthlyExpenses">$0.00</div>
                <div class="stat-label">Gastos del Mes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="pendingExpenses">0</div>
                <div class="stat-label">Gastos Pendientes</div>
            </div>
        </div>

        <!-- Recent Projects -->
        <div class="row">
            <div class="col-8">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Proyectos Recientes</h3>
                        <a href="projects.php" class="btn btn-sm btn-secondary">Ver Todos</a>
                    </div>
                    <div id="projectsList">
                        <?php if (empty($userProjects)): ?>
                            <div class="empty-state">
                                <p>No tienes proyectos aún</p>
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
                                        <p class="project-description"><?php echo htmlspecialchars($project['description'] ?? 'Sin descripción'); ?></p>
                                        <div class="project-stats">
                                            <div class="stat">
                                                <span class="label">Balance:</span>
                                                <span class="value"><?php echo formatCurrency($project['current_balance']); ?></span>
                                            </div>
                                            <div class="stat">
                                                <span class="label">Código:</span>
                                                <span class="value"><?php echo $project['invite_code']; ?></span>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="col-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Actividad Reciente</h3>
                    </div>
                    <div id="recentActivity">
                        <div class="activity-list">
                            <!-- Activity items will be loaded via JavaScript -->
                        </div>
                    </div>
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
                    <label for="projectDescription">Descripción</label>
                    <textarea id="projectDescription" name="description" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="initialBalance">Balance Inicial</label>
                    <input type="number" id="initialBalance" name="initial_balance" class="form-control" step="0.01" min="0" value="0">
                </div>
                <div class="form-group">
                    <label for="currency">Moneda</label>
                    <select id="currency" name="currency" class="form-control">
                        <option value="USD">USD - Dólar Americano</option>
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
                    <label for="inviteCode">Código de Invitación</label>
                    <input type="text" id="inviteCode" name="invite_code" class="form-control" placeholder="Ingresa el código de 8 caracteres" required>
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
                    <label for="expenseTitle">Título del Gasto</label>
                    <input type="text" id="expenseTitle" name="title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="expenseAmount">Monto</label>
                    <input type="number" id="expenseAmount" name="amount" class="form-control" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label for="expenseCategory">Categoría</label>
                    <input type="text" id="expenseCategory" name="category" class="form-control">
                </div>
                <div class="form-group">
                    <label for="expenseDate">Fecha</label>
                    <input type="date" id="expenseDate" name="expense_date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="expenseDescription">Descripción</label>
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
