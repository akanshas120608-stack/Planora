// ==== GLOBAL VARIABLES ====
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = currentDate;
let currentUserId = null;
let pendingTaskData = null;

// Default subjects
let subjects = [
    { id: 1, name: 'Physics', color: '#4a6fa5' },
    { id: 2, name: 'Chemistry', color: '#e74c3c' },
    { id: 3, name: 'Mathematics', color: '#27ae60' },
    { id: 4, name: 'Biology', color: '#f39c12' },
    { id: 5, name: 'English', color: '#9b59b6' }
];

let tasks = {};

let quotes = [
    "Dream in rupees; execute in minutes.",
    "Build before you boost.",
    "Energy flows where focus goes.",
    "Small steps every day lead to big results.",
    "Discipline is the bridge between goals and accomplishment.",
    "The secret of getting ahead is getting started.",
    "Your future is created by what you do today.",
    "Productivity is never an accident.",
    "The way to get started is to quit talking and begin doing.",
    "Don't watch the clock; do what it does. Keep going."
];

// Mobile swipe variables (removed - causing touch issues)
// let touchStartX = 0;
// let touchEndX = 0;
let currentDayIndex = 0;

// ==== DOM ELEMENTS ====
const dateGrid = document.getElementById('date-grid');
const daysContainer = document.getElementById('days-container');
const currentMonthEl = document.getElementById('current-month');
const dateRangeEl = document.getElementById('date-range');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// ==== INITIALIZE APP ====
function initApp() {
    updateCalendar();
    setupEventListeners();
    // Removed swipe gestures - was causing mobile touch issues
    console.log('Planora initialized successfully!');
}

