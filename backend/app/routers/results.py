from fastapi import APIRouter, HTTPException
import json
import os
from typing import Dict, Any, List

router = APIRouter()

# Paths to the results data files
RACE_RESULTS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "race_results.json")
SPRINT_RESULTS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "sprint_results.json")
QUALIFYING_RESULTS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "qualifying_results.json")
SPRINT_QUALIFYING_RESULTS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "sprint_qualifying_results.json")

# Helper functions to read and write data
def read_data(file_path):
    """Read data from JSON file"""
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def write_data(file_path, data):
    """Write data to JSON file"""
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)

# Race Results Endpoints
@router.get("/race-results")
async def get_race_results():
    """Get all race results"""
    return read_data(RACE_RESULTS_FILE)

@router.get("/race-results/race/{race_id}")
async def get_race_results_by_race(race_id: int):
    """Get race results for a specific race"""
    results = read_data(RACE_RESULTS_FILE)
    race_results = [r for r in results if r["race_id"] == race_id]
    return race_results

@router.post("/race-results")
async def create_race_result(result: Dict[str, Any]):
    """Create a new race result"""
    results = read_data(RACE_RESULTS_FILE)
    
    # Check if a result for this driver in this race already exists
    for existing_result in results:
        if (existing_result["race_id"] == result["race_id"] and 
            existing_result["driver_id"] == result["driver_id"]):
            # Found a duplicate, return an error
            raise HTTPException(
                status_code=400,
                detail=f"A race result for driver {result['driver_id']} in race {result['race_id']} already exists"
            )
    
    # Assign a new ID (max existing ID + 1)
    result_ids = [r["id"] for r in results]
    result["id"] = max(result_ids or [0]) + 1
    
    results.append(result)
    write_data(RACE_RESULTS_FILE, results)
    return result

