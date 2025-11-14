// Global data storage
let formData = {
    subjects: [],
    teachers: [],
    classrooms: [],
    classes: [],
    scheduleHours: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    },
    fixedHours: []
};

// Saved configurations management
let savedConfigurations = [];
let currentConfigName = null;

// Initialize the form when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - initializing form');
    
    // Load saved configurations from localStorage
    loadSavedConfigurations();
    console.log('Loaded', savedConfigurations.length, 'saved configurations');
    
    initializeEmptyForm();
    
    // Set up initial tab
    showTab('subjects');
    
    // Update saved configurations dropdown - with retry mechanism
    updateSavedConfigsDropdown();

    refreshDropdown();
});

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Subject management
function addSubject() {
    const container = document.getElementById('subjects-container');
    const index = formData.subjects.length;
    
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'form-item';
    subjectDiv.innerHTML = `
        <div class="form-item-header">
            <h4>Subject ${index + 1}</h4>
            <button type="button" class="remove-btn" onclick="removeSubject(${index})">×</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Subject Name:</label>
                <input type="text" id="subject-name-${index}" placeholder="e.g., Mathematics" required>
            </div>
            <div class="form-group">
                <label>Abbreviation:</label>
                <input type="text" id="subject-abbr-${index}" placeholder="e.g., MATH" maxlength="5" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Required Hours per Week:</label>
                <input type="number" id="subject-hours-${index}" min="1" max="10" value="2" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="subject-core-${index}"> Core Subject
                </label>
            </div>
        </div>
    `;
    
    container.appendChild(subjectDiv);
    formData.subjects.push({});
}

function removeSubject(index) {
    const container = document.getElementById('subjects-container');
    container.children[index].remove();
    formData.subjects.splice(index, 1);
    refreshSubjectIndices();
}

function clearSubjects() {
    document.getElementById('subjects-container').innerHTML = '';
    formData.subjects = [];
}

function refreshSubjectIndices() {
    const items = document.querySelectorAll('#subjects-container .form-item');
    items.forEach((item, index) => {
        item.querySelector('h4').textContent = `Subject ${index + 1}`;
        item.querySelector('.remove-btn').onclick = () => removeSubject(index);
    });
}

