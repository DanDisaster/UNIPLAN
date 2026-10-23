/* Variables Globales y Reset */
:root {
    --primary-color: #2b5ce7;
    --primary-hover: #1e42a8;
    --bg-color: #f4f6f9;
    --card-bg: #ffffff;
    --text-color: #2d3748;
    --text-muted: #718096;
    --border-color: #e2e8f0;
    
    --priority-high: #e53e3e;
    --priority-medium: #dd6b20;
    --priority-low: #38a169;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    line-height: 1.6;
}

.container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
}

.hidden {
    display: none !important;
}

/* Pantalla de Autenticación (Login / Registro) */
.auth-wrapper {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    padding: 20px;
}

.auth-card {
    background: white;
    width: 100%;
    max-width: 400px;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.auth-header {
    text-align: center;
    margin-bottom: 20px;
}

.auth-header h1 {
    color: var(--primary-color);
    font-size: 2rem;
}

.auth-header p {
    font-size: 0.9rem;
    color: var(--text-muted);
}

.auth-tabs {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--border-color);
}

.tab-btn {
    flex: 1;
    padding: 10px;
    border: none;
    background: none;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
}

.tab-btn.active {
    color: var(--primary-color);
    border-bottom: 2px solid var(--primary-color);
}

.auth-form .form-group {
    margin-bottom: 15px;
}

/* Header de la Aplicación */
.header {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    padding: 20px 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}

.user-session-bar {
    display: flex;
    align-items: center;
    gap: 15px;
}

.btn-head {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.4);
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
}

.btn-head:hover {
    background: rgba(255, 255, 255, 0.35);
}

.backup-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-bottom: 15px;
}

.btn-head-dark {
    background: #e2e8f0;
    color: #2d3748;
    border: 1px solid #cbd5e0;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
}

.label-file {
    display: inline-block;
}

/* Tablero de Métricas */
.main-content {
    margin-top: 25px;
    margin-bottom: 40px;
}

.stats-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 15px;
    margin: 15px 0;
    text-align: center;
}

.stat-box {
    background: #f8fafc;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.stat-number {
    display: block;
    font-size: 1.8rem;
    font-weight: bold;
}

.stat-label {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.text-pending { color: var(--priority-medium); }
.text-success { color: var(--priority-low); }
.text-danger { color: var(--priority-high); }

.progress-bar-container {
    background: #edf2f7;
    border-radius: 10px;
    height: 20px;
    overflow: hidden;
}

.progress-bar {
    background: var(--primary-color);
    height: 100%;
    width: 0%;
    color: white;
    font-size: 0.75rem;
    line-height: 20px;
    text-align: center;
    transition: width 0.4s ease;
}

/* Layout Dashboard */
.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1.6fr;
    gap: 25px;
}

@media (max-width: 850px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}

.card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* Formularios e Inputs */
.form-group {
    margin-bottom: 18px;
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
    font-size: 0.9rem;
}

.form-group input, .form-group select, .search-box input, .filter-controls select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.95rem;
}

.btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-hover);
}

/* Alertas */
.alert {
    padding: 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-top: 15px;
}
.alert-error { background: #fed7d7; color: #9b2c2c; }
.alert-success { background: #c6f6d5; color: #22543d; }

/* Controles de Lista y Búsqueda */
.search-box {
    margin: 12px 0;
}

.filter-controls {
    display: flex;
    gap: 10px;
}

.tasks-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 15px;
}

/* Tarjetas de Tareas */
.task-item {
    border: 1px solid var(--border-color);
    border-left: 5px solid var(--border-color);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
}

.task-item.priority-Alta { border-left-color: var(--priority-high); }
.task-item.priority-Media { border-left-color: var(--priority-medium); }
.task-item.priority-Baja { border-left-color: var(--priority-low); }

.task-item.completed {
    opacity: 0.6;
    background: #f7fafc;
}

.task-item.completed .task-title {
    text-decoration: line-through;
}

.task-item.is-overdue {
    background-color: #fff5f5;
    border-right: 3px solid var(--priority-high);
}

.task-info h3 {
    font-size: 1.05rem;
    margin-bottom: 4px;
}

.task-meta {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
}
.badge-danger { background-color: #fed7d7; color: #9b2c2c; }
.badge-warning { background-color: #feebc8; color: #9c4221; }

.task-actions {
    display: flex;
    gap: 6px;
}

.btn-sm {
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
}

.btn-complete { background: #e6fffa; color: #234e52; }
.btn-edit { background: #ebf8ff; color: #2b6cb0; }
.btn-delete { background: #fff5f5; color: #9b2c2c; }

.empty-msg {
    text-align: center;
    color: var(--text-muted);
    padding: 30px 0;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 12px;
    width: 90%;
    max-width: 450px;
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.btn-secondary { background: #e2e8f0; color: #4a5568; }

.footer {
    text-align: center;
    padding: 20px;
    color: var(--text-muted);
    font-size: 0.85rem;
    border-top: 1px solid var(--border-color);
}
