# DuleAI Backend Setup Guide

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.7 or higher)
- NPM or Yarn

### How to run
```bash
npm install
```
```bash
npm start
```
- Main page: http://localhost:3000/
- Generate settings: http://localhost:3000/generate
- View schedule: http://localhost:3000/schedule

## Endpoints

### POST `/api/save-json-files`
Saves the form data as JSON files in the data directory.

**Request body:**
```json
{
  "subjects": [...],
  "teachers": [...],
  "classrooms": [...],
  "classes": [...],
  "common": {...},
  "fixedHours": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "All JSON files saved successfully",
  "savedFiles": ["subjects.json", "teachers.json", ...]
}
```

### POST `/api/run-schedule-generator`
Executes the Python script to generate the schedule.

**Request body:**
```json
{
  "action": "generate_schedule"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule generated successfully",
  "output": "Python script output...",
  "generatedFile": "generated.json"
}
```

### GET `/api/health`
Health check endpoint to verify server is running.

## Configuration

- **Port:** Set `PORT` environment variable (default: 3000)
- **Data Directory:** `./data/` (automatically created)
- **Python Script:** `./src/run.py`

## Python Integration

The server expects:
1. `run.py` in the `src/` directory
2. Python executable available in system PATH
3. Output generated in `data/out/generated.json`

## Error Handling

The server includes:
- Input validation
- File existence checks
- Python process timeout (60 seconds)
- Comprehensive error messages
- Request logging

## Development

For development, install nodemon:
```bash
npm install -g nodemon
```

Then use:
```bash
npm run dev
```

This will auto-restart the server when files change.