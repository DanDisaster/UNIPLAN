/**
 * UniPlan - Lógica de Programación y Sistema Multiusuario
 */

// Estado del Sistema
let currentUser = null;
let tasks = [];

// Elementos de Autenticación
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const authAlert = document.getElementById('auth-alert');
const userDisplay = document.getElementById('user-display');

// Elementos de Tareas
const taskForm = document.getElementById('task-form');
const taskNameInput = document.getElementById('task-name');
const courseNameInput = document.getElementById('course-name');
const dueDateInput = document.getElementById('due-date');
const priorityInput = document.getElementById('priority');
const formAlert = document.getElementById('form-alert');

const tasksContainer = document.getElementById('tasks-container');
const filterPriority = document.getElementById('filter-priority');
const filterStatus = document.getElementById('filter-status');
const searchInput = document.getElementById('search-input');

// Elementos de Estadísticas
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statOverdue = document.getElementById('stat-overdue');
const progressBar = document.getElementById('progress-bar');

// Modal Edición
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
    document.getElementById('edit-date').min = today;

    checkActiveSession();
});

// --- SISTEMA MULTIUSUARIO (LOGIN / REGISTRO) ---

function switchAuthTab(tab) {
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    
    formLogin.classList.toggle('hidden', tab !== 'login');
    formRegister.classList.toggle('hidden', tab !== 'register');
    authAlert.classList.add('hidden');
}

// Registro de Usuario
formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value;

    const users = getUsersFromStorage();

    if (users.some(u => u.email === email)) {
        showAuthAlert('El usuario o correo ya está registrado.', 'error');
        return;
    }

    const newUser = { id: 'usr_' + Date.now(), name, email, pass };
    users.push(newUser);
    localStorage.setItem('uniplan_users', JSON.stringify(users));

    loginUser(newUser);
});

// Iniciar Sesión
formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    const users = getUsersFromStorage();
    const user = users.find(u => u.email === email && u.pass === pass);

    if (!user) {
        showAuthAlert('Credenciales incorrectas.', 'error');
        return;
    }

    loginUser(user);
});

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('uniplan_active_user', JSON.stringify(user));
    
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    userDisplay.innerHTML = `👤 Usuario: <strong>${user.name}</strong>`;

    loadTasksForUser();
    renderTasks();
}

function logout() {
    currentUser = null;
    tasks = [];
    localStorage.removeItem('uniplan_active_user');
    
    appScreen.classList.add('hidden');
    authScreen.classList.remove('hidden');
    formLogin.reset();
    formRegister.reset();
}

function checkActiveSession() {
    const active = localStorage.getItem('uniplan_active_user');
    if (active) {
        try {
            loginUser(JSON.parse(active));
        } catch (e) {
            logout();
        }
    }
}

function getUsersFromStorage() {
    const stored = localStorage.getItem('uniplan_users');
    return stored ? JSON.parse(stored) : [];
}

function showAuthAlert(msg, type) {
    authAlert.textContent = msg;
    authAlert.className = `alert alert-${type}`;
}

// --- GESTIÓN DE TAREAS POR USUARIO ---

function loadTasksForUser() {
    if (!currentUser) return;
    const key = `uniplan_tasks_${currentUser.id}`;
    const stored = localStorage.getItem(key);
    tasks = stored ? JSON.parse(stored) : [];
}

