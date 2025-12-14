// =======================================
// TO-DO LIST APP - JAVASCRIPT
// =======================================

/**
 * DATA STRUCTURE:
 * 
 * lists = [
 *   {
 *     id: "unique-id",
 *     name: "Work",
 *     tasks: [
 *       {
 *         id: "unique-id",
 *         title: "Task title",
 *         description: "Task description",
 *         dueDate: "2025-12-31T10:00",
 *         completed: false,
 *         createdAt: timestamp
 *       }
 *     ]
 *   }
 * ]
 */

// ===== GLOBAL STATE =====
let lists = []; // Array to store all lists
let currentListId = null; // ID of the currently selected list
let editingTaskId = null; // ID of task being edited (null if creating new)

// ===== DOM ELEMENT REFERENCES =====
// These cache references to frequently accessed DOM elements
const listsContainer = document.getElementById('lists-container');
const tasksContainer = document.getElementById('tasks-container');
const currentListTitle = document.getElementById('current-list-title');
const addListBtn = document.getElementById('add-list-btn');
const newListForm = document.getElementById('new-list-form');
const newListInput = document.getElementById('new-list-input');
const saveListBtn = document.getElementById('save-list-btn');
const cancelListBtn = document.getElementById('cancel-list-btn');
const deleteListBtn = document.getElementById('delete-list-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const taskForm = document.getElementById('task-form');
const formTitle = document.getElementById('form-title');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescInput = document.getElementById('task-desc-input');
const taskDateInput = document.getElementById('task-date-input');
const saveTaskBtn = document.getElementById('save-task-btn');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterSelect = document.getElementById('filter-select');
const taskStats = document.getElementById('task-stats');
const statsTotal = document.getElementById('stats-total');
const statsCompleted = document.getElementById('stats-completed');
const statsActive = document.getElementById('stats-active');

// ===== INITIALIZATION =====
/**
 * Initialize the app when the page loads
 */
function init() {
    loadDataFromStorage();
    setupEventListeners();
    renderLists();
    
    // Select first list if available
    if (lists.length > 0) {
        selectList(lists[0].id);
    }
}

// ===== LOCAL STORAGE FUNCTIONS =====
/**
 * Load data from browser's local storage
 * This allows data to persist between sessions
 */
function loadDataFromStorage() {
    const savedData = localStorage.getItem('todoAppData');
    if (savedData) {
        lists = JSON.parse(savedData);
    } else {
        // Create default lists if no data exists
        createDefaultLists();
    }
}

/**
 * Save data to local storage
 */
function saveDataToStorage() {
    localStorage.setItem('todoAppData', JSON.stringify(lists));
}

/**
 * Create default lists for new users
 */
function createDefaultLists() {
    lists = [
        {
            id: generateId(),
            name: 'Work',
            tasks: []
        },
        {
            id: generateId(),
            name: 'Personal',
            tasks: []
        },
        {
            id: generateId(),
            name: 'Shopping',
            tasks: []
        }
    ];
    saveDataToStorage();
}

// ===== UTILITY FUNCTIONS =====
/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if date is today, tomorrow, or overdue
    const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
        return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 0) {
        return `Overdue - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

/**
 * Check if a date is overdue
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if overdue
 */
function isOverdue(dateString) {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
}

/**
 * Check if a date is today
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if today
 */
function isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getDate() === now.getDate() &&
           date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
}

// ===== EVENT LISTENERS =====
/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // List management
    addListBtn.addEventListener('click', showNewListForm);
    saveListBtn.addEventListener('click', saveNewList);
    cancelListBtn.addEventListener('click', hideNewListForm);
    deleteListBtn.addEventListener('click', deleteCurrentList);
    
    // Task management
    addTaskBtn.addEventListener('click', showTaskForm);
    saveTaskBtn.addEventListener('click', saveTask);
    cancelTaskBtn.addEventListener('click', hideTaskForm);
    
    // Search and filters
    searchInput.addEventListener('input', renderTasks);
    sortSelect.addEventListener('change', renderTasks);
    filterSelect.addEventListener('change', renderTasks);
    
    // Handle Enter key in list input
    newListInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveNewList();
    });
    
    // Handle Enter key in task title input
    taskTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTask();
        }
    });
}

// ===== LIST MANAGEMENT FUNCTIONS =====
/**
 * Show the new list form
 */
function showNewListForm() {
    newListForm.classList.remove('hidden');
    newListInput.value = '';
    newListInput.focus();
}

/**
 * Hide the new list form
 */
function hideNewListForm() {
    newListForm.classList.add('hidden');
    newListInput.value = '';
}

/**
 * Save a new list
 */
function saveNewList() {
    const listName = newListInput.value.trim();
    
    // Validate input
    if (!listName) {
        alert('Please enter a list name');
        return;
    }
    
    // Check for duplicate names
    if (lists.some(list => list.name.toLowerCase() === listName.toLowerCase())) {
        alert('A list with this name already exists');
        return;
    }
    
    // Create new list
    const newList = {
        id: generateId(),
        name: listName,
        tasks: []
    };
    
    lists.push(newList);
    saveDataToStorage();
    renderLists();
    selectList(newList.id);
    hideNewListForm();
}

/**
 * Delete the currently selected list
 */
function deleteCurrentList() {
    if (!currentListId) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    // Confirm deletion
    const confirmMsg = `Are you sure you want to delete "${list.name}" and all its tasks?`;
    if (!confirm(confirmMsg)) return;
    
    // Remove list
    lists = lists.filter(l => l.id !== currentListId);
    saveDataToStorage();
    
    // Select another list or show empty state
    currentListId = null;
    if (lists.length > 0) {
        selectList(lists[0].id);
    } else {
        currentListTitle.textContent = 'No lists';
        tasksContainer.innerHTML = '<div class="empty-state"><p class="empty-icon">📋</p><p class="empty-text">Create a list to get started!</p></div>';
        taskStats.classList.add('hidden');
    }
    
    renderLists();
}

/**
 * Select a list to view its tasks
 * @param {string} listId - ID of the list to select
 */
function selectList(listId) {
    currentListId = listId;
    const list = lists.find(l => l.id === listId);
    
    if (list) {
        currentListTitle.textContent = list.name;
        deleteListBtn.classList.remove('hidden');
        addTaskBtn.classList.remove('hidden');
        renderLists();
        renderTasks();
        updateStats();
    }
}

/**
 * Render all lists in the sidebar
 */
function renderLists() {
    listsContainer.innerHTML = '';
    
    lists.forEach(list => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        if (list.id === currentListId) {
            listItem.classList.add('active');
        }
        
        listItem.innerHTML = `
            <span class="list-name">${escapeHtml(list.name)}</span>
            <span class="list-count">${list.tasks.length}</span>
        `;
        
        listItem.addEventListener('click', () => selectList(list.id));
        listsContainer.appendChild(listItem);
    });
}

// ===== TASK MANAGEMENT FUNCTIONS =====
/**
 * Show the task form for creating a new task
 */
function showTaskForm() {
    if (!currentListId) {
        alert('Please select a list first');
        return;
    }
    
    editingTaskId = null;
    formTitle.textContent = 'New Task';
    taskTitleInput.value = '';
    taskDescInput.value = '';
    taskDateInput.value = '';
    taskForm.classList.remove('hidden');
    taskTitleInput.focus();
}

/**
 * Hide the task form
 */
function hideTaskForm() {
    taskForm.classList.add('hidden');
    editingTaskId = null;
}

/**
 * Save a task (create new or update existing)
 */
function saveTask() {
    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    const dueDate = taskDateInput.value;
    
    // Validate input
    if (!title) {
        alert('Please enter a task title');
        taskTitleInput.focus();
        return;
    }
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    if (editingTaskId) {
        // Update existing task
        const task = list.tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.dueDate = dueDate;
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title: title,
            description: description,
            dueDate: dueDate,
            completed: false,
            createdAt: Date.now()
        };
        list.tasks.push(newTask);
    }
    
    saveDataToStorage();
    renderTasks();
    renderLists();
    updateStats();
    hideTaskForm();
}

/**
 * Edit an existing task
 * @param {string} taskId - ID of the task to edit
 */
function editTask(taskId) {
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    formTitle.textContent = 'Edit Task';
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskDateInput.value = task.dueDate || '';
    taskForm.classList.remove('hidden');
    taskTitleInput.focus();
}

/**
 * Delete a task
 * @param {string} taskId - ID of the task to delete
 */
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    list.tasks = list.tasks.filter(t => t.id !== taskId);
    saveDataToStorage();
    renderTasks();
    renderLists();
    updateStats();
}

/**
 * Toggle task completion status
 * @param {string} taskId - ID of the task to toggle
 */
function toggleTaskComplete(taskId) {
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;
    
    const task = list.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveDataToStorage();
        renderTasks();
        updateStats();
    }
}

/**
 * Get filtered and sorted tasks
 * @returns {Array} Array of filtered and sorted tasks
 */
function getFilteredTasks() {
    const list = lists.find(l => l.id === currentListId);
    if (!list) return [];
    
    let tasks = [...list.tasks];
    
    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        tasks = tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply completion filter
    const filterValue = filterSelect.value;
    if (filterValue === 'active') {
        tasks = tasks.filter(task => !task.completed);
    } else if (filterValue === 'completed') {
        tasks = tasks.filter(task => task.completed);
    }
    
    // Apply sorting
    const sortValue = sortSelect.value;
    tasks.sort((a, b) => {
        switch (sortValue) {
            case 'due-date':
                // Sort by due date (tasks without due date go to end)
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'title':
                return a.title.localeCompare(b.title);
            case 'date-created':
            default:
                return b.createdAt - a.createdAt; // Most recent first
        }
    });
    
    return tasks;
}

/**
 * Render all tasks in the current list
 */
function renderTasks() {
    if (!currentListId) {
        tasksContainer.innerHTML = '<div class="empty-state"><p class="empty-icon">📋</p><p class="empty-text">Select a list to view tasks</p></div>';
        taskStats.classList.add('hidden');
        return;
    }
    
    const tasks = getFilteredTasks();
    
    if (tasks.length === 0) {
        const list = lists.find(l => l.id === currentListId);
        const hasNoTasks = list && list.tasks.length === 0;
        const message = hasNoTasks 
            ? 'No tasks yet. Add your first task!' 
            : 'No tasks match your search or filter.';
        
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <p class="empty-icon">📋</p>
                <p class="empty-text">${message}</p>
            </div>
        `;
        return;
    }
    
    tasksContainer.innerHTML = '';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // Determine due date class
        let dueDateClass = '';
        if (task.dueDate && !task.completed) {
            if (isOverdue(task.dueDate)) {
                dueDateClass = 'overdue';
            } else if (isToday(task.dueDate)) {
                dueDateClass = 'today';
            }
        }
        
        taskItem.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        ${task.dueDate ? `<div class="task-due-date ${dueDateClass}">📅 ${formatDate(task.dueDate)}</div>` : ''}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" data-task-id="${task.id}">Edit</button>
                <button class="task-action-btn delete" data-task-id="${task.id}">Delete</button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => toggleTaskComplete(task.id));
        
        const editBtn = taskItem.querySelector('.edit');
        editBtn.addEventListener('click', () => editTask(task.id));
        
        const deleteBtn = taskItem.querySelector('.delete');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        tasksContainer.appendChild(taskItem);
    });
}

/**
 * Update task statistics display
 */
function updateStats() {
    const list = lists.find(l => l.id === currentListId);
    if (!list) {
        taskStats.classList.add('hidden');
        return;
    }
    
    const total = list.tasks.length;
    const completed = list.tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    statsTotal.textContent = `${total} task${total !== 1 ? 's' : ''}`;
    statsCompleted.textContent = `${completed} completed`;
    statsActive.textContent = `${active} active`;
    
    if (total > 0) {
        taskStats.classList.remove('hidden');
    } else {
        taskStats.classList.add('hidden');
    }
}

// ===== SECURITY =====
/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== START THE APP =====
// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);