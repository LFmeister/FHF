<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

requireLogin();

$projectId = $_GET['id'] ?? '';
$userId = $_SESSION['user_id'];

if (empty($projectId)) {
    header('Location: dashboard.php');
    exit();
}

// Verify user has access to this project
if (!isProjectMember($userId, $projectId)) {
    header('Location: dashboard.php');
    exit();
}

// Get project details
$project = getProjectById($projectId);
if (!$project) {
    header('Location: dashboard.php');
    exit();
}

// Get project members
$membersResponse = $db->makeRequest(
    "project_members?select=*,users(name,email)&project_id=eq.$projectId",
    'GET'
);
$members = $membersResponse['status'] === 200 ? $membersResponse['data'] : [];

// Get recent expenses
$expensesResponse = $db->makeRequest(
    "expenses?select=*,users(name)&project_id=eq.$projectId&order=created_at.desc&limit=10",
    'GET'
);
$expenses = $expensesResponse['status'] === 200 ? $expensesResponse['data'] : [];

// Get balance adjustments
$balanceResponse = $db->makeRequest(
    "balance_adjustments?select=*,users(name)&project_id=eq.$projectId&order=created_at.desc&limit=5",
    'GET'
);
$balanceAdjustments = $balanceResponse['status'] === 200 ? $balanceResponse['data'] : [];

