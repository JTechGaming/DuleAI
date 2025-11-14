// Global variables to make data accessible to import/export functions
let currentScheduleData = [];
let lessonTimes = {};

document.addEventListener("DOMContentLoaded", function() {
    const scheduleContent = document.getElementById("schedule-content");

    (async function() {
        try {
            const res = await fetch('/data/out/generated.json');
            if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status} ${res.statusText}`);
            const scheduleData = await res.json();
            currentScheduleData = scheduleData;
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
            try {
                const commonRes = await fetch('/data/common.json');
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
                const filteredData = currentScheduleData.filter(item => item.class === selectedClass);
                renderSchedule(filteredData);
            }

            // Make functions globally accessible for import functionality
            window.filterScheduleByClass = filterScheduleByClass;
            window.renderSchedule = renderSchedule;

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

async function importSchedule() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importedScheduleData = JSON.parse(text);
                
                // Validate that the imported data is an array with expected structure
                if (!Array.isArray(importedScheduleData)) {
                    throw new Error('Invalid schedule format: Expected an array of schedule items');
                }
                
                // Basic validation of schedule items
                const hasValidStructure = importedScheduleData.every(item => 
                    item.hasOwnProperty('subject') && 
                    item.hasOwnProperty('teacher') && 
                    item.hasOwnProperty('class') && 
                    item.hasOwnProperty('day') && 
                    item.hasOwnProperty('lesson_index') && 
                    item.hasOwnProperty('classroom')
                );
                
                if (!hasValidStructure) {
                    throw new Error('Invalid schedule format: Items missing required properties (subject, teacher, class, day, lesson_index, classroom)');
                }
                
                // Update the global variable
                currentScheduleData = importedScheduleData;
                
                // Clear and rebuild the class selector
                const classSelector = document.getElementById("class-selector");
                const classSet = new Set();
                importedScheduleData.forEach(item => {
                    if (item.class) {
                        classSet.add(item.class);
                    }
                });
                
                // Clear existing options
                classSelector.innerHTML = '';
                
                // Add new class options
                classSet.forEach(className => {
                    const option = document.createElement("option");
                    option.value = className;
                    option.textContent = className;
                    classSelector.appendChild(option);
                });
                
                // Trigger the change event to re-render with the first class
                if (classSelector.options.length > 0) {
                    classSelector.selectedIndex = 0;
                    // Dispatch a change event to trigger the existing event handler
                    classSelector.dispatchEvent(new Event('change'));
                }
                
                alert('Schedule imported and displayed successfully!');
                
            } catch (parseError) {
                console.error('Error parsing imported file:', parseError);
                alert('Failed to import schedule: ' + parseError.message);
            }
        };
        input.click();
    } catch (e) {
        console.error('Error importing schedule:', e);
        alert('Failed to import schedule: ' + e.message);
    }
}

async function exportSchedule() {
    try {
        const res = await fetch('/data/out/generated.json');
        if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status} ${res.statusText}`);
        const scheduleData = await res.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scheduleData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "exported_schedule.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('Schedule exported successfully!');
    } catch (e) {
        console.error('Error exporting schedule:', e);
        alert('Failed to export schedule: ' + e.message);
    }
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function downloadScheduleAsPDF() {
    try {
        // Load jsPDF dynamically if not already loaded
        if (!window.jspdf || !window.jspdf.jsPDF) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        // Load html2canvas dynamically if not already loaded
        if (!window.html2canvas) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        const { jsPDF } = window.jspdf;
        const scheduleContent = document.getElementById("schedule-content");
        const pdf = new jsPDF('landscape', 'pt', 'a4');

        // Use html2canvas to capture the schedule content
        const canvas = await html2canvas(scheduleContent, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('schedule.pdf');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF: ' + error.message);
    }
}