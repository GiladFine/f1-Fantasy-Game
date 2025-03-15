# F1 Fantasy Game

A simple F1 fantasy game management system for tracking teams, drivers, and points across races.

## Features

- Manage 3 teams, each with 5 F1 drivers
- Track free agent drivers
- Score points based on:
  - Actual F1 race/sprint points
  - Positions gained
  - Qualifying positions
  - Driver matchups between teams
  - DNF penalties

## Project Structure

- `backend/`: Python FastAPI backend with JSON file storage
- `frontend/`: Simple HTML/CSS/JS frontend

## Setup Instructions

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment (optional):
   ```
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend

1. Simply open `frontend/index.html` in your browser
2. Make sure the backend server is running for API calls to work

## Scoring Rules

* Race/Sprint: Points according to the actual F1 scoring system, including fastest lap
* Position gains: +1 point per position gained (no penalty for positions lost)
* DNF: -5 points
* Qualifying (and Sprint Qualifying): 
  - 1st: 12 points
  - 2nd: 8 points
  - 3rd: 6 points
  - 4th: 4 points
  - 5th: 2 points
  - 6th: 1 point
* Team matchups: +2 points for the driver that beats the corresponding driver from other teams in each event 