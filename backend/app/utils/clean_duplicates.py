"""
Utility script to clean duplicate entries from data files.
This is a one-time fix to ensure data integrity.
"""
import json
import os
import sys

# Add the parent directory to the sys.path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Define file paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RACE_RESULTS_FILE = os.path.join(DATA_DIR, "race_results.json")
SPRINT_RESULTS_FILE = os.path.join(DATA_DIR, "sprint_results.json")
QUALIFYING_RESULTS_FILE = os.path.join(DATA_DIR, "qualifying_results.json")
SPRINT_QUALIFYING_RESULTS_FILE = os.path.join(DATA_DIR, "sprint_qualifying_results.json")

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

def clean_duplicates(file_path):
    """
    Clean duplicate entries from a data file.
    A duplicate is defined as an entry with the same race_id and driver_id.
    """
    results = read_data(file_path)
    print(f"Found {len(results)} entries in {os.path.basename(file_path)}")
    
    # Create a set to track unique race_id + driver_id combinations
    seen_combinations = set()
    unique_results = []
    duplicates_found = 0
    
    for result in results:
        # Create a unique key for this race and driver combination
        key = (result.get("race_id"), result.get("driver_id"))
        
        if key not in seen_combinations:
            seen_combinations.add(key)
            unique_results.append(result)
        else:
            duplicates_found += 1
            print(
                f"Found duplicate: Race ID {result.get('race_id')}, "
                f"Driver ID {result.get('driver_id')}, "
                f"Result ID {result.get('id')}"
            )
    
    # Only write if duplicates were found
    if duplicates_found > 0:
        # Create a backup of the original file
        backup_file = f"{file_path}.bak"
        with open(backup_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"Created backup at {backup_file}")
        
        # Write the cleaned data
        write_data(file_path, unique_results)
        print(
            f"Removed {duplicates_found} duplicates from "
            f"{os.path.basename(file_path)}"
        )
        print(f"New file has {len(unique_results)} entries")
    else:
        print(f"No duplicates found in {os.path.basename(file_path)}")
    
    return duplicates_found

def main():
    """Clean duplicates from all data files"""
    print("Starting duplicate cleanup process...")
    
    # Clean each file
    files_to_clean = [
        RACE_RESULTS_FILE,
        SPRINT_RESULTS_FILE,
        QUALIFYING_RESULTS_FILE,
        SPRINT_QUALIFYING_RESULTS_FILE
    ]
    
    total_duplicates = 0
    for file_path in files_to_clean:
        if os.path.exists(file_path):
            print(f"\nProcessing {os.path.basename(file_path)}...")
            duplicates = clean_duplicates(file_path)
            total_duplicates += duplicates
        else:
            print(f"\nFile not found: {file_path}")
    
    print(f"\nCleanup complete. Removed {total_duplicates} duplicates in total.")

if __name__ == "__main__":
    main() 