// Teacher management
function addTeacher() {
    const container = document.getElementById('teachers-container');
    const index = formData.teachers.length;
    
    const teacherDiv = document.createElement('div');
    teacherDiv.className = 'form-item';
    teacherDiv.innerHTML = `
        <div class="form-item-header">
            <h4>Teacher ${index + 1}</h4>
            <button type="button" class="remove-btn" onclick="removeTeacher(${index})">×</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Full Name:</label>
                <input type="text" id="teacher-name-${index}" placeholder="e.g., John Smith" required>
            </div>
            <div class="form-group">
                <label>Abbreviation:</label>
                <input type="text" id="teacher-abbr-${index}" placeholder="e.g., JS" maxlength="3" required>
            </div>
        </div>
        <div class="form-group">
            <label>Subjects (comma-separated):</label>
            <input type="text" id="teacher-subjects-${index}" placeholder="e.g., Math, Physics" required>
        </div>
        <div class="availability-section">
            <h5>Availability:</h5>
            <div class="availability-grid">
                ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => `
                    <div class="day-availability">
                        <label>${day.charAt(0).toUpperCase() + day.slice(1)}:</label>
                        <div class="time-slots-checkboxes">
                            ${Array.from({length: 9}, (_, i) => `
                                <label class="checkbox-label">
                                    <input type="checkbox" id="teacher-${index}-${day}-${i + 1}" value="${i + 1}">
                                    ${i + 1}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.appendChild(teacherDiv);
    formData.teachers.push({});
}

function removeTeacher(index) {
    const container = document.getElementById('teachers-container');
    container.children[index].remove();
    formData.teachers.splice(index, 1);
    refreshTeacherIndices();
}

function clearTeachers() {
    document.getElementById('teachers-container').innerHTML = '';
    formData.teachers = [];
}

function refreshTeacherIndices() {
    const items = document.querySelectorAll('#teachers-container .form-item');
    items.forEach((item, index) => {
        item.querySelector('h4').textContent = `Teacher ${index + 1}`;
        item.querySelector('.remove-btn').onclick = () => removeTeacher(index);
    });
}

// Classroom management
function addClassroom() {
    const container = document.getElementById('classrooms-container');
    const index = formData.classrooms.length;
    
    const classroomDiv = document.createElement('div');
    classroomDiv.className = 'form-item';
    classroomDiv.innerHTML = `
        <div class="form-item-header">
            <h4>Classroom ${index + 1}</h4>
            <button type="button" class="remove-btn" onclick="removeClassroom(${index})">×</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Room Number:</label>
                <input type="number" id="classroom-number-${index}" placeholder="e.g., 101" required>
            </div>
            <div class="form-group">
                <label>Capacity:</label>
                <input type="number" id="classroom-capacity-${index}" min="1" max="100" value="30" required>
            </div>
        </div>
        <div class="form-group">
            <label>Specialties (comma-separated, optional):</label>
            <input type="text" id="classroom-specialties-${index}" placeholder="e.g., Computer Lab, Science Lab">
        </div>
    `;
    
    container.appendChild(classroomDiv);
    formData.classrooms.push({});
}

function removeClassroom(index) {
    const container = document.getElementById('classrooms-container');
    container.children[index].remove();
    formData.classrooms.splice(index, 1);
    refreshClassroomIndices();
}

function clearClassrooms() {
    document.getElementById('classrooms-container').innerHTML = '';
    formData.classrooms = [];
}

function refreshClassroomIndices() {
    const items = document.querySelectorAll('#classrooms-container .form-item');
    items.forEach((item, index) => {
        item.querySelector('h4').textContent = `Classroom ${index + 1}`;
        item.querySelector('.remove-btn').onclick = () => removeClassroom(index);
    });
}

// Class management
function addClass() {
    const container = document.getElementById('classes-container');
    const index = formData.classes.length;
    
    const classDiv = document.createElement('div');
    classDiv.className = 'form-item';
    classDiv.innerHTML = `
        <div class="form-item-header">
            <h4>Class ${index + 1}</h4>
            <button type="button" class="remove-btn" onclick="removeClass(${index})">×</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Class Name:</label>
                <input type="text" id="class-name-${index}" placeholder="e.g., Class1A" required>
            </div>
            <div class="form-group">
                <label>Tutor (Abbreviation):</label>
                <input type="text" id="class-tutor-${index}" placeholder="e.g., JS" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Education Level:</label>
                <select id="class-level-${index}" required>
                    <option value="mavo">MAVO</option>
                    <option value="havo">HAVO</option>
                    <option value="vwo">VWO</option>
                </select>
            </div>
            <div class="form-group">
                <label>Year:</label>
                <input type="number" id="class-year-${index}" min="1" max="6" value="1" required>
            </div>
            <div class="form-group">
                <label>Group:</label>
                <input type="number" id="class-group-${index}" min="1" max="10" value="1" required>
            </div>
        </div>
        <div class="form-group">
            <label>Core Subjects (comma-separated):</label>
            <input type="text" id="class-subjects-${index}" placeholder="e.g., Math, English, History" required>
        </div>
    `;
    
    container.appendChild(classDiv);
    formData.classes.push({});
}

function removeClass(index) {
    const container = document.getElementById('classes-container');
    container.children[index].remove();
    formData.classes.splice(index, 1);
    refreshClassIndices();
}

function clearClasses() {
    document.getElementById('classes-container').innerHTML = '';
    formData.classes = [];
}

function refreshClassIndices() {
    const items = document.querySelectorAll('#classes-container .form-item');
    items.forEach((item, index) => {
        item.querySelector('h4').textContent = `Class ${index + 1}`;
        item.querySelector('.remove-btn').onclick = () => removeClass(index);
    });
}

function addTimeSlot(day, type = 'lesson', startTime = '08:00', endTime = '08:45') {
    const container = document.getElementById(`${day}-slots`);
    const index = formData.scheduleHours[day].length;
    
    const slotDiv = document.createElement('div');
    slotDiv.className = 'time-slot-item';
    slotDiv.innerHTML = `
        <select class="slot-type">
            <option value="lesson" ${type === 'lesson' ? 'selected' : ''}>Lesson</option>
            <option value="recess" ${type === 'recess' ? 'selected' : ''}>Break</option>
        </select>
        <input type="time" class="slot-start" value="${startTime}" required>
        <span>-</span>
        <input type="time" class="slot-end" value="${endTime}" required>
        <button type="button" class="remove-slot-btn" onclick="removeTimeSlot('${day}', ${index})">×</button>
    `;
    
    container.appendChild(slotDiv);
    formData.scheduleHours[day].push({});
}

function removeTimeSlot(day, index) {
    const container = document.getElementById(`${day}-slots`);
    container.children[index].remove();
    formData.scheduleHours[day].splice(index, 1);
    refreshTimeSlotIndices(day);
}

function refreshTimeSlotIndices(day) {
    const items = document.querySelectorAll(`#${day}-slots .time-slot-item`);
    items.forEach((item, index) => {
        item.querySelector('.remove-slot-btn').onclick = () => removeTimeSlot(day, index);
    });
}

// Fixed hours management
function addFixedHour() {
    const container = document.getElementById('fixed-hours-container');
    const index = formData.fixedHours.length;
    
    const fixedHourDiv = document.createElement('div');
    fixedHourDiv.className = 'form-item';
    fixedHourDiv.innerHTML = `
        <div class="form-item-header">
            <h4>Fixed Hour ${index + 1}</h4>
            <button type="button" class="remove-btn" onclick="removeFixedHour(${index})">×</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Day:</label>
                <select id="fixed-day-${index}" required>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                </select>
            </div>
            <div class="form-group">
                <label>Hour (Lesson Number):</label>
                <input type="number" id="fixed-hour-${index}" min="1" max="9" value="1" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Name/Description:</label>
                <input type="text" id="fixed-name-${index}" placeholder="e.g., Assembly" required>
            </div>
            <div class="form-group">
                <label>Classroom ID:</label>
                <input type="text" id="fixed-classroom-${index}" placeholder="e.g., 101" required>
            </div>
        </div>
    `;
    
    container.appendChild(fixedHourDiv);
    formData.fixedHours.push({});
}

function removeFixedHour(index) {
    const container = document.getElementById('fixed-hours-container');
    container.children[index].remove();
    formData.fixedHours.splice(index, 1);
    refreshFixedHourIndices();
}

function clearFixedHours() {
    document.getElementById('fixed-hours-container').innerHTML = '';
    formData.fixedHours = [];
}

function refreshFixedHourIndices() {
    const items = document.querySelectorAll('#fixed-hours-container .form-item');
    items.forEach((item, index) => {
        item.querySelector('h4').textContent = `Fixed Hour ${index + 1}`;
        item.querySelector('.remove-btn').onclick = () => removeFixedHour(index);
    });
}

// Data collection and JSON generation
function collectFormData() {
    // Collect subjects
    const subjects = [];
    document.querySelectorAll('#subjects-container .form-item').forEach((item, index) => {
        const name = document.getElementById(`subject-name-${index}`).value;
        const abbreviation = document.getElementById(`subject-abbr-${index}`).value;
        const requiredHours = parseInt(document.getElementById(`subject-hours-${index}`).value);
        const coreSubject = document.getElementById(`subject-core-${index}`).checked;
        
        if (name && abbreviation) {
            subjects.push({
                name,
                abbreviation,
                requiredHours,
                coreSubject,
                requiredClassroomsParameters: []
            });
        }
    });
    
    // Collect teachers
    const teachers = [];
    document.querySelectorAll('#teachers-container .form-item').forEach((item, index) => {
        const name = document.getElementById(`teacher-name-${index}`).value;
        const abbreviation = document.getElementById(`teacher-abbr-${index}`).value;
        const subjectsText = document.getElementById(`teacher-subjects-${index}`).value;
        const subjects = subjectsText.split(',').map(s => s.trim()).filter(s => s);
        
        const availability = {};
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
            availability[day] = [];
            for (let hour = 1; hour <= 9; hour++) {
                const checkbox = document.getElementById(`teacher-${index}-${day}-${hour}`);
                if (checkbox && checkbox.checked) {
                    availability[day].push(hour);
                }
            }
        });
        
        if (name && abbreviation && subjects.length > 0) {
            teachers.push({
                name,
                abbreviation,
                availability,
                subjects
            });
        }
    });
    
    // Collect classrooms
    const classrooms = [];
    document.querySelectorAll('#classrooms-container .form-item').forEach((item, index) => {
        const number = parseInt(document.getElementById(`classroom-number-${index}`).value);
        const capacity = parseInt(document.getElementById(`classroom-capacity-${index}`).value);
        const specialtiesText = document.getElementById(`classroom-specialties-${index}`).value;
        const specialties = specialtiesText ? specialtiesText.split(',').map(s => s.trim()) : [];
        
        if (number && capacity) {
            classrooms.push({
                number,
                capacity,
                specialties
            });
        }
    });
    
    // Collect classes
    const classes = [];
    document.querySelectorAll('#classes-container .form-item').forEach((item, index) => {
        const name = document.getElementById(`class-name-${index}`).value;
        const tutor = document.getElementById(`class-tutor-${index}`).value;
        const level = document.getElementById(`class-level-${index}`).value;
        const year = parseInt(document.getElementById(`class-year-${index}`).value);
        const group = parseInt(document.getElementById(`class-group-${index}`).value);
        const coreSubjectsText = document.getElementById(`class-subjects-${index}`).value;
        const coreSubjects = coreSubjectsText.split(',').map(s => s.trim()).filter(s => s);
        
        if (name && tutor && coreSubjects.length > 0) {
            classes.push({
                name,
                year: [level, year, group],
                tutor,
                coreSubjects
            });
        }
    });
    
    // Collect schedule hours
    const hours = [];
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        const slots = document.querySelectorAll(`#${day}-slots .time-slot-item`);
        slots.forEach(slot => {
            const type = slot.querySelector('.slot-type').value;
            const startTime = slot.querySelector('.slot-start').value;
            const endTime = slot.querySelector('.slot-end').value;
            
            if (startTime && endTime) {
                hours.push([type, day, startTime, endTime]);
            }
        });
    });
    
    // Collect fixed hours
    const fixedHours = [];
    document.querySelectorAll('#fixed-hours-container .form-item').forEach((item, index) => {
        const day = document.getElementById(`fixed-day-${index}`).value;
        const hour = parseInt(document.getElementById(`fixed-hour-${index}`).value);
        const name = document.getElementById(`fixed-name-${index}`).value;
        const classroomID = document.getElementById(`fixed-classroom-${index}`).value;
        
        if (day && hour && name && classroomID) {
            fixedHours.push({
                day,
                hour,
                name,
                classroomID
            });
        }
    });
    
    // Get generation settings
    const generationType = document.getElementById('generation-type')?.value || 'balanced';
    const preferredOddHoursEnabled = document.getElementById('preferred-odd-hours')?.checked || false;
    
    return {
        subjects,
        teachers,
        classrooms,
        classes,
        common: { 
            hours,
            preferredOddHoursEnabled,
            generationType
        },
        fixedHours
    };
}

