// ==== GLOBAL VARIABLES ====
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = currentDate;

// Demo data for testing (will be replaced with Firebase data later)
let subjects = [
    { id: 1, name: 'Physics', color: '#4a6fa5' },
    { id: 2, name: 'Chemistry', color: '#e74c3c' },
    { id: 3, name: 'Mathematics', color: '#27ae60' },
    { id: 4, name: 'Biology', color: '#f39c12' },
    { id: 5, name: 'English', color: '#9b59b6' }
];

let tasks = {
    '2025-12-01': [
        { id: 1, subjectId: 1, text: 'Newton\'s Laws problems', completed: false },
        { id: 2, subjectId: 1, text: 'Optics chapter review', completed: true },
        { id: 3, subjectId: 2, text: 'Organic chemistry reactions', completed: false }
    ],
    '2025-12-02': [
        { id: 4, subjectId: 3, text: 'Calculus derivatives practice', completed: false },
        { id: 5, subjectId: 4, text: 'Cell biology chapter', completed: true }
    ],
    '2025-12-03': [
        { id: 6, subjectId: 5, text: 'Essay writing practice', completed: false }
    ]
};

let quotes = [
    "Dream in rupees; execute in minutes.",
    "Build before you boost.",
    "Energy flows where focus goes.",
    "Small steps every day lead to big results.",
    "Discipline is the bridge between goals and accomplishment.",
    "The secret of getting ahead is getting started.",
    "Your future is created by what you do today.",
    "Productivity is never an accident. It is always the result of a commitment to excellence.",
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

// ==== CALENDAR FUNCTIONS ====
function updateCalendar() {
    // Update month display
    const monthName = getMonthName(currentMonth);
    currentMonthEl.textContent = `${monthName} ${currentYear}`;

    // Update date range
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    dateRangeEl.textContent = `${monthName.substring(0, 3)} 01 - ${monthName.substring(0, 3)} ${daysInMonth}`;

    // Generate date grid
    generateDateGrid();

    // Generate days view
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

        // Check if this is today
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

        // Add click event
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
}

function createDayCard(date, dayNumber) {
    const dayName = getWeekdayName(date.getDay());
    const monthName = getMonthName(currentMonth);
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    // Get quote for this day
    const quoteIndex = dayNumber % quotes.length;

    // Get tasks for this day
    const dayTasks = tasks[dateKey] || [];
    // Group tasks by subject
    const tasksBySubject = {};
    dayTasks.forEach(task => {
        if (!tasksBySubject[task.subjectId]) {
            tasksBySubject[task.subjectId] = [];
        }
        tasksBySubject[task.subjectId].push(task);
    });

    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    dayCard.dataset.date = dateKey;

    // Create subjects HTML
    let subjectsHTML = '';
    subjects.forEach(subject => {
        const subjectTasks = tasksBySubject[subject.id] || [];
        if (subjectTasks.length > 0) {
            let tasksHTML = '';
            subjectTasks.forEach(task => {
                tasksHTML += `
                <li class="task-item ${task.completed ? 'task-completed' : ''}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                    <input type="text" class="task-text" value="${task.text}" data-task-id="${task.id}">
                    <button class="delete-task" data-task-id="${task.id}">
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
                <button class="add-task-btn" data-subject-id="${subject.id}">
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
            ${subjectsHTML || '<p style="color: #7f8c8d; text-align: center;">No tasks for today. Add some!</p>'}
        </div>
        <button class="add-subject-btn">
            <i class="fas fa-plus"></i> Add New Subject
        </button>
    `;

    return dayCard;
}

function selectDate(date) {
    selectedDate = date;

    // Update active date in grid
    document.querySelectorAll('.date-cell').forEach(cell => {
        cell.classList.remove('active');
        if (parseInt(cell.dataset.day) === date.getDate()) {
            cell.classList.add('active');
        }
    });

    // Scroll to the selected day
    const dayCard = document.querySelector(`.day-card[data-date="${getDateKey(date)}"]`);
    if (dayCard) {
        dayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==== EVENT LISTENERS ====
function setupEventListeners() {
    // Month navigation
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

    // Waitlist button
    const waitlistBtn = document.getElementById('waitlist-btn');
    const joinWaitlistBtn = document.getElementById('join-waitlist-btn');
    const waitlistEmail = document.getElementById('waitlist-email');

    if (waitlistBtn) {
        waitlistBtn.addEventListener('click', () => {
            document.getElementById('waitlist-modal').classList.add('active');
        });
    }

    if (joinWaitlistBtn && waitlistEmail) {
        joinWaitlistBtn.addEventListener('click', () => {
            const email = waitlistEmail.value.trim();
            if (email && validateEmail(email)) {
                alert(`Thank you! We'll notify you at ${email} when Planora Premium launches.`);
                document.getElementById('waitlist-modal').classList.remove('active');
                waitlistEmail.value = "";
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }

    // Close modals when clicking X
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
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

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==== INITIALIZE WHEN PAGE LOADS ====
// Note: Auth system handles DOMContentLoaded, so we don't need it here
// Just make sure initApp is called by auth system

console.log("Planora calendar system loaded!");
