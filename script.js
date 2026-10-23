/**
 * UniPlan - Lógica de Programación y Algoritmos de Gestión Académica (Versión Mejorada)
 */

let tasks = [];

// Selección de Elementos DOM
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

// Elementos Estadísticas
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statOverdue = document.getElementById('stat-overdue');
const progressBar = document.getElementById('progress-bar');

// Modal de Edición
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // RECOMENDACIÓN MEJORA 1: Restringir selección a fechas pasadas en el calendario
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
    document.getElementById('edit-date').min = today;

    loadTasksFromStorage();
    renderTasks();
});

// Evento: Crear Tarea
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = taskNameInput.value.trim();
    const course = courseNameInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (!validateInputs(name, course, dueDate)) {
        showAlert('Por favor, complete todos los campos requeridos.', 'error');
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        name,
        course,
        dueDate,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasksToStorage();
    
    taskForm.reset();
    showAlert('¡Tarea registrada con éxito!', 'success');
    renderTasks();
});

function validateInputs(name, course, dueDate) {
    return name !== '' && course !== '' && dueDate !== '';
}

// ALGORITMO: Ordenamiento Cronológico (Más cercana primero)
function sortTasksByDate(taskList) {
    return taskList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// RECOMENDACIÓN MEJORA 2: Filtrado y Búsqueda Dinámica por Palabras Clave
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

// Estadísticas e Indicadores
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

// Renderizado de Lista de Tareas
function renderTasks() {
    let filtered = getFilteredTasks();
    filtered = sortTasksByDate(filtered);

    tasksContainer.innerHTML = '';
    const todayStr = new Date().toISOString().split('T')[0];

    if (filtered.length === 0) {
        tasksContainer.innerHTML = `<p class="empty-msg">No se encontraron tareas registradas.</p>`;
    } else {
        filtered.forEach(task => {
            const taskCard = document.createElement('div');
            
            // Determinar si está vencida o vence pronto (dentro de las próximas 48h)
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

// RECOMENDACIÓN MEJORA 3: Edición de Tareas (Modal)
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

// Estado & Eliminación
function toggleTaskStatus(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasksToStorage();
    renderTasks();
}

function deleteTask(id) {
    if (confirm('¿Desea eliminar esta tarea definitivamente?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasksToStorage();
        renderTasks();
    }
}

// RECOMENDACIÓN MEJORA 4: Importación y Exportación de Respaldos (JSON)
function exportData() {
    if (tasks.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `uniplan_backup_${new Date().toISOString().split('T')[0]}.json`);
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
                alert('¡Datos importados con éxito!');
            } else {
                alert('El archivo no contiene un formato válido.');
            }
        } catch (err) {
            alert('Error al leer el archivo JSON.');
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// Persistencia Local
function saveTasksToStorage() {
    localStorage.setItem('uniplan_tasks', JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const stored = localStorage.getItem('uniplan_tasks');
    if (stored) {
        try { tasks = JSON.parse(stored); } catch (e) { tasks = []; }
    }
}

// Escuchadores de Filtros
filterPriority.addEventListener('change', renderTasks);
filterStatus.addEventListener('change', renderTasks);
searchInput.addEventListener('input', renderTasks);

// Utilitarios
function showAlert(msg, type) {
    formAlert.textContent = msg;
    formAlert.className = `alert alert-${type}`;
    setTimeout(() => { formAlert.className = 'alert hidden'; }, 3000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