// Generate schedule function
async function generateSchedule() {
    const statusDiv = document.getElementById('generation-status');
    const generateBtn = document.getElementById('generate-btn');
    
    try {
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';
        statusDiv.innerHTML = '<div class="status-info">Collecting form data...</div>';
        
        const data = collectFormData();
        
        // Validate data
        if (data.subjects.length === 0) {
            throw new Error('Please add at least one subject');
        }
        if (data.teachers.length === 0) {
            throw new Error('Please add at least one teacher');
        }
        if (data.classrooms.length === 0) {
            throw new Error('Please add at least one classroom');
        }
        if (data.classes.length === 0) {
            throw new Error('Please add at least one class');
        }
        
        statusDiv.innerHTML = '<div class="status-info">Saving configuration files...</div>';
        
        // Save JSON files
        await saveJSONFiles(data);
        
        statusDiv.innerHTML = '<div class="status-info">Running schedule generator...</div>';
        
        // Run the Python script
        await runPythonScript();
        
        statusDiv.innerHTML = '<div class="status-success">✅ Schedule generated successfully!</div>';
        
        // Redirect to generated schedule page after a delay
        setTimeout(() => {
            window.location.href = 'schedule';
        }, 1000);
        
    } catch (error) {
        statusDiv.innerHTML = `<div class="status-error">❌ Error: ${error.message}</div>`;
        console.error('Generation error:', error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Schedule';
    }
}

// Save JSON files through backend API
async function saveJSONFiles(data) {
    try {
        const response = await fetch('/api/save-json-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subjects: data.subjects,
                teachers: data.teachers,
                classrooms: data.classrooms,
                classes: data.classes,
                common: data.common,
                fixedHours: data.fixedHours
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('JSON files saved successfully:', result.message);
            if (result.savedFiles) {
                console.log('Saved files:', result.savedFiles);
            }
        } else {
            throw new Error(result.error || 'Failed to save JSON files');
        }
        
    } catch (error) {
        console.error('Error saving JSON files:', error);
        throw new Error(`Failed to save configuration files: ${error.message}`);
    }
}

// Run Python script through backend API
async function runPythonScript() {
    try {
        const response = await fetch('/api/run-schedule-generator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generate_schedule'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Python script executed successfully:', result.message);
            if (result.output) {
                console.log('Script output:', result.output);
            }
            if (result.generatedFile) {
                console.log('Generated schedule file:', result.generatedFile);
            }
        } else {
            throw new Error(result.error || 'Schedule generation failed');
        }
        
    } catch (error) {
        console.error('Error running Python script:', error);
        throw new Error(`Failed to run schedule generator: ${error.message}`);
    }
}

// Manual refresh function for dropdown
function refreshDropdown() {
    console.log('Manual refresh triggered');
    loadSavedConfigurations();
    updateSavedConfigsDropdown();
    
    // Show brief feedback
    const statusDiv = document.getElementById('save-status');
    if (statusDiv) {
        statusDiv.innerHTML = '<div class="status-info">🔄 Configurations refreshed</div>';
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 1500);
    }
}

