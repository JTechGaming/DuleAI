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

            // Get unique lesson indices and days
            const allLessonIndices = [...new Set(scheduleData.map(item => item.lesson_index))].sort((a, b) => a - b);
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
            allLessonIndices.forEach(lessonIndex => {
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

                    // Find lesson for this day and time
                    const lesson = scheduleData.find(item => 
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

        } catch (err) {
            console.error('Error loading schedule:', err);
        }
    })();
});

function darkModeToggle() {
    document.body.classList.toggle("dark-mode");
}