// ==== FIREBASE DATA FUNCTIONS ====
window.loadUserTasks = async function(userId) {
    currentUserId = userId;
    console.log('Loading tasks for user:', userId);
    
    try {
        // Load subjects
        const subjectsSnapshot = await window.dbGet(window.dbRef(window.database, `users/${userId}/subjects`));
        if (subjectsSnapshot.exists()) {
            subjects = Object.entries(subjectsSnapshot.val()).map(([id, data]) => ({
                id: parseInt(id),
                ...data
            }));
        } else {
            await saveSubjectsToFirebase(userId);
        }
        
        // Load tasks
        const tasksSnapshot = await window.dbGet(window.dbRef(window.database, `users/${userId}/tasks`));
        if (tasksSnapshot.exists()) {
            tasks = tasksSnapshot.val() || {};
        } else {
            tasks = {};
        }
        
        updateCalendar();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
};

window.clearTasks = function() {
    currentUserId = null;
    tasks = {};
    subjects = [
        { id: 1, name: 'Physics', color: '#4a6fa5' },
        { id: 2, name: 'Chemistry', color: '#e74c3c' },
        { id: 3, name: 'Mathematics', color: '#27ae60' },
        { id: 4, name: 'Biology', color: '#f39c12' },
        { id: 5, name: 'English', color: '#9b59b6' }
    ];
    updateCalendar();
};

async function saveSubjectsToFirebase(userId) {
    if (!userId) return;
    try {
        const subjectsObj = {};
        subjects.forEach(subject => {
            subjectsObj[subject.id] = {
                name: subject.name,
                color: subject.color
            };
        });
        await window.dbSet(window.dbRef(window.database, `users/${userId}/subjects`), subjectsObj);
    } catch (error) {
        console.error('Error saving subjects:', error);
    }
}

async function saveTaskToFirebase(dateKey, task) {
    if (!currentUserId) {
        alert('Please sign in to save tasks');
        return false;
    }
    try {
        await window.dbSet(
            window.dbRef(window.database, `users/${currentUserId}/tasks/${dateKey}/${task.id}`),
            task
        );
        return true;
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task');
        return false;
    }
}

async function deleteTaskFromFirebase(dateKey, taskId) {
    if (!currentUserId) return false;
    try {
        await window.dbRemove(
            window.dbRef(window.database, `users/${currentUserId}/tasks/${dateKey}/${taskId}`)
        );
        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        return false;
    }
}

// ==== SUBJECT MANAGEMENT ====
window.openManageSubjects = function() {
    if (!currentUserId) {
        alert('Please sign in to manage subjects');
        return;
    }
    renderSubjectsList();
    document.getElementById('manage-subjects-modal').classList.add('active');
};

function renderSubjectsList() {
    const subjectsList = document.getElementById('subjects-list');
    subjectsList.innerHTML = '';
    
    subjects.forEach(subject => {
        const subjectItem = document.createElement('div');
        subjectItem.className = 'subject-list-item';
        subjectItem.innerHTML = `
            <div class="subject-info">
                <div class="subject-color" style="background: ${subject.color}; width: 30px; height: 30px; border-radius: 8px;"></div>
                <span style="font-weight: 600; color: #2c3e50;">${subject.name}</span>
            </div>
            <div class="subject-actions">
                <button class="icon-btn" onclick="editSubject(${subject.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete" onclick="deleteSubject(${subject.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        subjectsList.appendChild(subjectItem);
    });
}

window.editSubject = function(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    document.getElementById('subject-modal-title').textContent = 'Edit Subject';
    document.getElementById('subject-name').value = subject.name;
    document.getElementById('subject-color').value = subject.color;
    document.getElementById('color-preview').style.background = subject.color;
    
    document.getElementById('manage-subjects-modal').classList.remove('active');
    document.getElementById('subject-modal').classList.add('active');
    
    // Store subject ID for saving
    document.getElementById('save-subject-btn').dataset.editId = subjectId;
};

window.deleteSubject = async function(subjectId) {
    if (!confirm('Delete this subject and all its tasks?')) return;
    
    subjects = subjects.filter(s => s.id !== subjectId);
    
    // Delete all tasks for this subject
    Object.keys(tasks).forEach(dateKey => {
        if (tasks[dateKey]) {
            Object.keys(tasks[dateKey]).forEach(taskId => {
                if (tasks[dateKey][taskId].subjectId === subjectId) {
                    delete tasks[dateKey][taskId];
                }
            });
        }
    });
    
    await saveSubjectsToFirebase(currentUserId);
    await window.dbSet(window.dbRef(window.database, `users/${currentUserId}/tasks`), tasks);
    
    renderSubjectsList();
    updateCalendar();
};

// ==== MODAL FUNCTIONS ====
function openAddTaskModal(dateKey, subjectId) {
    if (!currentUserId) {
        alert('Please sign in to add tasks');
        return;
    }
    
    pendingTaskData = { dateKey, subjectId };
    
    // Populate subject dropdown
    const subjectSelect = document.getElementById('task-subject-select');
    subjectSelect.innerHTML = '';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        if (subject.id === subjectId) {
            option.selected = true;
        }
        subjectSelect.appendChild(option);
    });
    
    document.getElementById('task-description').value = '';
    document.getElementById('add-task-modal').classList.add('active');
    setTimeout(() => document.getElementById('task-description').focus(), 100);
}

// ==== CALENDAR FUNCTIONS ====
function updateCalendar() {
    const monthName = getMonthName(currentMonth);
    currentMonthEl.textContent = `${monthName} ${currentYear}`;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    dateRangeEl.textContent = `${monthName.substring(0, 3)} 01 - ${monthName.substring(0, 3)} ${daysInMonth}`;

    generateDateGrid();
    generateDaysView();
}

function generateDateGrid() {
    dateGrid.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const weekday = getWeekdayName(date.getDay());

        const dateCell = document.createElement('div');
        dateCell.className = 'date-cell';
        dateCell.dataset.day = day;

        const today = new Date();
        if (currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            day === today.getDate()) {
            dateCell.classList.add('active');
            currentDayIndex = day - 1;
        }

        dateCell.innerHTML = `
            <div class="date-day">${String(day).padStart(2, '0')}</div>
            <div class="date-weekday">${weekday.substring(0, 3)}</div>
        `;

        dateCell.addEventListener('click', () => {
            selectDate(new Date(currentYear, currentMonth, day));
        });

        dateGrid.appendChild(dateCell);
    }
}

function generateDaysView() {
    daysContainer.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayCard = createDayCard(date, day);
        daysContainer.appendChild(dayCard);
    }
    
    attachDayCardListeners();
}

function createDayCard(date, dayNumber) {
    const dayName = getWeekdayName(date.getDay());
    const monthName = getMonthName(currentMonth);
    const dateKey = getDateKey(date);

    const quoteIndex = dayNumber % quotes.length;
    const dayTasks = tasks[dateKey] || {};
    
    const tasksBySubject = {};
    Object.values(dayTasks).forEach(task => {
        if (!tasksBySubject[task.subjectId]) {
            tasksBySubject[task.subjectId] = [];
        }
        tasksBySubject[task.subjectId].push(task);
    });

    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    dayCard.dataset.date = dateKey;

    let subjectsHTML = '';
    subjects.forEach(subject => {
        const subjectTasks = tasksBySubject[subject.id] || [];
        if (subjectTasks.length > 0) {
            let tasksHTML = '';
            subjectTasks.forEach(task => {
                tasksHTML += `
                <li class="task-item ${task.completed ? 'task-completed' : ''}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           data-task-id="${task.id}" data-date="${dateKey}">
                    <input type="text" class="task-text" value="${task.text}" 
                           data-task-id="${task.id}" data-date="${dateKey}">
                    <button class="delete-task" data-task-id="${task.id}" data-date="${dateKey}">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>
                `;
            });

            subjectsHTML += `
            <div class="subject-item">
                <div class="subject-header">
                    <div class="subject-title">
                        <div class="subject-color" style="background-color: ${subject.color}"></div>
                        ${subject.name}
                    </div>
                </div>
                <ul class="task-list">
                    ${tasksHTML}
                </ul>
                <button class="add-task-btn" data-subject-id="${subject.id}" data-date="${dateKey}">
                    <i class="fas fa-plus"></i> Add Task
                </button>
            </div>
            `;
        }
    });

    dayCard.innerHTML = `
        <div class="day-header">
            <div class="day-title">${dayName}</div>
            <div class="day-date">${monthName} ${dayNumber}, ${currentYear}</div>
        </div>
        <div class="day-quote">"${quotes[quoteIndex]}"</div>
        <div class="subjects-container">
            ${subjectsHTML || '<p style="color: #7f8c8d; text-align: center; margin-bottom: 15px;">No tasks for today. Click below to add!</p>'}
        </div>
        <button class="add-subject-btn" data-date="${dateKey}">
            <i class="fas fa-plus"></i> Add Task
        </button>
    `;

    return dayCard;
}

function attachDayCardListeners() {
    // Task checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const taskId = parseInt(this.dataset.taskId);
            const dateKey = this.dataset.date;
            
            if (tasks[dateKey] && tasks[dateKey][taskId]) {
                tasks[dateKey][taskId].completed = this.checked;
                await saveTaskToFirebase(dateKey, tasks[dateKey][taskId]);
                
                const taskItem = this.closest('.task-item');
                const taskText = taskItem.querySelector('.task-text');
                
                if (this.checked) {
                    taskItem.classList.add('task-completed');
                    if (taskText) taskText.style.textDecoration = 'line-through';
                } else {
                    taskItem.classList.remove('task-completed');
                    if (taskText) taskText.style.textDecoration = 'none';
                }
            }
        });
    });
    
    // Task text inputs
    document.querySelectorAll('.task-text').forEach(input => {
        input.addEventListener('blur', async function() {
            const taskId = parseInt(this.dataset.taskId);
            const dateKey = this.dataset.date;
            
            if (tasks[dateKey] && tasks[dateKey][taskId]) {
                tasks[dateKey][taskId].text = this.value;
                await saveTaskToFirebase(dateKey, tasks[dateKey][taskId]);
            }
        });
        
        // Prevent drag when editing text
        input.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        input.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-task').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.stopPropagation();
            const taskId = parseInt(this.dataset.taskId);
            const dateKey = this.dataset.date;
            
            if (confirm('Delete this task?')) {
                if (tasks[dateKey]) {
                    delete tasks[dateKey][taskId];
                    await deleteTaskFromFirebase(dateKey, taskId);
                    updateCalendar();
                }
            }
        });
    });
    
    // Add task buttons
    document.querySelectorAll('.add-task-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const subjectId = parseInt(this.dataset.subjectId);
            const dateKey = this.dataset.date;
            openAddTaskModal(dateKey, subjectId);
        });
    });
    
    // Add subject button
    document.querySelectorAll('.add-subject-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const dateKey = this.dataset.date;
            openAddTaskModal(dateKey, subjects[0].id);
        });
    });
    
    // DRAG AND DROP for tasks (desktop only)
    if (window.innerWidth > 768) {
        setupTaskDragAndDrop();
        setupDayCardDragAndDrop();
    }
}

// ==== DRAG AND DROP FUNCTIONALITY (Desktop Only) ====
function setupTaskDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(task => {
        task.setAttribute('draggable', 'true');
        
        task.addEventListener('dragstart', (e) => {
            // Only allow drag if not clicking on input or button
            if (e.target.classList.contains('task-text') || 
                e.target.classList.contains('task-checkbox') ||
                e.target.classList.contains('delete-task')) {
                e.preventDefault();
                return;
            }
            
            task.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        task.addEventListener('dragend', (e) => {
            task.classList.remove('dragging');
        });
    });
    
    const taskLists = document.querySelectorAll('.task-list');
    
    taskLists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.task-item.dragging');
            if (!dragging) return;
            
            const afterElement = getDragAfterElement(list, e.clientY);
            
            if (afterElement == null) {
                list.appendChild(dragging);
            } else {
                list.insertBefore(dragging, afterElement);
            }
        });
    });
}

function setupDayCardDragAndDrop() {
    const dayCards = document.querySelectorAll('.day-card');
    
    dayCards.forEach(card => {
        // Remove default draggable
        card.removeAttribute('draggable');
        
        const header = card.querySelector('.day-header');
        if (header) {
            header.style.cursor = 'grab';
            
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                
                card.setAttribute('draggable', 'true');
                header.style.cursor = 'grabbing';
            });
            
            header.addEventListener('mouseup', () => {
                card.removeAttribute('draggable');
                header.style.cursor = 'grab';
            });
        }
        
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            if (header) header.style.cursor = 'grab';
        });
    });
    
    const container = document.getElementById('days-container');
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.day-card.dragging');
        if (!dragging) return;
        
        const afterElement = getDragAfterElement(container, e.clientX);
        
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });
}

function getDragAfterElement(container, position) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging), .day-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = position - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function selectDate(date) {
    selectedDate = date;
    currentDayIndex = date.getDate() - 1;

    document.querySelectorAll('.date-cell').forEach(cell => {
        cell.classList.remove('active');
        if (parseInt(cell.dataset.day) === date.getDate()) {
            cell.classList.add('active');
        }
    });

    const dayCard = document.querySelector(`.day-card[data-date="${getDateKey(date)}"]`);
    if (dayCard) {
        dayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==== REMOVED SWIPE GESTURES - Was causing mobile touch sensitivity issues ====
// function setupSwipeGestures() { ... }
// function handleSwipe() { ... }

// ==== EVENT LISTENERS ====
function setupEventListeners() {
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });
    
    // Save Task Modal
    document.getElementById('save-task-btn').addEventListener('click', async () => {
        const description = document.getElementById('task-description').value.trim();
        const subjectId = parseInt(document.getElementById('task-subject-select').value);
        
        if (!description) {
            alert('Please enter a task description');
            return;
        }
        
        if (!pendingTaskData) return;
        
        const { dateKey } = pendingTaskData;
        
        if (!tasks[dateKey]) {
            tasks[dateKey] = {};
        }
        
        const taskId = Date.now();
        const newTask = {
            id: taskId,
            subjectId: subjectId,
            text: description,
            completed: false
        };
        
        tasks[dateKey][taskId] = newTask;
        const saved = await saveTaskToFirebase(dateKey, newTask);
        
        if (saved) {
            document.getElementById('add-task-modal').classList.remove('active');
            updateCalendar();
        }
    });
    
    // Subject Modal
    document.getElementById('add-new-subject-btn').addEventListener('click', () => {
        document.getElementById('subject-modal-title').textContent = 'Add New Subject';
        document.getElementById('subject-name').value = '';
        document.getElementById('subject-color').value = '#4a6fa5';
        document.getElementById('color-preview').style.background = '#4a6fa5';
        delete document.getElementById('save-subject-btn').dataset.editId;
        
        document.getElementById('manage-subjects-modal').classList.remove('active');
        document.getElementById('subject-modal').classList.add('active');
    });
    
    document.getElementById('subject-color').addEventListener('input', (e) => {
        document.getElementById('color-preview').style.background = e.target.value;
    });
    
    document.getElementById('save-subject-btn').addEventListener('click', async () => {
        const name = document.getElementById('subject-name').value.trim();
        const color = document.getElementById('subject-color').value;
        const editId = document.getElementById('save-subject-btn').dataset.editId;
        
        if (!name) {
            alert('Please enter a subject name');
            return;
        }
        
        if (editId) {
            // Edit existing
            const subject = subjects.find(s => s.id === parseInt(editId));
            if (subject) {
                subject.name = name;
                subject.color = color;
            }
        } else {
            // Add new
            const newId = subjects.length > 0 ? Math.max(...subjects.map(s => s.id)) + 1 : 1;
            subjects.push({ id: newId, name, color });
        }
        
        await saveSubjectsToFirebase(currentUserId);
        
        document.getElementById('subject-modal').classList.remove('active');
        document.getElementById('manage-subjects-modal').classList.add('active');
        renderSubjectsList();
        updateCalendar();
    });
}

// ==== HELPER FUNCTIONS ====
function getMonthName(monthIndex) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
}

function getWeekdayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

console.log("Planora app.js loaded!");
