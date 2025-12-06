# fast-react-ar
Web AR using React js and FastAPI

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
1. Create a Python virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running

### Backend (FastAPI)
```bash
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`

### Frontend (React)
1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`