$isOwner = $project['owner_id'] === $userId;
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($project['name']); ?> - ContaProyectos</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/project.css">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="container">
            <div class="d-flex justify-between align-center">
                <a href="dashboard.php" class="navbar-brand">ContaProyectos</a>
                <ul class="navbar-nav">
                    <li><a href="dashboard.php" class="nav-link">Dashboard</a></li>
                    <li><a href="projects.php" class="nav-link">Proyectos</a></li>
                    <li><a href="#" class="nav-link" onclick="logout()">Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container">
        <!-- Project Header -->
        <div class="project-header-section">
            <div class="d-flex justify-between align-center">
                <div>
                    <h1><?php echo htmlspecialchars($project['name']); ?></h1>
                    <p class="project-description"><?php echo htmlspecialchars($project['description'] ?? 'Sin descripción'); ?></p>
                    <div class="project-meta">
                        <span class="meta-item">
                            <strong>Código de invitación:</strong> 
                            <span class="invite-code" onclick="copyInviteCode('<?php echo $project['invite_code']; ?>')"><?php echo $project['invite_code']; ?></span>
                        </span>
                        <span class="meta-item">
                            <strong>Moneda:</strong> <?php echo $project['currency']; ?>
                        </span>
                        <span class="meta-item">
                            <strong>Estado:</strong> 
                            <span class="status-badge <?php echo $project['status']; ?>"><?php echo ucfirst($project['status']); ?></span>
                        </span>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-success" onclick="showAddExpenseModal()">Agregar Gasto</button>
                    <button class="btn btn-secondary" onclick="showUploadFileModal()">Subir Archivo</button>
                    <?php if ($isOwner): ?>
                        <button class="btn btn-primary" onclick="showBalanceModal()">Ajustar Balance</button>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Project Statistics -->
        <div class="stats-grid mb-4">
            <div class="stat-card">
                <div class="stat-value"><?php echo formatCurrency($project['current_balance']); ?></div>
                <div class="stat-label">Balance Actual</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalExpenses">$0.00</div>
                <div class="stat-label">Total Gastos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?php echo count($members); ?></div>
                <div class="stat-label">Miembros</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="pendingExpenses">0</div>
                <div class="stat-label">Gastos Pendientes</div>
            </div>
        </div>

        <div class="row">
            <!-- Recent Expenses -->
            <div class="col-8">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Gastos Recientes</h3>
                        <button class="btn btn-sm btn-success" onclick="showAddExpenseModal()">Agregar Gasto</button>
                    </div>
                    <div class="expenses-list">
                        <?php if (empty($expenses)): ?>
                            <div class="empty-state">
                                <p>No hay gastos registrados</p>
                                <button class="btn btn-success" onclick="showAddExpenseModal()">Agregar primer gasto</button>
                            </div>
                        <?php else: ?>
                            <?php foreach ($expenses as $expense): ?>
                                <div class="expense-item" data-expense-id="<?php echo $expense['id']; ?>">
                                    <div class="expense-info">
                                        <div class="expense-title"><?php echo htmlspecialchars($expense['title']); ?></div>
                                        <div class="expense-meta">
                                            <span><?php echo htmlspecialchars($expense['users']['name'] ?? 'Usuario'); ?></span>
                                            <span><?php echo formatDate($expense['expense_date']); ?></span>
                                            <?php if ($expense['category']): ?>
                                                <span class="category-tag"><?php echo htmlspecialchars($expense['category']); ?></span>
                                            <?php endif; ?>
                                        </div>
                                        <?php if ($expense['description']): ?>
                                            <div class="expense-description"><?php echo htmlspecialchars($expense['description']); ?></div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="expense-amount">
                                        <span class="amount"><?php echo formatCurrency($expense['amount']); ?></span>
                                        <span class="status-badge <?php echo $expense['status']; ?>"><?php echo ucfirst($expense['status']); ?></span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Project Sidebar -->
            <div class="col-4">
                <!-- Members -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h3 class="card-title">Miembros (<?php echo count($members); ?>)</h3>
                    </div>
                    <div class="members-list">
                        <?php foreach ($members as $member): ?>
                            <div class="member-item">
                                <div class="member-info">
                                    <div class="member-name"><?php echo htmlspecialchars($member['users']['name'] ?? 'Usuario'); ?></div>
                                    <div class="member-email"><?php echo htmlspecialchars($member['users']['email'] ?? ''); ?></div>
                                </div>
                                <div class="member-role">
                                    <span class="role-badge <?php echo $member['role']; ?>"><?php echo ucfirst($member['role']); ?></span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Balance History -->
                <?php if (!empty($balanceAdjustments)): ?>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Historial de Balance</h3>
                    </div>
                    <div class="balance-history">
                        <?php foreach ($balanceAdjustments as $adjustment): ?>
                            <div class="balance-item">
                                <div class="balance-info">
                                    <div class="balance-type"><?php echo ucfirst($adjustment['type']); ?></div>
                                    <div class="balance-user"><?php echo htmlspecialchars($adjustment['users']['name'] ?? 'Usuario'); ?></div>
                                    <div class="balance-date"><?php echo formatDate($adjustment['created_at']); ?></div>
                                </div>
                                <div class="balance-amount <?php echo $adjustment['amount'] >= 0 ? 'positive' : 'negative'; ?>">
                                    <?php echo ($adjustment['amount'] >= 0 ? '+' : '') . formatCurrency($adjustment['amount']); ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
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
                <input type="hidden" name="project_id" value="<?php echo $projectId; ?>">
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
                    <button type="submit" class="btn btn-success">Agregar Gasto</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Upload File Modal -->
    <div id="uploadFileModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Subir Archivo</h2>
                <button class="close" onclick="closeModal('uploadFileModal')">&times;</button>
            </div>
            <form id="uploadFileForm" enctype="multipart/form-data">
                <input type="hidden" name="project_id" value="<?php echo $projectId; ?>">
                <div class="form-group">
                    <label for="fileInput">Seleccionar Archivo</label>
                    <div class="file-upload" id="fileUploadArea">
                        <div class="file-upload-icon">📎</div>
                        <div class="file-upload-text">
                            <p>Arrastra y suelta un archivo aquí o haz clic para seleccionar</p>
                            <small>Archivos permitidos: imágenes, videos, documentos (máx. 10MB)</small>
                        </div>
                        <input type="file" id="fileInput" name="file" accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" style="display: none;">
                    </div>
                </div>
                <div class="form-group">
                    <label for="expenseSelect">Asociar a Gasto (Opcional)</label>
                    <select id="expenseSelect" name="expense_id" class="form-control">
                        <option value="">Sin asociar</option>
                        <?php foreach ($expenses as $expense): ?>
                            <option value="<?php echo $expense['id']; ?>"><?php echo htmlspecialchars($expense['title']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="d-flex justify-between">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('uploadFileModal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Subir Archivo</button>
                </div>
            </form>
        </div>
    </div>

    <?php if ($isOwner): ?>
    <!-- Balance Adjustment Modal -->
    <div id="balanceModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Ajustar Balance</h2>
                <button class="close" onclick="closeModal('balanceModal')">&times;</button>
            </div>
            <form id="balanceForm">
                <input type="hidden" name="project_id" value="<?php echo $projectId; ?>">
                <div class="form-group">
                    <label for="balanceType">Tipo de Ajuste</label>
                    <select id="balanceType" name="type" class="form-control" required>
                        <option value="deposit">Depósito</option>
                        <option value="withdrawal">Retiro</option>
                        <option value="adjustment">Ajuste</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="balanceAmount">Monto</label>
                    <input type="number" id="balanceAmount" name="amount" class="form-control" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label for="balanceDescription">Descripción</label>
                    <textarea id="balanceDescription" name="description" class="form-control" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="referenceNumber">Número de Referencia (Opcional)</label>
                    <input type="text" id="referenceNumber" name="reference_number" class="form-control">
                </div>
                <div class="d-flex justify-between">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('balanceModal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Ajustar Balance</button>
                </div>
            </form>
        </div>
    </div>
    <?php endif; ?>

    <script src="assets/js/project.js"></script>
</body>
</html>