@router.put("/race-results/{result_id}")
async def update_race_result(result_id: int, updated_result: Dict[str, Any]):
    """Update an existing race result"""
    results = read_data(RACE_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            # Preserve the original ID
            updated_result["id"] = result_id
            results[i] = updated_result
            write_data(RACE_RESULTS_FILE, results)
            return updated_result
    
    raise HTTPException(status_code=404, detail=f"Race result with ID {result_id} not found")

@router.delete("/race-results/{result_id}")
async def delete_race_result(result_id: int):
    """Delete a race result"""
    results = read_data(RACE_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            del results[i]
            write_data(RACE_RESULTS_FILE, results)
            return {"message": f"Race result with ID {result_id} deleted"}
    
    raise HTTPException(status_code=404, detail=f"Race result with ID {result_id} not found")

# Sprint Results Endpoints
@router.get("/sprint-results")
async def get_sprint_results():
    """Get all sprint results"""
    return read_data(SPRINT_RESULTS_FILE)

@router.get("/sprint-results/race/{race_id}")
async def get_sprint_results_by_race(race_id: int):
    """Get sprint results for a specific race"""
    results = read_data(SPRINT_RESULTS_FILE)
    sprint_results = [r for r in results if r["race_id"] == race_id]
    return sprint_results

@router.post("/sprint-results")
async def create_sprint_result(result: Dict[str, Any]):
    """Create a new sprint result"""
    results = read_data(SPRINT_RESULTS_FILE)
    
    # Check if a result for this driver in this race already exists
    for existing_result in results:
        if (existing_result["race_id"] == result["race_id"] and 
            existing_result["driver_id"] == result["driver_id"]):
            # Found a duplicate, return an error
            raise HTTPException(
                status_code=400,
                detail=f"A sprint result for driver {result['driver_id']} in race {result['race_id']} already exists"
            )
    
    # Assign a new ID (max existing ID + 1)
    result_ids = [r["id"] for r in results]
    result["id"] = max(result_ids or [0]) + 1
    
    results.append(result)
    write_data(SPRINT_RESULTS_FILE, results)
    return result

@router.put("/sprint-results/{result_id}")
async def update_sprint_result(result_id: int, updated_result: Dict[str, Any]):
    """Update an existing sprint result"""
    results = read_data(SPRINT_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            # Preserve the original ID
            updated_result["id"] = result_id
            results[i] = updated_result
            write_data(SPRINT_RESULTS_FILE, results)
            return updated_result
    
    raise HTTPException(status_code=404, detail=f"Sprint result with ID {result_id} not found")

@router.delete("/sprint-results/{result_id}")
async def delete_sprint_result(result_id: int):
    """Delete a sprint result"""
    results = read_data(SPRINT_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            del results[i]
            write_data(SPRINT_RESULTS_FILE, results)
            return {"message": f"Sprint result with ID {result_id} deleted"}
    
    raise HTTPException(status_code=404, detail=f"Sprint result with ID {result_id} not found")

# Qualifying Results Endpoints
@router.get("/qualifying-results")
async def get_qualifying_results():
    """Get all qualifying results"""
    return read_data(QUALIFYING_RESULTS_FILE)

@router.get("/qualifying-results/race/{race_id}")
async def get_qualifying_results_by_race(race_id: int):
    """Get qualifying results for a specific race"""
    results = read_data(QUALIFYING_RESULTS_FILE)
    qualifying_results = [r for r in results if r["race_id"] == race_id]
    return qualifying_results

@router.post("/qualifying-results")
async def create_qualifying_result(result: Dict[str, Any]):
    """Create a new qualifying result"""
    results = read_data(QUALIFYING_RESULTS_FILE)
    
    # Check if a result for this driver in this race already exists
    for existing_result in results:
        if (existing_result["race_id"] == result["race_id"] and 
            existing_result["driver_id"] == result["driver_id"]):
            # Found a duplicate, return an error
            raise HTTPException(
                status_code=400,
                detail=f"A qualifying result for driver {result['driver_id']} in race {result['race_id']} already exists"
            )
    
    # Assign a new ID (max existing ID + 1)
    result_ids = [r["id"] for r in results]
    result["id"] = max(result_ids or [0]) + 1
    
    results.append(result)
    write_data(QUALIFYING_RESULTS_FILE, results)
    return result

@router.put("/qualifying-results/{result_id}")
async def update_qualifying_result(result_id: int, updated_result: Dict[str, Any]):
    """Update an existing qualifying result"""
    results = read_data(QUALIFYING_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            # Preserve the original ID
            updated_result["id"] = result_id
            results[i] = updated_result
            write_data(QUALIFYING_RESULTS_FILE, results)
            return updated_result
    
    raise HTTPException(status_code=404, detail=f"Qualifying result with ID {result_id} not found")

@router.delete("/qualifying-results/{result_id}")
async def delete_qualifying_result(result_id: int):
    """Delete a qualifying result"""
    results = read_data(QUALIFYING_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            del results[i]
            write_data(QUALIFYING_RESULTS_FILE, results)
            return {"message": f"Qualifying result with ID {result_id} deleted"}
    
    raise HTTPException(status_code=404, detail=f"Qualifying result with ID {result_id} not found")

# Sprint Qualifying Results Endpoints
@router.get("/sprint-qualifying-results")
async def get_sprint_qualifying_results():
    """Get all sprint qualifying results"""
    return read_data(SPRINT_QUALIFYING_RESULTS_FILE)

@router.get("/sprint-qualifying-results/race/{race_id}")
async def get_sprint_qualifying_results_by_race(race_id: int):
    """Get sprint qualifying results for a specific race"""
    results = read_data(SPRINT_QUALIFYING_RESULTS_FILE)
    sprint_qualifying_results = [r for r in results if r["race_id"] == race_id]
    return sprint_qualifying_results

@router.post("/sprint-qualifying-results")
async def create_sprint_qualifying_result(result: Dict[str, Any]):
    """Create a new sprint qualifying result"""
    results = read_data(SPRINT_QUALIFYING_RESULTS_FILE)
    
    # Check if a result for this driver in this race already exists
    for existing_result in results:
        if (existing_result["race_id"] == result["race_id"] and 
            existing_result["driver_id"] == result["driver_id"]):
            # Found a duplicate, return an error
            raise HTTPException(
                status_code=400,
                detail=f"A sprint qualifying result for driver {result['driver_id']} in race {result['race_id']} already exists"
            )
    
    # Assign a new ID (max existing ID + 1)
    result_ids = [r["id"] for r in results]
    result["id"] = max(result_ids or [0]) + 1
    
    results.append(result)
    write_data(SPRINT_QUALIFYING_RESULTS_FILE, results)
    return result

@router.put("/sprint-qualifying-results/{result_id}")
async def update_sprint_qualifying_result(result_id: int, updated_result: Dict[str, Any]):
    """Update an existing sprint qualifying result"""
    results = read_data(SPRINT_QUALIFYING_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            # Preserve the original ID
            updated_result["id"] = result_id
            results[i] = updated_result
            write_data(SPRINT_QUALIFYING_RESULTS_FILE, results)
            return updated_result
    
    raise HTTPException(
        status_code=404, 
        detail=f"Sprint qualifying result with ID {result_id} not found"
    )

@router.delete("/sprint-qualifying-results/{result_id}")
async def delete_sprint_qualifying_result(result_id: int):
    """Delete a sprint qualifying result"""
    results = read_data(SPRINT_QUALIFYING_RESULTS_FILE)
    
    for i, result in enumerate(results):
        if result["id"] == result_id:
            del results[i]
            write_data(SPRINT_QUALIFYING_RESULTS_FILE, results)
            return {"message": f"Sprint qualifying result with ID {result_id} deleted"}
    
    raise HTTPException(
        status_code=404, 
        detail=f"Sprint qualifying result with ID {result_id} not found"
    ) 