// Saved Configurations Management
function loadSavedConfigurations() {
    const saved = localStorage.getItem('duleai_saved_configs');
    console.log('Raw localStorage data:', saved);
    
    if (saved) {
        try {
            savedConfigurations = JSON.parse(saved);
            console.log('Parsed configurations:', savedConfigurations);
        } catch (e) {
            console.error('Error loading saved configurations:', e);
            savedConfigurations = [];
        }
    } else {
        console.log('No saved configurations found in localStorage');
        savedConfigurations = [];
    }
}

function saveSavedConfigurations() {
    localStorage.setItem('duleai_saved_configs', JSON.stringify(savedConfigurations));
}

function updateSavedConfigsDropdown() {
    const dropdown = document.getElementById('saved-configs-select');
    if (!dropdown) {
        console.warn('Saved configs dropdown not found, retrying...');
        // Retry after a short delay if dropdown not found
        setTimeout(updateSavedConfigsDropdown, 200);
        return;
    }
    
    console.log('Updating dropdown with', savedConfigurations.length, 'configurations');
    
    // Clear existing options
    dropdown.innerHTML = '<option value="">Select a saved configuration...</option>';
    
    // Add saved configurations
    savedConfigurations.forEach((config, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${config.name} (${new Date(config.savedAt).toLocaleDateString()})`;
        if (config.name === currentConfigName) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
    
    console.log('Dropdown updated with', dropdown.options.length - 1, 'configurations');
}

function saveCurrentConfiguration() {
    const configName = prompt('Enter a name for this configuration:');
    if (!configName || configName.trim() === '') {
        alert('Please enter a valid configuration name.');
        return;
    }
    
    try {
        const data = collectFormData();
        
        // Check if configuration name already exists
        const existingIndex = savedConfigurations.findIndex(config => config.name === configName.trim());
        
        const configToSave = {
            name: configName.trim(),
            data: data,
            savedAt: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            // Update existing configuration
            const overwrite = confirm(`A configuration named "${configName.trim()}" already exists. Do you want to overwrite it?`);
            if (overwrite) {
                savedConfigurations[existingIndex] = configToSave;
            } else {
                return;
            }
        } else {
            // Add new configuration
            savedConfigurations.push(configToSave);
        }
        
        saveSavedConfigurations();
        updateSavedConfigsDropdown();
        currentConfigName = configName.trim();
        
        // Show success message
        const statusDiv = document.getElementById('save-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="status-success">✅ Configuration saved successfully!</div>';
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
        
    } catch (error) {
        alert('Error saving configuration: ' + error.message);
    }
}

function loadConfiguration() {
    const dropdown = document.getElementById('saved-configs-select');
    if (!dropdown) {
        alert('Dropdown not found. Please refresh the page.');
        return;
    }
    
    const selectedIndex = dropdown.value;
    console.log('Loading configuration at index:', selectedIndex);
    console.log('Available configurations:', savedConfigurations.length);
    
    if (selectedIndex === '' || selectedIndex < 0 || selectedIndex >= savedConfigurations.length) {
        console.log('Invalid selection or no configuration selected');
        return;
    }
    
    const config = savedConfigurations[selectedIndex];
    console.log('Loading configuration:', config.name);
    
    try {
        // Clear existing form data
        clearAllForms();
        
        // Load the configuration data
        loadFormData(config.data);
        
        currentConfigName = config.name;
        
        // Show success message
        const statusDiv = document.getElementById('save-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="status-success">✅ Loaded configuration: ${config.name}</div>`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        alert('Error loading configuration: ' + error.message);
    }
}

function deleteConfiguration() {
    const dropdown = document.getElementById('saved-configs-select');
    const selectedIndex = dropdown.value;
    
    if (selectedIndex === '' || selectedIndex < 0 || selectedIndex >= savedConfigurations.length) {
        alert('Please select a configuration to delete.');
        return;
    }
    
    const config = savedConfigurations[selectedIndex];
    const confirmDelete = confirm(`Are you sure you want to delete the configuration "${config.name}"?`);
    
    if (confirmDelete) {
        savedConfigurations.splice(selectedIndex, 1);
        saveSavedConfigurations();
        updateSavedConfigsDropdown();
        
        if (currentConfigName === config.name) {
            currentConfigName = null;
        }
        
        // Show success message
        const statusDiv = document.getElementById('save-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="status-info">🗑️ Deleted configuration: ${config.name}</div>`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
    }
}

function clearAllForms() {
    // Clear all containers
    document.getElementById('subjects-container').innerHTML = '';
    document.getElementById('teachers-container').innerHTML = '';
    document.getElementById('classrooms-container').innerHTML = '';
    document.getElementById('classes-container').innerHTML = '';
    document.getElementById('fixed-hours-container').innerHTML = '';
    
    // Clear schedule hours
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        document.getElementById(`${day}-slots`).innerHTML = '';
    });
    
    // Reset form data
    formData = {
        subjects: [],
        teachers: [],
        classrooms: [],
        classes: [],
        scheduleHours: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: []
        },
        fixedHours: []
    };
}

