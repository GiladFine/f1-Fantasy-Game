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
        // Check if trying to access sprint views when no sprint races exist
        if ((viewName === 'sprint-results' || viewName === 'sprint-qualifying-results') && 
            !appState.races.some(race => race.has_sprint)) {
            Utils.showError('No races with sprint sessions are currently available');
            return;
        }
        
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
            if (team.driver_ids && team.driver_ids.length > 0) {
                team.driver_ids.forEach(driverId => {
                    if (driverPoints[driverId]) {
                        teamPoints[team.id].totalPoints += driverPoints[driverId].totalPoints;
                    }
                });
            }
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
    },
    
    // Driver nationality mapping
    driverNationalities: {
        // Current drivers
        "Lando Norris": "gb",
        "Oscar Piastri": "au",
        "Charles Leclerc": "mc",
        "Lewis Hamilton": "gb",
        "Max Verstappen": "nl",
        "Liam Lawson": "nz",
        "George Russell": "gb",
        "Kimi Antonelli": "it",
        "Fernando Alonso": "es",
        "Lance Stroll": "ca",
        "Pierre Gasly": "fr",
        "Jack Doohan": "au",
        "Esteban Ocon": "fr",
        "Oliver Bearman": "gb",
        "Carlos Sainz": "es",
        "Alexander Albon": "th",
        "Yuki Tsunoda": "jp",
        "Isack Hadjar": "fr",
        "Nico Hulkenberg": "de",
        "Gabriel Bortoleto": "br",
        // Add any other drivers as needed
    },
    
    // Constructor logo mapping
    constructorLogos: {
        "McLaren": "frontend/images/logos/mclaren.png",
        "Ferrari": "frontend/images/logos/ferrari.png",
        "Red Bull": "frontend/images/logos/redbull.png",
        "Mercedes": "frontend/images/logos/mercedes.png",
        "Aston Martin": "frontend/images/logos/astonmartin.png",
        "Alpine": "frontend/images/logos/alpine.png",
        "Haas": "frontend/images/logos/haas.png",
        "Williams": "frontend/images/logos/williams.png",
        "Racing Bulls": "frontend/images/logos/racingbulls.png",
        "Kick Sauber": "frontend/images/logos/sauber.png"
    },
    
    // Get driver flag HTML
    getDriverFlagHtml(driverName) {
        const countryCode = this.driverNationalities[driverName] || '';
        if (!countryCode) return '';
        
        // Return flag emoji (works on most modern browsers and OS)
        // Convert country code to regional indicator symbols
        if (countryCode.length === 2) {
            // Convert each letter to the corresponding regional indicator symbol
            const flagEmoji = countryCode
                .toUpperCase()
                .split('')
                .map(char => String.fromCodePoint(char.charCodeAt(0) + 127397))
                .join('');
            
            return `<span class="driver-flag" title="${countryCode.toUpperCase()}">${flagEmoji}</span> `;
        }
        
        return '';
    },
    
    // Get driver name with flag
    getDriverNameWithFlag(driverName) {
        return `${this.getDriverFlagHtml(driverName)}${driverName}`;
    },
    
    // Get constructor logo HTML
    getConstructorLogoHtml(constructorName) {
        if (!constructorName || constructorName === 'N/A') return '';
        
        // Map of constructor names to their logo URLs
        const logoUrls = {
            "McLaren": "https://www.formula1.com/content/dam/fom-website/teams/2023/mclaren-logo.png.transform/2col/image.png",
            "Ferrari": "https://www.formula1.com/content/dam/fom-website/teams/2023/ferrari-logo.png.transform/2col/image.png",
            "Red Bull": "https://www.formula1.com/content/dam/fom-website/teams/2023/red-bull-racing-logo.png.transform/2col/image.png",
            "Mercedes": "https://www.formula1.com/content/dam/fom-website/teams/2023/mercedes-logo.png.transform/2col/image.png",
            "Aston Martin": "https://www.formula1.com/content/dam/fom-website/teams/2023/aston-martin-logo.png.transform/2col/image.png",
            "Alpine": "https://www.formula1.com/content/dam/fom-website/teams/2023/alpine-logo.png.transform/2col/image.png",
            "Haas": "https://www.formula1.com/content/dam/fom-website/teams/2023/haas-f1-team-logo.png.transform/2col/image.png",
            "Williams": "https://www.formula1.com/content/dam/fom-website/teams/2023/williams-logo.png.transform/2col/image.png",
            "Racing Bulls": "https://www.formula1.com/content/dam/fom-website/teams/2024/rb-logo.png.transform/2col/image.png",
            "Kick Sauber": "https://www.formula1.com/content/dam/fom-website/teams/2024/kick-sauber-logo.png.transform/2col/image.png"
        };
        
        // Fallback colors for the circle with initials
        const colors = {
            "McLaren": "#FF8700",
            "Ferrari": "#DC0000",
            "Red Bull": "#0600EF",
            "Mercedes": "#00D2BE",
            "Aston Martin": "#006F62",
            "Alpine": "#0090FF",
            "Haas": "#FFFFFF",
            "Williams": "#005AFF",
            "Racing Bulls": "#1E41FF",
            "Kick Sauber": "#900000"
        };
        
        const logoUrl = logoUrls[constructorName];
        if (logoUrl) {
            // Create an image with a fallback to the colored circle if the image fails to load
            const color = colors[constructorName] || "#999999";
            const initials = constructorName.split(' ').map(word => word[0]).join('');
            
            return `<img src="${logoUrl}" alt="${constructorName}" class="constructor-logo" title="${constructorName}" onerror="this.style.display='none'; var span = document.createElement('span'); span.className='constructor-logo-circle'; span.style.backgroundColor='${color}'; span.title='${constructorName}'; span.textContent='${initials}'; this.parentNode.insertBefore(span, this);">`;
        } else {
            // If no logo URL is available, use the colored circle
            const color = colors[constructorName] || "#999999";
            const initials = constructorName.split(' ').map(word => word[0]).join('');
            
            return `<span class="constructor-logo-circle" style="background-color: ${color};" title="${constructorName}">${initials}</span> `;
        }
    },
    
    // Get constructor name with logo
    getConstructorWithLogo(constructorName) {
        if (!constructorName || constructorName === 'N/A') return 'N/A';
        return `${this.getConstructorLogoHtml(constructorName)}${constructorName}`;
    }
};

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('Initializing F1 Fantasy application...');
    
    // Load all data
    const dataLoaded = await DataManager.loadAllData();
    
    if (!dataLoaded) {
        Utils.showError('Failed to load application data. Please check if the backend server is running.');
        return;
    }
    
    // Show or hide sprint-related menu items based on sprint races
    updateSprintMenuItems();
    
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

/**
 * Show or hide sprint-related menu items based on whether there are races with sprints
 */
function updateSprintMenuItems() {
    const hasSprintRaces = appState.races.some(race => race.has_sprint);
    
    // Get the sprint menu items
    const sprintResultsItem = document.querySelector('[data-view="sprint-results"]');
    const sprintQualifyingResultsItem = document.querySelector('[data-view="sprint-qualifying-results"]');
    
    if (sprintResultsItem && sprintQualifyingResultsItem) {
        // If no sprint races, add a disabled class to indicate they're not available
        if (!hasSprintRaces) {
            sprintResultsItem.classList.add('text-muted');
            sprintQualifyingResultsItem.classList.add('text-muted');
            
            // Add a tooltip to explain why these are disabled
            sprintResultsItem.setAttribute('title', 'No races with sprint sessions available');
            sprintQualifyingResultsItem.setAttribute('title', 'No races with sprint sessions available');
        } else {
            sprintResultsItem.classList.remove('text-muted');
            sprintQualifyingResultsItem.classList.remove('text-muted');
            
            sprintResultsItem.removeAttribute('title');
            sprintQualifyingResultsItem.removeAttribute('title');
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Make necessary objects available globally
window.Utils = Utils; 