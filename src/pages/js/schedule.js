document.addEventListener("DOMContentLoaded", function() {
    const scheduleContent = document.getElementById("schedule-content");

    (async function() {
        try {
            const res = await fetch('../../../data/out/generated.json');
            if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status} ${res.statusText}`);
            const scheduleData = await res.json();
            if (!Array.isArray(scheduleData)) {
                console.warn('Expected schedule JSON to be an array:', scheduleData);
                return;
            }

            // Query all the classes used in the schedule data
            const classSet = new Set();
            scheduleData.forEach(item => {
                if (item.class) {
                    classSet.add(item.class);
                }
            });

            // Load the queried classes into the <select> element
            const classSelector = document.getElementById("class-selector");
            classSet.forEach(className => {
                const option = document.createElement("option");
                option.value = className;
                option.textContent = className;
                classSelector.appendChild(option);
            });

            // Load common.json to map lesson_index -> time
            let lessonTimes = {};
            try {
                const commonRes = await fetch('../../../data/common.json');
                if (!commonRes.ok) throw new Error(`Failed to fetch common: ${commonRes.status} ${commonRes.statusText}`);
                const common = await commonRes.json();

                if (Array.isArray(common.hours)) {
                    let lessonIndex = 0;
                    common.hours.forEach(hourEntry => {
                        if (Array.isArray(hourEntry) && hourEntry.length >= 4 && hourEntry[0] === 'lesson') {
                            const startTime = hourEntry[2];
                            const endTime = hourEntry[3];
                            lessonTimes[lessonIndex] = `${startTime} - ${endTime}`;
                            lessonIndex++;
                        }
                    });
                }
            } catch (e) {
                console.warn('Could not load/parse common.json for lesson times:', e);
            }

            // Function to render schedule with given data
            function renderSchedule(data) {
                // Clear existing schedule content
                const existingContainer = scheduleContent.querySelector('.schedule-container');
                if (existingContainer) {
                    existingContainer.remove();
                }

                // Get unique lesson indices and days from the filtered data
                //const lessonIndices = [...new Set(data.map(item => item.lesson_index))].sort((a, b) => a - b);
                let lessonIndices = Object.keys(lessonTimes).map(Number).sort((a, b) => a - b);
                const maxLessonIndex = Math.max(...data.map(item => item.lesson_index));
                const lessonIndicesFiltered = lessonIndices.filter(index => index <= maxLessonIndex);
                lessonIndices = lessonIndicesFiltered;
                const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

                // Create schedule grid container
                const scheduleContainer = document.createElement("div");
                scheduleContainer.className = "schedule-container";

                const scheduleGrid = document.createElement("div");
                scheduleGrid.className = "schedule-grid";

                // Add header row
                const timeHeader = document.createElement("div");
                timeHeader.className = "time-header";
                timeHeader.textContent = "Time";
                scheduleGrid.appendChild(timeHeader);

                allDays.forEach(day => {
                    const dayHeader = document.createElement("div");
                    dayHeader.className = "day-header";
                    dayHeader.textContent = day;
                    scheduleGrid.appendChild(dayHeader);
                });

                // Add rows for each lesson time
                lessonIndices.forEach(lessonIndex => {
                    // Time slot column
                    const timeSlot = document.createElement("div");
                    timeSlot.className = "time-slot";
                    
                    const lessonIndexDiv = document.createElement("div");
                    lessonIndexDiv.className = "lesson-index";
                    lessonIndexDiv.textContent = `Lesson ${lessonIndex + 1}`;
                    
                    const timeRangeDiv = document.createElement("div");
                    timeRangeDiv.className = "time-range";
                    timeRangeDiv.textContent = lessonTimes[lessonIndex] || '';
                    
                    timeSlot.appendChild(lessonIndexDiv);
                    timeSlot.appendChild(timeRangeDiv);
                    scheduleGrid.appendChild(timeSlot);

                    // Day columns for this time slot
                    allDays.forEach(day => {
                        const cell = document.createElement("div");
                        cell.className = "schedule-cell";

                        // Find lesson for this day and time in the filtered data
                        const lesson = data.find(item => 
                            item.day === day && item.lesson_index === lessonIndex
                        );

                        if (lesson) {
                            cell.classList.add("has-lesson");
                            
                            const lessonContent = document.createElement("div");
                            lessonContent.className = "lesson-content";
                            
                            const subjectDiv = document.createElement("div");
                            subjectDiv.className = "lesson-subject";
                            subjectDiv.textContent = lesson.subject || '';
                            
                            const teacherDiv = document.createElement("div");
                            teacherDiv.className = "lesson-teacher";
                            teacherDiv.textContent = lesson.teacher || '';
                            
                            const classroomDiv = document.createElement("div");
                            classroomDiv.className = "lesson-classroom";
                            classroomDiv.textContent = lesson.classroom ? `Room ${lesson.classroom}` : '';
                            
                            lessonContent.appendChild(subjectDiv);
                            lessonContent.appendChild(teacherDiv);
                            lessonContent.appendChild(classroomDiv);
                            cell.appendChild(lessonContent);
                        }

                        scheduleGrid.appendChild(cell);
                    });
                });

                scheduleContainer.appendChild(scheduleGrid);
                scheduleContent.appendChild(scheduleContainer);
            }

            // Function to filter schedule by selected class
            function filterScheduleByClass(selectedClass) {
                const filteredData = scheduleData.filter(item => item.class === selectedClass);
                renderSchedule(filteredData);
            }

            // Event listener for class selection
            classSelector.addEventListener("change", function() {
                const selectedClass = classSelector.value;
                filterScheduleByClass(selectedClass);
            });

            // Initial render with the first class in the selector
            if (classSelector.options.length > 0) {
                classSelector.selectedIndex = 0;
                filterScheduleByClass(classSelector.options[0].value);
            }

        } catch (err) {
            console.error('Error loading schedule:', err);
        }
    })();
});

function darkModeToggle() {
    document.body.classList.toggle("dark-mode");
    
    // Save preference to localStorage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
    
    // Update button text
    const button = document.getElementById("dark-mode-toggle");
    if (button) {
        button.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    }
}

// Load dark mode preference on page load
document.addEventListener("DOMContentLoaded", function() {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
        document.body.classList.add("dark-mode");
    }
    
    // Update button text based on current mode
    const button = document.getElementById("dark-mode-toggle");
    if (button) {
        const isDarkMode = document.body.classList.contains("dark-mode");
        button.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    }
});