function initializeEmptyForm() {
    // Just clear everything, don't add default items
    clearAllForms();
}

function loadFormData(data) {
    // Load subjects
    if (data.subjects && data.subjects.length > 0) {
        data.subjects.forEach(subject => {
            addSubject();
            const index = formData.subjects.length - 1;
            document.getElementById(`subject-name-${index}`).value = subject.name || '';
            document.getElementById(`subject-abbr-${index}`).value = subject.abbreviation || '';
            document.getElementById(`subject-hours-${index}`).value = subject.requiredHours || 2;
            document.getElementById(`subject-core-${index}`).checked = subject.coreSubject || false;
        });
    }
    
    // Load teachers
    if (data.teachers && data.teachers.length > 0) {
        data.teachers.forEach(teacher => {
            addTeacher();
            const index = formData.teachers.length - 1;
            document.getElementById(`teacher-name-${index}`).value = teacher.name || '';
            document.getElementById(`teacher-abbr-${index}`).value = teacher.abbreviation || '';
            document.getElementById(`teacher-subjects-${index}`).value = (teacher.subjects || []).join(', ');
            
            // Load availability
            if (teacher.availability) {
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                    if (teacher.availability[day]) {
                        teacher.availability[day].forEach(hour => {
                            const checkbox = document.getElementById(`teacher-${index}-${day}-${hour}`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                });
            }
        });
    }
    
    // Load classrooms
    if (data.classrooms && data.classrooms.length > 0) {
        data.classrooms.forEach(classroom => {
            addClassroom();
            const index = formData.classrooms.length - 1;
            document.getElementById(`classroom-number-${index}`).value = classroom.number || '';
            document.getElementById(`classroom-capacity-${index}`).value = classroom.capacity || 30;
            document.getElementById(`classroom-specialties-${index}`).value = (classroom.specialties || []).join(', ');
        });
    }
    
    // Load classes
    if (data.classes && data.classes.length > 0) {
        data.classes.forEach(classItem => {
            addClass();
            const index = formData.classes.length - 1;
            document.getElementById(`class-name-${index}`).value = classItem.name || '';
            document.getElementById(`class-tutor-${index}`).value = classItem.tutor || '';
            if (classItem.year && classItem.year.length >= 3) {
                document.getElementById(`class-level-${index}`).value = classItem.year[0] || 'mavo';
                document.getElementById(`class-year-${index}`).value = classItem.year[1] || 1;
                document.getElementById(`class-group-${index}`).value = classItem.year[2] || 1;
            }
            document.getElementById(`class-subjects-${index}`).value = (classItem.coreSubjects || []).join(', ');
        });
    }
    
    // Load schedule hours
    if (data.common && data.common.hours) {
        const hoursByDay = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: []
        };
        
        // Group hours by day
        data.common.hours.forEach(hour => {
            if (hour.length >= 4 && hoursByDay[hour[1]]) {
                hoursByDay[hour[1]].push(hour);
            }
        });
        
        // Add time slots for each day
        Object.keys(hoursByDay).forEach(day => {
            hoursByDay[day].forEach(hour => {
                addTimeSlot(day, hour[0], hour[2], hour[3]);
            });
        });
        
        // Load generation settings
        const generationTypeSelect = document.getElementById('generation-type');
        if (generationTypeSelect && data.common.generationType) {
            generationTypeSelect.value = data.common.generationType;
        }
        
        const preferredOddHoursCheckbox = document.getElementById('preferred-odd-hours');
        if (preferredOddHoursCheckbox) {
            preferredOddHoursCheckbox.checked = data.common.preferredOddHoursEnabled || false;
        }
    }
    
    // Load fixed hours
    if (data.fixedHours && data.fixedHours.length > 0) {
        data.fixedHours.forEach(fixedHour => {
            addFixedHour();
            const index = formData.fixedHours.length - 1;
            document.getElementById(`fixed-day-${index}`).value = fixedHour.day || 'Monday';
            document.getElementById(`fixed-hour-${index}`).value = fixedHour.hour || 1;
            document.getElementById(`fixed-name-${index}`).value = fixedHour.name || '';
            document.getElementById(`fixed-classroom-${index}`).value = fixedHour.classroomID || '';
        });
    }
}

function exportConfiguration() {
    try {
        const data = collectFormData();
        const configName = currentConfigName || 'duleai_config';
        const exportData = {
            name: configName,
            data: data,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${configName.replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        const statusDiv = document.getElementById('save-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="status-success">✅ Configuration exported successfully!</div>';
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
        
    } catch (error) {
        alert('Error exporting configuration: ' + error.message);
    }
}

function importConfiguration() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedConfig = JSON.parse(e.target.result);
                
                if (!importedConfig.data) {
                    throw new Error('Invalid configuration file format');
                }
                
                // Clear existing form
                clearAllForms();
                
                // Load imported data
                loadFormData(importedConfig.data);
                
                // Update current config name
                currentConfigName = importedConfig.name || 'Imported Configuration';
                
                // Show success message
                const statusDiv = document.getElementById('save-status');
                if (statusDiv) {
                    statusDiv.innerHTML = `<div class="status-success">✅ Configuration imported: ${currentConfigName}</div>`;
                    setTimeout(() => {
                        statusDiv.innerHTML = '';
                    }, 3000);
                }
                
            } catch (error) {
                alert('Error importing configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}