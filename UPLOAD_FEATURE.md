# 3D Model Upload Feature Documentation

## Overview
A complete implementation of custom 3D model upload functionality for the Fast React AR application. Users can upload GLB and USDZ model files with validation, automatic ID generation, and persistent storage.

## Backend Implementation (`backend/main.py`)

### New Imports
- `UploadFile, File, Form` - FastAPI file upload utilities
- `uuid` - For generating unique model IDs
- `json` - For persistent model database storage
- `Path` - For file path handling

### Database Persistence
- **`load_models_db()`** - Loads models from `models_db.json` file on startup
- **`save_models_db(db)`** - Persists model entries to `models_db.json` after upload
- Models are stored both in memory and on disk for reliability

### File Validation
- **`validate_model_file(filename, content)`** - Validates file format by checking file signatures:
  - **GLB files**: Must start with `glTF` magic number (bytes)
  - **USDZ files**: Must start with `PK` (ZIP archive signature)
  - Prevents invalid/corrupted files from being uploaded

### Upload Endpoint
**Endpoint:** `POST /api/upload`

**Request Parameters (Form Data):**
- `title` (string, required) - Model display name
- `glb_file` (file, required) - 3D model for Android/Web
- `usdz_file` (file, required) - 3D model for iOS
- `model_id` (string, optional) - Custom unique ID, auto-generated if not provided

**Validation Logic:**
1. File extension checking (.glb and .usdz)
2. File signature validation (magic numbers)
3. Title non-empty validation
4. Duplicate model_id prevention
5. File content validation

**Response:**
```json
{
  "success": true,
  "message": "Model 'Title' uploaded successfully with ID 'xyz12345'",
  "model_id": "xyz12345",
  "model": {
    "title": "Model Title",
    "src": "https://domain.com/static/xyz12345.glb",
    "ios_src": "https://domain.com/static/xyz12345.usdz"
  }
}
```

**Error Responses:**
- Invalid file extension
- Invalid file format (not GLB/USDZ)
- Empty or missing title
- Duplicate model ID
- Server errors

## Frontend Implementation

### ModelUpload Component (`frontend/src/components/ModelUpload.jsx`)

**Features:**
- Form with title, model ID, and file inputs
- Auto-ID generation button
- File validation before submission
- Real-time file name display
- Loading state during upload
- Success/error messaging
- Display of uploaded model details

**Form Validation (Client-side):**
- Title not empty
- Both files selected
- Correct file extensions (.glb, .usdz)

### Styling (`frontend/src/components/ModelUpload.css`)

**Design Elements:**
- Gradient background (purple theme)
- Responsive form layout
- File input styling
- Success/error message animations
- Mobile-responsive design
- Hover effects on buttons

## URL Routes

### New Routes Added
- **Frontend:** `/upload` - Access the model upload form
- **Backend API:** `POST /api/upload` - Handle file uploads

### Existing Routes
- `GET /api/model/{item_id}` - Fetch model by ID
- `GET /static/*` - Static file serving (GLB/USDZ files)

## Database Structure

### File: `models_db.json`
```json
{
  "model_id": {
    "title": "Model Title",
    "src": "model_id.glb",
    "ios_src": "model_id.usdz"
  }
}
```

**Storage Location:** `backend/models_db.json`
**File Location:** `backend/static/{model_id}.glb`, `backend/static/{model_id}.usdz`

## Workflow

1. **User Access** → Navigate to `/upload`
2. **Form Entry** → Enter title, optionally customize model ID
3. **File Selection** → Select GLB and USDZ files
4. **Validation** → Client-side validation before submission
5. **Upload** → POST request to `/api/upload` with FormData
6. **Server Processing** → 
   - Validate files (extension, signature, format)
   - Generate unique ID if not provided
   - Save files to `static/` directory
   - Store metadata in `models_db.json`
7. **Response** → User sees success message with model URLs
8. **Access** → Model available via `/view/{model_id}`

## Error Handling

### Client-side Errors
- Required field validation
- File extension checking
- Network error handling

### Server-side Errors
- HTTP 400: Bad request (invalid format, empty title, duplicate ID)
- HTTP 500: Server error (file write issues)
- File signature validation failures

## Configuration Notes

**BASE_URL** - Update in `backend/main.py` line 54
- Development: `http://localhost:8000`
- Production: Your Ngrok URL or domain

## Usage Example

1. Start backend: `python main.py`
2. Start frontend: `npm run dev`
3. Navigate to `http://localhost:5173/upload` (Vite default)
4. Fill the form and upload
5. Access model at `/view/{model_id}`

## File Structure After Implementation
```
backend/
  main.py              (Updated with upload logic)
  models_db.json      (Created automatically on first upload)
  static/
    frame_red.usdz
    {model_id}.glb    (Uploaded GLB files)
    {model_id}.usdz   (Uploaded USDZ files)

frontend/
  src/
    components/
      ModelUpload.jsx  (New upload form)
      ModelUpload.css  (New upload styles)
    App.jsx           (Updated with /upload route)
```

## Security Considerations

- File type validation via magic numbers (not just extension)
- File size limits should be added for production
- Consider adding authentication/authorization
- CORS enabled (already in place)
- Input sanitization for titles
