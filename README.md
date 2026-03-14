# Shaadi Planner - Wedding Planning App

A personalized wedding planning application for Ashu & Aadu.

## Features
- Password protected (1527)
- Countdown with custom background image
- Budget tracking per event
- Task management with assignments
- Event management (Mehendi, Haldi, Sangeet, etc.)
- Cloud sync via MongoDB

## Tech Stack
- **Frontend:** React 19 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI + Python
- **Database:** MongoDB

---

## How to Run Locally

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- MongoDB (local or Atlas)

### Step 1: Set up MongoDB
Option A: Use MongoDB Atlas (Free Cloud)
1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Get connection string like: `mongodb+srv://username:password@cluster.mongodb.net/shaadi_planner`

Option B: Install MongoDB locally
1. Install MongoDB Community Server
2. Connection string: `mongodb://localhost:27017/shaadi_planner`

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Update .env file with your MongoDB URL
# Edit backend/.env:
# MONGO_URL=your_mongodb_connection_string
# DB_NAME=shaadi_planner

# Run backend
uvicorn server:app --reload --port 8001
```

### Step 3: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
# OR
yarn install

# Update .env file
# Edit frontend/.env:
# REACT_APP_BACKEND_URL=http://localhost:8001

# Run frontend
npm start
# OR
yarn start
```

### Step 4: Access the App
- Open http://localhost:3000
- Enter password: **1527**
- Start planning!

---

## Project Structure
```
shaadi-planner/
├── backend/
│   ├── server.py          # FastAPI backend
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # UI components
│   │   ├── lib/          # API & utilities
│   │   ├── App.js        # Main app
│   │   ├── App.css       # Custom styles
│   │   └── index.css     # Global styles
│   ├── package.json      # Node dependencies
│   └── .env              # Frontend environment variables
└── README.md
```

---

## Customization

### Change Password
Edit `frontend/src/pages/PasswordPage.jsx`:
```javascript
const CORRECT_PASSWORD = '1527';  // Change this
```

### Change Wedding Details
Edit `frontend/src/pages/DashboardPage.jsx`:
```javascript
const WEDDING_CONFIG = {
    title: 'Ashu & Aadu',
    bride_name: 'Ashu',
    groom_name: 'Aadu',
    wedding_date: '2027-02-15T00:00:00.000Z',
    venue: 'Harshal Hall',
    muhurta_time: '11:19 AM'
};
```

### Change Default Events
Edit `frontend/src/pages/DashboardPage.jsx`:
```javascript
const DEFAULT_EVENTS = [
    { name: 'Mehendi', budget: 500000, color: '#059669' },
    // Add or modify events
];
```

---

## Deployment
For production deployment, you can use:
- **Frontend:** Vercel, Netlify
- **Backend:** Railway, Render, Heroku
- **Database:** MongoDB Atlas

Make sure to update the `REACT_APP_BACKEND_URL` in frontend to point to your deployed backend URL.

---

## License
Personal use for Ashu & Aadu's wedding planning.
