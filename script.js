    <!-- ==========================================================================
         LÓGICA JAVASCRIPT Y MANEJO DE MULTI-USUARIO
         ========================================================================== -->
    <script>
        /**
         * UniPlan - Lógica de Programación y Autenticación Multiusuario
         */

        // Variables de Estado en Memoria
        let currentUser = null; // Guardará { id, name, email } del usuario activo
        let tasks = [];         // Lista de tareas del usuario actualmente autenticado

        // Referencias al DOM
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const userDisplay = document.getElementById('user-display');

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

        const statTotal = document.getElementById('stat-total');
        const statPending = document.getElementById('stat-pending');
        const statCompleted = document.getElementById('stat-completed');
        const statOverdue = document.getElementById('stat-overdue');
        const progressBar = document.getElementById('progress-bar');

        const editModal = document.getElementById('edit-modal');
        const editForm = document.getElementById('edit-form');

        // INICIALIZACIÓN DE LA APLICACIÓN
        document.addEventListener('DOMContentLoaded', () => {
            // Establecer fecha mínima como HOY para evitar entregas en el pasado
            const today = new Date().toISOString().split('T')[0];
            dueDateInput.min = today;
            document.getElementById('edit-date').min = today;

            // Verificar si existe una sesión activa almacenada
            checkActiveSession();
        });

        /* ==========================================================================
           GESTIÓN DE AUTENTICACIÓN MULTI-USUARIO (SISTEMA DE CUENTAS)
           ========================================================================== */

        function switchAuthMode(mode) {
            const tabLogin = document.getElementById('tab-login');
            const tabRegister = document.getElementById('tab-register');
            
            showAuthAlert('', 'clear');

            if (mode === 'login') {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            }
        }

        // Registro de Cuenta
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim().toLowerCase();
            const password = document.getElementById('reg-password').value;

            let users = JSON.parse(localStorage.getItem('uniplan_users') || '[]');

            // Validar si el correo ya fue registrado
            if (users.some(u => u.email === email)) {
                showAuthAlert('El correo ya se encuentra registrado. Inicie sesión.', 'error', 'reg-alert');
                return;
            }

            const newUser = {
                id: 'usr_' + Date.now(),
                name,
                email,
                password // En producción real se debe encriptar/hash
            };

            users.push(newUser);
            localStorage.setItem('uniplan_users', JSON.stringify(users));

            showAuthAlert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.', 'success', 'reg-alert');
            registerForm.reset();
            setTimeout(() => switchAuthMode('login'), 1500);
        });

        // Inicio de Sesión
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;

            const users = JSON.parse(localStorage.getItem('uniplan_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                showAuthAlert('Correo o contraseña incorrectos.', 'error', 'auth-alert');
                return;
            }

            // Iniciar Sesión Exitosa
            loginForm.reset();
            setActiveSession(user);
        });

        function setActiveSession(user) {
            currentUser = { id: user.id, name: user.name, email: user.email };
            localStorage.setItem('uniplan_current_user', JSON.stringify(currentUser));
            
            // Cargar datos exclusivos de este usuario
            loadUserTasks();
            
            // Alternar Vistas
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userDisplay.textContent = `👤 ${currentUser.name}`;
            
            renderTasks();
        }

        function checkActiveSession() {
            const savedUser = localStorage.getItem('uniplan_current_user');
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    setActiveSession(user);
                } catch (e) {
                    logout();
                }
            }
        }

        function logout() {
            // Limpiar datos en memoria de la sesión actual
            currentUser = null;
            tasks = [];
            localStorage.removeItem('uniplan_current_user');

            // Limpiar interfaz y mostrar login
            appContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
            switchAuthMode('login');
        }

        function showAuthAlert(msg, type, elementId = 'auth-alert') {
            const alertBox = document.getElementById(elementId);
            if (type === 'clear') {
                alertBox.classList.add('hidden');
                return;
            }
            alertBox.textContent = msg;
            alertBox.className = `alert alert-${type}`;
            alertBox.classList.remove('hidden');
        }


        /* ==========================================================================
           GESTIÓN DE TAREAS POR USUARIO Y PERSISTENCIA AISLADA
           ========================================================================== */

        // Carga las tareas mapeadas individualmente por ID de usuario
        function loadUserTasks() {
            if (!currentUser) return;
            const storageKey = `uniplan_tasks_${currentUser.id}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    tasks = JSON.parse(stored);
                } catch (e) {
                    tasks = [];
                }
            } else {
                tasks = [];
            }
        }

        // Guarda las tareas exclusivamente en la clave del usuario activo
        function saveUserTasks() {
            if (!currentUser) return;
            const storageKey = `uniplan_tasks_${currentUser.id}`;
            localStorage.setItem(storageKey, JSON.stringify(tasks));
        }

        // Crear Tarea
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = taskNameInput.value.trim();
            const course = courseNameInput.value.trim();
            const dueDate = dueDateInput.value;
            const priority = priorityInput.value;

            if (name === '' || course === '' || dueDate === '') {
                showAlert('Por favor, complete todos los campos requeridos.', 'error');
                return;
            }

            const newTask = {
                id: 'task_' + Date.now(),
                name,
                course,
                dueDate,
                priority,
                completed: false,
                createdAt: new Date().toISOString()
            };

            tasks.push(newTask);
            saveUserTasks();
            
            taskForm.reset();
            showAlert('¡Tarea registrada con éxito!', 'success');
            renderTasks();
        });

        // Ordenar cronológicamente (más cercana primero)
        function sortTasksByDate(taskList) {
            return taskList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        }

        // Filtrado y Búsqueda en tiempo real
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

        // Actualización de Métricas Académicas
        function updateStatistics() {
            const total = tasks.length;
            const completed = tasks.filter(t => t.completed).length;
            const pending = total - completed;
            
            const todayStr = new Date().toISOString().split('T')[0];
            const overdue = tasks.filter(t => !t.completed && t.dueDate < todayStr).length;

            const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

            statTotal.textContent = total;
            statPending.textContent = pending;
            statCompleted.textContent = completed;
            statOverdue.textContent = overdue;

            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
        }

        // Renderizado Dinámico de la Lista de Tareas
        function renderTasks() {
            let filtered = getFilteredTasks();
            filtered = sortTasksByDate(filtered);

            tasksContainer.innerHTML = '';
            const todayStr = new Date().toISOString().split('T')[0];

            if (filtered.length === 0) {
                tasksContainer.innerHTML = `<p class="empty-msg">No hay tareas que coincidan con la búsqueda o selección.</p>`;
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

        // Edición de Tareas (Modal)
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

            saveUserTasks();
            closeEditModal();
            renderTasks();
        });

        // Cambiar Estado y Eliminar
        function toggleTaskStatus(id) {
            tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
            saveUserTasks();
            renderTasks();
        }

        function deleteTask(id) {
            if (confirm('¿Desea eliminar esta tarea definitivamente?')) {
                tasks = tasks.filter(t => t.id !== id);
                saveUserTasks();
                renderTasks();
            }
        }

        // Exportación e Importación de Copia de Seguridad
        function exportData() {
            if (tasks.length === 0) {
                alert('No hay tareas guardadas para exportar.');
                return;
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `uniplan_backup_${currentUser.name.replace(/\s+/g, '_')}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }

        function importData(event) {
            const fileReader = new FileReader();
            fileReader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        tasks = imported;
                        saveUserTasks();
                        renderTasks();
                        alert('¡Copia de seguridad importada con éxito!');
                    } else {
                        alert('El archivo no contiene un formato de tareas válido.');
                    }
                } catch (err) {
                    alert('Error al leer el archivo JSON.');
                }
            };
            fileReader.readAsText(event.target.files[0]);
        }

        // Escuchadores para Filtros
        filterPriority.addEventListener('change', renderTasks);
        filterStatus.addEventListener('change', renderTasks);
        searchInput.addEventListener('input', renderTasks);

        // Funciones Auxiliares
        function showAlert(msg, type) {
            formAlert.textContent = msg;
            formAlert.className = `alert alert-${type}`;
            formAlert.classList.remove('hidden');
            setTimeout(() => { formAlert.classList.add('hidden'); }, 3000);
        }

        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
        }
    </script>
</body>
</html>
