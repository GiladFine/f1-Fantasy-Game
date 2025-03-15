from fastapi import APIRouter, HTTPException
import json
import os
from typing import List, Dict, Any

router = APIRouter()

# Path to the teams data file
TEAMS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "teams.json")

def read_teams():
    """Read teams data from JSON file"""
    try:
        with open(TEAMS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        # Return empty list if file doesn't exist
        return []

def write_teams(teams_data):
    """Write teams data to JSON file"""
    with open(TEAMS_FILE, "w") as f:
        json.dump(teams_data, f, indent=2)

@router.get("/teams")
async def get_teams():
    """Get all teams"""
    return read_teams()

@router.get("/teams/{team_id}")
async def get_team(team_id: int):
    """Get a specific team by ID"""
    teams = read_teams()
    for team in teams:
        if team["id"] == team_id:
            return team
    raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found")

@router.post("/teams")
async def create_team(team: Dict[str, Any]):
    """Create a new team"""
    teams = read_teams()
    
    # Assign a new ID (max existing ID + 1)
    team_ids = [t["id"] for t in teams]
    team["id"] = max(team_ids or [0]) + 1
    
    teams.append(team)
    write_teams(teams)
    return team

@router.put("/teams/{team_id}")
async def update_team(team_id: int, updated_team: Dict[str, Any]):
    """Update an existing team"""
    teams = read_teams()
    
    for i, team in enumerate(teams):
        if team["id"] == team_id:
            # Preserve the original ID
            updated_team["id"] = team_id
            teams[i] = updated_team
            write_teams(teams)
            return updated_team
    
    raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found")

@router.delete("/teams/{team_id}")
async def delete_team(team_id: int):
    """Delete a team"""
    teams = read_teams()
    
    for i, team in enumerate(teams):
        if team["id"] == team_id:
            del teams[i]
            write_teams(teams)
            return {"message": f"Team with ID {team_id} deleted"}
    
    raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found") 