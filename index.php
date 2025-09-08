<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

// Redirect to dashboard if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Contabilidad de Proyectos</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>Iniciar Sesión</h1>
                <p>Accede a tu sistema de contabilidad</p>
            </div>
            
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="email">Correo Electrónico</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
            </form>
            
            <div class="auth-links">
                <a href="#" id="showRegister">¿No tienes cuenta? Regístrate</a>
                <a href="#" id="showForgotPassword">¿Olvidaste tu contraseña?</a>
            </div>
        </div>
        
        <!-- Register Form -->
        <div class="auth-card" id="registerCard" style="display: none;">
            <div class="auth-header">
                <h1>Crear Cuenta</h1>
                <p>Regístrate para comenzar</p>
            </div>
            
            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label for="reg_name">Nombre Completo</label>
                    <input type="text" id="reg_name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="reg_email">Correo Electrónico</label>
                    <input type="email" id="reg_email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="reg_password">Contraseña</label>
                    <input type="password" id="reg_password" name="password" required>
                </div>
                
                <div class="form-group">
                    <label for="confirm_password">Confirmar Contraseña</label>
                    <input type="password" id="confirm_password" name="confirm_password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Crear Cuenta</button>
            </form>
            
            <div class="auth-links">
                <a href="#" id="showLogin">¿Ya tienes cuenta? Inicia sesión</a>
            </div>
        </div>
        
        <!-- Forgot Password Form -->
        <div class="auth-card" id="forgotPasswordCard" style="display: none;">
            <div class="auth-header">
                <h1>Recuperar Contraseña</h1>
                <p>Ingresa tu correo para recuperar tu contraseña</p>
            </div>
            
            <form id="forgotPasswordForm" class="auth-form">
                <div class="form-group">
                    <label for="forgot_email">Correo Electrónico</label>
                    <input type="email" id="forgot_email" name="email" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Enviar Enlace</button>
            </form>
            
            <div class="auth-links">
                <a href="#" id="backToLogin">Volver al inicio de sesión</a>
            </div>
        </div>
    </div>
    
    <div id="messageContainer"></div>
    
    <script src="assets/js/auth.js"></script>
</body>
</html>
