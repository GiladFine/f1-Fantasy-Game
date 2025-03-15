from fastapi import APIRouter, HTTPException
import json
import os
from typing import Dict, Any

router = APIRouter()

# Path to the data files
DRIVERS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "drivers.json")
TEAMS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "teams.json")

def read_drivers():
    """Read drivers data from JSON file"""
    try:
        with open(DRIVERS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def write_drivers(drivers_data):
    """Write drivers data to JSON file"""
    with open(DRIVERS_FILE, "w") as f:
        json.dump(drivers_data, f, indent=2)

def read_teams():
    """Read teams data from JSON file"""
    try:
        with open(TEAMS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def write_teams(teams_data):
    """Write teams data to JSON file"""
    with open(TEAMS_FILE, "w") as f:
        json.dump(teams_data, f, indent=2)

@router.get("/drivers")
async def get_drivers():
    """Get all drivers"""
    return read_drivers()

@router.get("/drivers/free-agents")
async def get_free_agents():
    """Get all free agent drivers (not on any team)"""
    drivers = read_drivers()
    teams = read_teams()
    
    # Get all driver IDs that are in teams
    assigned_driver_ids = []
    for team in teams:
        assigned_driver_ids.extend(team["driver_ids"])
    
    # Filter drivers that are not in any team
    free_agents = [driver for driver in drivers if driver["id"] not in assigned_driver_ids]
    
    return free_agents

@router.get("/drivers/{driver_id}")
async def get_driver(driver_id: int):
    """Get a specific driver by ID"""
    drivers = read_drivers()
    for driver in drivers:
        if driver["id"] == driver_id:
            return driver
    raise HTTPException(status_code=404, detail=f"Driver with ID {driver_id} not found")

@router.post("/drivers")
async def create_driver(driver: Dict[str, Any]):
    """Create a new driver"""
    drivers = read_drivers()
    
    # Assign a new ID (max existing ID + 1)
    driver_ids = [d["id"] for d in drivers]
    driver["id"] = max(driver_ids or [0]) + 1
    
    drivers.append(driver)
    write_drivers(drivers)
    return driver

@router.put("/drivers/{driver_id}")
async def update_driver(driver_id: int, updated_driver: Dict[str, Any]):
    """Update an existing driver"""
    drivers = read_drivers()
    
    for i, driver in enumerate(drivers):
        if driver["id"] == driver_id:
            # Preserve the original ID
            updated_driver["id"] = driver_id
            drivers[i] = updated_driver
            write_drivers(drivers)
            return updated_driver
    
    raise HTTPException(status_code=404, detail=f"Driver with ID {driver_id} not found")

@router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: int):
    """Delete a driver"""
    drivers = read_drivers()
    
    for i, driver in enumerate(drivers):
        if driver["id"] == driver_id:
            del drivers[i]
            write_drivers(drivers)
            return {"message": f"Driver with ID {driver_id} deleted"}
    
    raise HTTPException(status_code=404, detail=f"Driver with ID {driver_id} not found")

@router.post("/teams/{team_id}/transfer")
async def transfer_driver(team_id: int, current_driver_id: int, new_driver_id: int):
    """Replace a driver in a team with a free agent"""
    teams = read_teams()
    drivers = read_drivers()
    
    # Verify team exists
    team = None
    for t in teams:
        if t["id"] == team_id:
            team = t
            break
    
    if not team:
        raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found")
    
    # Verify current driver is in the team
    if current_driver_id not in team["driver_ids"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Driver {current_driver_id} is not in team {team_id}"
        )
    
    # Verify new driver exists
    new_driver_exists = any(d["id"] == new_driver_id for d in drivers)
    if not new_driver_exists:
        raise HTTPException(
            status_code=404, 
            detail=f"Driver with ID {new_driver_id} not found"
        )
    
    # Verify new driver is a free agent
    for t in teams:
        if new_driver_id in t["driver_ids"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Driver {new_driver_id} is already in another team"
            )
    
    # Perform the transfer
    team["driver_ids"] = [
        new_driver_id if d_id == current_driver_id else d_id
        for d_id in team["driver_ids"]
    ]
    
    # Save changes
    write_teams(teams)
    
    return {
        "message": f"Driver {current_driver_id} replaced with {new_driver_id} in team {team_id}",
        "team": team
    } 