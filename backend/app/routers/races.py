from fastapi import APIRouter, HTTPException
import json
import os
from typing import Dict, Any

router = APIRouter()

# Path to the races data file
RACES_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "races.json")

def read_races():
    """Read races data from JSON file"""
    try:
        with open(RACES_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def write_races(races_data):
    """Write races data to JSON file"""
    with open(RACES_FILE, "w") as f:
        json.dump(races_data, f, indent=2)

@router.get("/races")
async def get_races():
    """Get all races"""
    return read_races()

@router.get("/races/{race_id}")
async def get_race(race_id: int):
    """Get a specific race by ID"""
    races = read_races()
    for race in races:
        if race["id"] == race_id:
            return race
    raise HTTPException(status_code=404, detail=f"Race with ID {race_id} not found")

@router.post("/races")
async def create_race(race: Dict[str, Any]):
    """Create a new race"""
    races = read_races()
    
    # Assign a new ID (max existing ID + 1)
    race_ids = [r["id"] for r in races]
    race["id"] = max(race_ids or [0]) + 1
    
    races.append(race)
    write_races(races)
    return race

@router.put("/races/{race_id}")
async def update_race(race_id: int, updated_race: Dict[str, Any]):
    """Update an existing race"""
    races = read_races()
    
    for i, race in enumerate(races):
        if race["id"] == race_id:
            # Preserve the original ID
            updated_race["id"] = race_id
            races[i] = updated_race
            write_races(races)
            return updated_race
    
    raise HTTPException(status_code=404, detail=f"Race with ID {race_id} not found")

@router.delete("/races/{race_id}")
async def delete_race(race_id: int):
    """Delete a race"""
    races = read_races()
    
    for i, race in enumerate(races):
        if race["id"] == race_id:
            del races[i]
            write_races(races)
            return {"message": f"Race with ID {race_id} deleted"}
    
    raise HTTPException(status_code=404, detail=f"Race with ID {race_id} not found") 