function saveTasksToStorage() {
    if (!currentUser) return;
    const key = `uniplan_tasks_${currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(tasks));
}

// Evento: Crear Tarea
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = taskNameInput.value.trim();
    const course = courseNameInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (name === '' || course === '' || dueDate === '') {
        showFormAlert('Por favor complete todos los campos.', 'error');
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        name,
        course,
        dueDate,
        priority,
        completed: false
    };

    tasks.push(newTask);
    saveTasksToStorage();
    
    taskForm.reset();
    showFormAlert('¡Tarea guardada exitosamente!', 'success');
    renderTasks();
});

// Ordenamiento Cronológico
function sortTasksByDate(taskList) {
    return taskList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// Filtrado y Búsqueda
function getFilteredTasks() {
    const selectedPriority = filterPriority.value;
    const selectedStatus = filterStatus.value;
    const query = searchInput.value.toLowerCase().trim();

    return tasks.filter(task => {
        const matchesPriority = (selectedPriority === 'TODAS') || (task.priority === selectedPriority);
        
        let matchesStatus = true;
        if (selectedStatus === 'PENDIENTE') matchesStatus = !task.completed;
        else if (selectedStatus === 'COMPLETADA') matchesStatus = task.completed;

        const matchesSearch = task.name.toLowerCase().includes(query) || 
                              task.course.toLowerCase().includes(query);

        return matchesPriority && matchesStatus && matchesSearch;
    });
}

// Actualizar Estadísticas
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => !t.completed && t.dueDate < today).length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    statTotal.textContent = total;
    statPending.textContent = pending;
    statCompleted.textContent = completed;
    statOverdue.textContent = overdue;

    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
}

// Renderizado de Interfaz
function renderTasks() {
    let filtered = getFilteredTasks();
    filtered = sortTasksByDate(filtered);

    tasksContainer.innerHTML = '';
    const todayStr = new Date().toISOString().split('T')[0];

    if (filtered.length === 0) {
        tasksContainer.innerHTML = `<p class="empty-msg">No hay tareas registradas para esta vista.</p>`;
    } else {
        filtered.forEach(task => {
            const taskCard = document.createElement('div');
            
            const isOverdue = !task.completed && task.dueDate < todayStr;
            const isSoon = !task.completed && !isOverdue && isDueSoon(task.dueDate);

            let statusBadge = '';
            if (isOverdue) statusBadge = `<span class="badge badge-danger">⚠️ Vencida</span>`;
            else if (isSoon) statusBadge = `<span class="badge badge-warning">⏳ Vence pronto</span>`;

            taskCard.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'is-overdue' : ''}`;
            
            taskCard.innerHTML = `
                <div class="task-info">
                    <h3 class="task-title">${escapeHTML(task.name)} ${statusBadge}</h3>
                    <p class="task-meta">📖 <strong>Curso:</strong> ${escapeHTML(task.course)} | 📅 <strong>Entrega:</strong> ${task.dueDate} | 🏷️ <strong>Prioridad:</strong> ${task.priority}</p>
                </div>
                <div class="task-actions">
                    <button onclick="toggleTaskStatus('${task.id}')" class="btn-sm btn-complete">
                        ${task.completed ? '↩️ Reactivar' : '✅ Completar'}
                    </button>
                    <button onclick="openEditModal('${task.id}')" class="btn-sm btn-edit">✏️ Editar</button>
                    <button onclick="deleteTask('${task.id}')" class="btn-sm btn-delete">🗑️ Eliminar</button>
                </div>
            `;
            tasksContainer.appendChild(taskCard);
        });
    }

    updateStatistics();
}

function isDueSoon(dueDateStr) {
    const today = new Date();
    const dueDate = new Date(dueDateStr);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
}

// Modal Edición
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('edit-id').value = task.id;
    document.getElementById('edit-name').value = task.name;
    document.getElementById('edit-course').value = task.course;
    document.getElementById('edit-date').value = task.dueDate;
    document.getElementById('edit-priority').value = task.priority;

    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
}

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    
    tasks = tasks.map(t => {
        if (t.id === id) {
            return {
                ...t,
                name: document.getElementById('edit-name').value.trim(),
                course: document.getElementById('edit-course').value.trim(),
                dueDate: document.getElementById('edit-date').value,
                priority: document.getElementById('edit-priority').value
            };
        }
        return t;
    });

    saveTasksToStorage();
    closeEditModal();
    renderTasks();
});

// Cambiar Estado & Eliminar
function toggleTaskStatus(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasksToStorage();
    renderTasks();
}

function deleteTask(id) {
    if (confirm('¿Desea eliminar esta tarea de su lista?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasksToStorage();
        renderTasks();
    }
}

// Respaldo de Datos JSON
function exportData() {
    if (tasks.length === 0) {
        alert('No hay tareas para exportar.');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `uniplan_${currentUser.email}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            if (Array.isArray(importedTasks)) {
                tasks = importedTasks;
                saveTasksToStorage();
                renderTasks();
                alert('¡Tareas importadas con éxito!');
            }
        } catch (err) {
            alert('El archivo cargado no es un JSON válido.');
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// Filtros Escuchadores
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);
searchInput.addEventListener('input', renderTasks);

// Auxiliares
function showFormAlert(msg, type) {
    formAlert.textContent = msg;
    formAlert.className = `alert alert-${type}`;
    setTimeout(() => { formAlert.className = 'alert hidden'; }, 3000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
