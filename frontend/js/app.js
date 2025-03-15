/**
 * F1 Fantasy Game - Main Application
 * 
 * This is the main entry point for the application.
 * It handles navigation, view switching, and initializes the app.
 */

// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Application state
const appState = {
    currentView: 'dashboard',
    teams: [],
    drivers: [],
    races: [],
    raceResults: [],
    qualifyingResults: [],
    sprintResults: [],
    sprintQualifyingResults: [],
    
    // Cache for calculated data
    teamStandings: [],
    driverStandings: []
};

/**
 * API helper functions
 */
const API = {
    // Generic fetch wrapper
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    },
    
    // POST request helper
    async postData(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error posting to ${endpoint}:`, error);
            return null;
        }
    },
    
    // PUT request helper
    async putData(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error updating ${endpoint}:`, error);
            return null;
        }
    },
    
    // DELETE request helper
    async deleteData(endpoint) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error deleting ${endpoint}:`, error);
            return null;
        }
    },
    
    // Specific API endpoints
    async getTeams() {
        return this.fetchData('/teams');
    },
    
    async getDrivers() {
        return this.fetchData('/drivers');
    },
    
    async getRaces() {
        return this.fetchData('/races');
    },
    
    async getRaceResults() {
        return this.fetchData('/race-results');
    },
    
    async getQualifyingResults() {
        return this.fetchData('/qualifying-results');
    },
    
    async getSprintResults() {
        return this.fetchData('/sprint-results');
    },
    
    async getSprintQualifyingResults() {
        return this.fetchData('/sprint-qualifying-results');
    },
    
    async getFreeAgents() {
        return this.fetchData('/drivers/free-agents');
    }
};

/**
 * View management
 */
const ViewManager = {
    // Switch between views
    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view-content').forEach(view => {
            view.classList.remove('active-view');
        });
        
        // Show the selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active-view');
            appState.currentView = viewName;
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-view') === viewName) {
                    link.classList.add('active');
                }
            });
            
            // Initialize the view
            this.initializeView(viewName);
        }
    },
    
    // Initialize a specific view
    initializeView(viewName) {
        switch(viewName) {
            case 'dashboard':
                Dashboard.initialize();
                break;
            case 'teams':
                TeamsView.initialize();
                break;
            case 'drivers':
                DriversView.initialize();
                break;
            case 'races':
                RacesView.initialize();
                break;
            case 'race-results':
                ResultsView.initialize('race');
                break;
            case 'qualifying-results':
                ResultsView.initialize('qualifying');
                break;
            case 'sprint-results':
                ResultsView.initialize('sprint');
                break;
            case 'sprint-qualifying-results':
                ResultsView.initialize('sprint-qualifying');
                break;
        }
    }
};

/**
 * Data management
 */
const DataManager = {
    // Load all application data
    async loadAllData() {
        try {
            // Fetch all data in parallel
            const [teams, drivers, races, raceResults, qualifyingResults, sprintResults, sprintQualifyingResults] = 
                await Promise.all([
                    API.getTeams(),
                    API.getDrivers(),
                    API.getRaces(),
                    API.getRaceResults(),
                    API.getQualifyingResults(),
                    API.getSprintResults(),
                    API.getSprintQualifyingResults()
                ]);
            
            // Update app state with fetched data
            appState.teams = teams || [];
            appState.drivers = drivers || [];
            appState.races = races || [];
            appState.raceResults = raceResults || [];
            appState.qualifyingResults = qualifyingResults || [];
            appState.sprintResults = sprintResults || [];
            appState.sprintQualifyingResults = sprintQualifyingResults || [];
            
            // Calculate standings
            this.calculateStandings();
            
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    },
    
    // Calculate team and driver standings
    calculateStandings() {
        // Calculate driver standings
        const driverPoints = {};
        
        // Initialize points for all drivers
        appState.drivers.forEach(driver => {
            driverPoints[driver.id] = {
                driver: driver,
                totalPoints: 0
            };
        });
        
        // Add points from qualifying results
        appState.qualifyingResults.forEach(result => {
            if (driverPoints[result.driver_id]) {
                driverPoints[result.driver_id].totalPoints += result.fantasy_points || 0;
            }
        });
        
        // Add points from race results
        appState.raceResults.forEach(result => {
            if (driverPoints[result.driver_id]) {
                driverPoints[result.driver_id].totalPoints += result.fantasy_points || 0;
            }
        });
        
        // Add points from sprint qualifying
        appState.sprintQualifyingResults.forEach(result => {
            if (driverPoints[result.driver_id]) {
                driverPoints[result.driver_id].totalPoints += result.fantasy_points || 0;
            }
        });
        
        // Add points from sprint races
        appState.sprintResults.forEach(result => {
            if (driverPoints[result.driver_id]) {
                driverPoints[result.driver_id].totalPoints += result.fantasy_points || 0;
            }
        });
        
        // Convert to array and sort by points
        appState.driverStandings = Object.values(driverPoints).sort((a, b) => b.totalPoints - a.totalPoints);
        
        // Calculate team standings
        const teamPoints = {};
        
        // Initialize points for all teams
        appState.teams.forEach(team => {
            teamPoints[team.id] = {
                team: team,
                totalPoints: 0
            };
        });
        
        // Add up all driver points for each team
        appState.teams.forEach(team => {
            team.driver_ids.forEach(driverId => {
                if (driverPoints[driverId]) {
                    teamPoints[team.id].totalPoints += driverPoints[driverId].totalPoints;
                }
            });
        });
        
        // Convert to array and sort by points
        appState.teamStandings = Object.values(teamPoints).sort((a, b) => b.totalPoints - a.totalPoints);
    }
};

/**
 * Utility functions
 */
const Utils = {
    // Format date string to nicer display
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    // Get driver name by ID
    getDriverById(driverId) {
        return appState.drivers.find(d => d.id === driverId) || { name: 'Unknown' };
    },
    
    // Get race name by ID
    getRaceById(raceId) {
        return appState.races.find(r => r.id === raceId) || { name: 'Unknown Race' };
    },
    
    // Show error message
    showError(message) {
        alert(`Error: ${message}`);
    },
    
    // Show success message (can be enhanced with toast notifications)
    showSuccess(message) {
        alert(`Success: ${message}`);
    }
};

/**
 * Application initialization
 */
async function initializeApp() {
    console.log('Initializing F1 Fantasy application...');
    
    // Load all data
    const dataLoaded = await DataManager.loadAllData();
    
    if (!dataLoaded) {
        Utils.showError('Failed to load application data. Please check if the backend server is running.');
        return;
    }
    
    // Setup navigation event listeners
    document.querySelectorAll('[data-view]').forEach(navLink => {
        navLink.addEventListener('click', (event) => {
            event.preventDefault();
            const viewName = event.target.getAttribute('data-view');
            ViewManager.switchView(viewName);
        });
    });
    
    // Initialize the default view (dashboard)
    ViewManager.switchView('dashboard');
    
    console.log('Application initialized successfully!');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 