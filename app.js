// ==== GLOBAL VARIABLES ====
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = currentDate;
let currentUserId = null;

// Default subjects (for new users)
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
            // Save default subjects for new user
            await saveSubjectsToFirebase(userId);
        }
        
        // Load tasks
        const tasksSnapshot = await window.dbGet(window.dbRef(window.database, `users/${userId}/tasks`));
        if (tasksSnapshot.exists()) {
            tasks = tasksSnapshot.val() || {};
        } else {
            tasks = {};
        }
        
        // Refresh calendar
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
    
    // Add event listeners after creating all cards
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
            ${subjectsHTML || '<p style="color: #7f8c8d; text-align: center;">No tasks for today. Add some below!</p>'}
        </div>
    `;

    // Add "Add Task" buttons for subjects without tasks
    subjects.forEach(subject => {
        const subjectTasks = tasksBySubject[subject.id] || [];
        if (subjectTasks.length === 0) {
            const subjectsContainer = dayCard.querySelector('.subjects-container');
            const addBtn = document.createElement('button');
            addBtn.className = 'add-task-btn';
            addBtn.dataset.subjectId = subject.id;
            addBtn.dataset.date = dateKey;
            addBtn.innerHTML = `<i class="fas fa-plus"></i> Add ${subject.name} Task`;
            subjectsContainer.appendChild(addBtn);
        }
    });

    return dayCard;
}

function attachDayCardListeners() {
    // Task checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            const taskId = parseInt(this.dataset.taskId);
            const dateKey = this.dataset.date;
            
            if (tasks[dateKey] && tasks[dateKey][taskId]) {
                tasks[dateKey][taskId].completed = this.checked;
                await saveTaskToFirebase(dateKey, tasks[dateKey][taskId]);
                
                const taskItem = this.closest('.task-item');
                if (this.checked) {
                    taskItem.classList.add('task-completed');
                } else {
                    taskItem.classList.remove('task-completed');
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
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-task').forEach(button => {
        button.addEventListener('click', async function() {
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
        button.addEventListener('click', function() {
            const subjectId = parseInt(this.dataset.subjectId);
            const dateKey = this.dataset.date;
            addNewTask(dateKey, subjectId);
        });
    });
}

async function addNewTask(dateKey, subjectId) {
    if (!currentUserId) {
        alert('Please sign in to add tasks');
        return;
    }
    
    const taskText = prompt('Enter task description:');
    if (!taskText) return;
    
    if (!tasks[dateKey]) {
        tasks[dateKey] = {};
    }
    
    const taskId = Date.now();
    const newTask = {
        id: taskId,
        subjectId: subjectId,
        text: taskText,
        completed: false
    };
    
    tasks[dateKey][taskId] = newTask;
    const saved = await saveTaskToFirebase(dateKey, newTask);
    
    if (saved) {
        updateCalendar();
    }
}

function selectDate(date) {
    selectedDate = date;

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
