const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the src/pages directory
app.use(express.static(path.join(__dirname, 'src', 'pages')));

// Serve data files from the data directory
app.use('/data', express.static(path.join(__dirname, 'data')));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const SRC_DIR = path.join(__dirname, 'src');
const RUN_PY_PATH = path.join(SRC_DIR, 'run.py');

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// API Routes

// Save JSON files endpoint
app.post('/api/save-json-files', async (req, res) => {
    try {
        const { subjects, teachers, classrooms, classes, common, fixedHours } = req.body;
        
        console.log('Received data for saving JSON files');
        
        // Validate required data
        if (!subjects || !teachers || !classrooms || !classes || !common) {
            return res.status(400).json({
                success: false,
                error: 'Missing required data. Please ensure all forms are filled out.'
            });
        }
        
        // File paths
        const files = {
            'subjects.json': subjects,
            'teachers.json': teachers,
            'classrooms.json': classrooms,
            'classes.json': classes,
            'common.json': common,
            'fixed_hours.json': fixedHours || []
        };
        
        const savedFiles = [];
        
        // Save each JSON file
        for (const [filename, data] of Object.entries(files)) {
            const filePath = path.join(DATA_DIR, filename);
            await fs.writeJson(filePath, data, { spaces: 2 });
            savedFiles.push(filename);
            console.log(`Saved ${filename}`);
        }
        
        res.json({
            success: true,
            message: 'All JSON files saved successfully',
            savedFiles: savedFiles
        });
        
    } catch (error) {
        console.error('Error saving JSON files:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Run Python script endpoint
app.post('/api/run-schedule-generator', async (req, res) => {
    try {
        console.log('Starting Python script execution...');
        
        // Check if run.py exists
        if (!await fs.pathExists(RUN_PY_PATH)) {
            return res.status(404).json({
                success: false,
                error: 'Python script not found at: ' + RUN_PY_PATH
            });
        }
        
        // Flag to track if response has been sent
        let responseSent = false;
        
        // Run the Python script
        const pythonProcess = spawn('python', [RUN_PY_PATH], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log('Python stdout:', data.toString());
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error('Python stderr:', data.toString());
        });
        
        pythonProcess.on('close', async (code) => {
            console.log(`Python script exited with code ${code}`);
            
            if (responseSent) {
                console.log('Response already sent, skipping close handler');
                return;
            }
            responseSent = true;
            
            if (code === 0) {
                // Check if output file was generated
                const outputPath = path.join(DATA_DIR, 'out', 'generated.json');
                const generatedFile = await fs.pathExists(outputPath) ? 'generated.json' : null;
                
                res.json({
                    success: true,
                    message: 'Schedule generated successfully',
                    output: stdout,
                    generatedFile: generatedFile
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: `Python script failed with exit code ${code}`,
                    output: stdout,
                    stderr: stderr
                });
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('Error running Python script:', error);
            if (responseSent) {
                console.log('Response already sent, skipping error handler');
                return;
            }
            responseSent = true;
            
            res.status(500).json({
                success: false,
                error: 'Failed to start Python process: ' + error.message
            });
        });
        
        // Set timeout for long-running processes
        const timeoutId = setTimeout(() => {
            if (!responseSent && !pythonProcess.killed) {
                console.log('Python script timed out, killing process');
                responseSent = true;
                pythonProcess.kill();
                res.status(408).json({
                    success: false,
                    error: 'Python script execution timed out after 60 seconds'
                });
            }
        }, 60000); // 60 second timeout
        
        // Clear timeout if process completes normally
        pythonProcess.on('close', () => {
            clearTimeout(timeoutId);
        });
        
    } catch (error) {
        console.error('Error in run-schedule-generator:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'DuleAI Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Serve the main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'html', 'index.html'));
});

app.get('/generate', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'html', 'generate_settings.html'));
});

app.get('/schedule', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'pages', 'html', 'generated_schedule.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 DuleAI Backend server running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`🐍 Python script: ${RUN_PY_PATH}`);
});