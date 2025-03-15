/**
 * Results View
 * 
 * Handles the results views for race, qualifying, sprint, and sprint qualifying results.
 */

const ResultsView = {
    /**
     * Initialize the results view
     * @param {string} type - Type of results to display ('race', 'qualifying', 'sprint', 'sprint-qualifying')
     */
    initialize: function(type = 'race') {
        console.log(`Initializing ${type} results view...`);
        this.currentType = type;
        this.renderResults();
        this.setupEventListeners();
    },
    
    /**
     * Render the results in the view
     */
    renderResults: function() {
        // Determine which view to render based on type
        let viewId, title, resultsData;
        
        switch (this.currentType) {
            case 'race':
                viewId = 'race-results-view';
                title = 'Race Results';
                resultsData = appState.raceResults;
                break;
            case 'qualifying':
                viewId = 'qualifying-results-view';
                title = 'Qualifying Results';
                resultsData = appState.qualifyingResults;
                break;
            case 'sprint':
                viewId = 'sprint-results-view';
                title = 'Sprint Results';
                resultsData = appState.sprintResults;
                break;
            case 'sprint-qualifying':
                viewId = 'sprint-qualifying-results-view';
                title = 'Sprint Qualifying Results';
                resultsData = appState.sprintQualifyingResults;
                break;
            default:
                viewId = 'race-results-view';
                title = 'Race Results';
                resultsData = appState.raceResults;
        }
        
        // Get the view container
        const resultsView = document.getElementById(viewId);
        
        // Render the view
        resultsView.innerHTML = `
            <h2>${title}</h2>
            <div class="row mb-4">
                <div class="col-12">
                    <button id="add-result-btn" class="btn btn-primary">Add Result</button>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="form-group">
                        <label for="race-filter">Filter by Race</label>
                        <select class="form-select" id="race-filter">
                            <option value="">All Races</option>
                            ${this.renderRaceOptions()}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table table-striped" id="results-table">
                    <thead>
                        <tr>
                            <th>Race</th>
                            <th>Driver</th>
                            <th>Position</th>
                            ${this.currentType === 'race' ? '<th>Fastest Lap</th><th>Finished</th>' : ''}
                            <th>Fantasy Points</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Results will be rendered here -->
                    </tbody>
                </table>
            </div>
        `;
        
        // Render the results
        this.renderResultsTable(resultsData);
    },
    
    /**
     * Render the race options for the filter dropdown
     * @returns {string} - HTML string of option elements
     */
    renderRaceOptions: function() {
        let options = '';
        
        // Sort races by date
        const sortedRaces = [...appState.races].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        sortedRaces.forEach(race => {
            options += `<option value="${race.id}">${race.name}</option>`;
        });
        
        return options;
    },
    
    /**
     * Render the results table
     * @param {Array} resultsData - Array of result objects
     * @param {number} raceId - Optional race ID to filter by
     */
    renderResultsTable: function(resultsData, raceId = null) {
        const tableBody = document.querySelector('#results-table tbody');
        tableBody.innerHTML = '';
        
        // Filter by race if specified
        let filteredResults = resultsData;
        if (raceId) {
            filteredResults = resultsData.filter(result => result.race_id === parseInt(raceId));
        }
        
        // Sort by race and then by position
        filteredResults.sort((a, b) => {
            if (a.race_id !== b.race_id) {
                return a.race_id - b.race_id;
            }
            return a.position - b.position;
        });
        
        // Render each result
        filteredResults.forEach(result => {
            const race = Utils.getRaceById(result.race_id);
            const driver = Utils.getDriverById(result.driver_id);
            
            const row = document.createElement('tr');
            row.setAttribute('data-result-id', result.id);
            
            // Race column
            const raceCell = document.createElement('td');
            raceCell.textContent = race.name;
            row.appendChild(raceCell);
            
            // Driver column
            const driverCell = document.createElement('td');
            driverCell.textContent = driver.name;
            row.appendChild(driverCell);
            
            // Position column
            const positionCell = document.createElement('td');
            positionCell.textContent = result.position;
            row.appendChild(positionCell);
            
            // Additional columns for race results
            if (this.currentType === 'race') {
                // Fastest lap column
                const fastestLapCell = document.createElement('td');
                fastestLapCell.textContent = result.fastest_lap ? 'Yes' : 'No';
                row.appendChild(fastestLapCell);
                
                // Finished column
                const finishedCell = document.createElement('td');
                finishedCell.textContent = result.finished ? 'Yes' : 'No';
                row.appendChild(finishedCell);
            }
            
            // Fantasy points column
            const pointsCell = document.createElement('td');
            pointsCell.textContent = result.fantasy_points || 0;
            row.appendChild(pointsCell);
            
            // Actions column
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-outline-primary edit-result-btn">Edit</button>
                <button class="btn btn-sm btn-outline-danger delete-result-btn">Delete</button>
            `;
            row.appendChild(actionsCell);
            
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Set up event listeners for the results view
     */
    setupEventListeners: function() {
        // Add result button
        const addResultBtn = document.getElementById('add-result-btn');
        if (addResultBtn) {
            addResultBtn.addEventListener('click', this.showAddResultModal.bind(this));
        }
        
        // Race filter
        const raceFilter = document.getElementById('race-filter');
        if (raceFilter) {
            raceFilter.addEventListener('change', () => {
                const raceId = raceFilter.value ? parseInt(raceFilter.value) : null;
                
                // Get the appropriate results data based on type
                let resultsData;
                switch (this.currentType) {
                    case 'race':
                        resultsData = appState.raceResults;
                        break;
                    case 'qualifying':
                        resultsData = appState.qualifyingResults;
                        break;
                    case 'sprint':
                        resultsData = appState.sprintResults;
                        break;
                    case 'sprint-qualifying':
                        resultsData = appState.sprintQualifyingResults;
                        break;
                    default:
                        resultsData = appState.raceResults;
                }
                
                this.renderResultsTable(resultsData, raceId);
                this.setupResultActionListeners();
            });
        }
        
        // Set up action listeners for edit and delete buttons
        this.setupResultActionListeners();
    },
    
    /**
     * Set up event listeners for result action buttons
     */
    setupResultActionListeners: function() {
        // Edit result buttons
        const editResultBtns = document.querySelectorAll('.edit-result-btn');
        editResultBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const row = event.target.closest('tr');
                const resultId = parseInt(row.getAttribute('data-result-id'));
                this.showEditResultModal(resultId);
            });
        });
        
        // Delete result buttons
        const deleteResultBtns = document.querySelectorAll('.delete-result-btn');
        deleteResultBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const row = event.target.closest('tr');
                const resultId = parseInt(row.getAttribute('data-result-id'));
                this.deleteResult(resultId);
            });
        });
    },
    
    /**
     * Show modal for adding a new result
     */
    showAddResultModal: function() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="result-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New ${this.getResultTypeTitle()} Result</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="result-form">
                                <div class="mb-3">
                                    <label for="result-race" class="form-label">Race</label>
                                    <select class="form-select" id="result-race" required>
                                        <option value="">Select a race</option>
                                        ${this.renderRaceOptions()}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="result-driver" class="form-label">Driver</label>
                                    <select class="form-select" id="result-driver" required>
                                        <option value="">Select a driver</option>
                                        ${this.renderDriverOptions()}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="result-position" class="form-label">Position</label>
                                    <input type="number" class="form-control" id="result-position" min="1" max="20" required>
                                </div>
                                ${this.currentType === 'race' ? `
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="result-fastest-lap">
                                    <label class="form-check-label" for="result-fastest-lap">Fastest Lap</label>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="result-finished" checked>
                                    <label class="form-check-label" for="result-finished">Finished Race</label>
                                </div>
                                ` : ''}
                                <div class="mb-3">
                                    <label for="result-fantasy-points" class="form-label">Fantasy Points</label>
                                    <input type="number" class="form-control" id="result-fantasy-points" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-result-btn">Save Result</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('result-modal'));
        modal.show();
        
        // Add event listener for save button
        document.getElementById('save-result-btn').addEventListener('click', this.saveResult.bind(this));
        
        // Add event listeners for position and fantasy points calculation
        const positionInput = document.getElementById('result-position');
        if (positionInput) {
            positionInput.addEventListener('change', this.calculateFantasyPoints.bind(this));
        }
        
        // Add event listeners for fastest lap and finished checkboxes if they exist
        const fastestLapCheckbox = document.getElementById('result-fastest-lap');
        const finishedCheckbox = document.getElementById('result-finished');
        
        if (fastestLapCheckbox) {
            fastestLapCheckbox.addEventListener('change', this.calculateFantasyPoints.bind(this));
        }
        
        if (finishedCheckbox) {
            finishedCheckbox.addEventListener('change', this.calculateFantasyPoints.bind(this));
        }
        
        // Remove modal from DOM when hidden
        document.getElementById('result-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Show modal for editing an existing result
     * @param {number} resultId - ID of the result to edit
     */
    showEditResultModal: function(resultId) {
        // Get the result data based on type
        let result;
        switch (this.currentType) {
            case 'race':
                result = appState.raceResults.find(r => r.id === resultId);
                break;
            case 'qualifying':
                result = appState.qualifyingResults.find(r => r.id === resultId);
                break;
            case 'sprint':
                result = appState.sprintResults.find(r => r.id === resultId);
                break;
            case 'sprint-qualifying':
                result = appState.sprintQualifyingResults.find(r => r.id === resultId);
                break;
            default:
                result = appState.raceResults.find(r => r.id === resultId);
        }
        
        if (!result) {
            Utils.showError('Result not found');
            return;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="result-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit ${this.getResultTypeTitle()} Result</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="result-form" data-result-id="${result.id}">
                                <div class="mb-3">
                                    <label for="result-race" class="form-label">Race</label>
                                    <select class="form-select" id="result-race" required>
                                        <option value="">Select a race</option>
                                        ${this.renderRaceOptions(result.race_id)}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="result-driver" class="form-label">Driver</label>
                                    <select class="form-select" id="result-driver" required>
                                        <option value="">Select a driver</option>
                                        ${this.renderDriverOptions(result.driver_id)}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="result-position" class="form-label">Position</label>
                                    <input type="number" class="form-control" id="result-position" min="1" max="20" value="${result.position}" required>
                                </div>
                                ${this.currentType === 'race' ? `
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="result-fastest-lap" ${result.fastest_lap ? 'checked' : ''}>
                                    <label class="form-check-label" for="result-fastest-lap">Fastest Lap</label>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="result-finished" ${result.finished ? 'checked' : ''}>
                                    <label class="form-check-label" for="result-finished">Finished Race</label>
                                </div>
                                ` : ''}
                                <div class="mb-3">
                                    <label for="result-fantasy-points" class="form-label">Fantasy Points</label>
                                    <input type="number" class="form-control" id="result-fantasy-points" value="${result.fantasy_points || 0}" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-result-btn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Set the selected values for race and driver
        document.getElementById('result-race').value = result.race_id;
        document.getElementById('result-driver').value = result.driver_id;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('result-modal'));
        modal.show();
        
        // Add event listener for save button
        document.getElementById('save-result-btn').addEventListener('click', this.saveResult.bind(this));
        
        // Add event listeners for position and fantasy points calculation
        const positionInput = document.getElementById('result-position');
        if (positionInput) {
            positionInput.addEventListener('change', this.calculateFantasyPoints.bind(this));
        }
        
        // Add event listeners for fastest lap and finished checkboxes if they exist
        const fastestLapCheckbox = document.getElementById('result-fastest-lap');
        const finishedCheckbox = document.getElementById('result-finished');
        
        if (fastestLapCheckbox) {
            fastestLapCheckbox.addEventListener('change', this.calculateFantasyPoints.bind(this));
        }
        
        if (finishedCheckbox) {
            finishedCheckbox.addEventListener('change', this.calculateFantasyPoints.bind(this));
        }
        
        // Remove modal from DOM when hidden
        document.getElementById('result-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Calculate fantasy points based on form inputs
     */
    calculateFantasyPoints: function() {
        // Get form values
        const position = parseInt(document.getElementById('result-position').value);
        
        if (isNaN(position)) return;
        
        let points = 0;
        
        // Calculate points based on result type
        switch (this.currentType) {
            case 'race':
                const fastestLap = document.getElementById('result-fastest-lap').checked;
                const finished = document.getElementById('result-finished').checked;
                
                // Race points
                points = ScoringSystem.calculateRacePoints(position, fastestLap);
                
                // DNF penalty
                if (!finished) {
                    points += ScoringSystem.calculateDNFPenalty(finished);
                }
                
                // Position gain points would be calculated here if we had qualifying position
                break;
            case 'qualifying':
                points = ScoringSystem.calculateQualifyingPoints(position);
                break;
            case 'sprint':
                points = ScoringSystem.calculateSprintPoints(position);
                break;
            case 'sprint-qualifying':
                points = ScoringSystem.calculateQualifyingPoints(position);
                break;
        }
        
        // Update fantasy points input
        document.getElementById('result-fantasy-points').value = points;
    },
    
    /**
     * Render the driver options for the select dropdown
     * @param {number} selectedDriverId - Optional driver ID to pre-select
     * @returns {string} - HTML string of option elements
     */
    renderDriverOptions: function(selectedDriverId = null) {
        let options = '';
        
        // Sort drivers by name
        const sortedDrivers = [...appState.drivers].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        sortedDrivers.forEach(driver => {
            const selected = selectedDriverId === driver.id ? 'selected' : '';
            options += `<option value="${driver.id}" ${selected}>${driver.name}</option>`;
        });
        
        return options;
    },
    
    /**
     * Get the title for the current result type
     * @returns {string} - Title string
     */
    getResultTypeTitle: function() {
        switch (this.currentType) {
            case 'race':
                return 'Race';
            case 'qualifying':
                return 'Qualifying';
            case 'sprint':
                return 'Sprint';
            case 'sprint-qualifying':
                return 'Sprint Qualifying';
            default:
                return 'Race';
        }
    },
    
    /**
     * Get the endpoint for the current result type
     * @returns {string} - API endpoint
     */
    getResultEndpoint: function() {
        switch (this.currentType) {
            case 'race':
                return '/race-results';
            case 'qualifying':
                return '/qualifying-results';
            case 'sprint':
                return '/sprint-results';
            case 'sprint-qualifying':
                return '/sprint-qualifying-results';
            default:
                return '/race-results';
        }
    },
    
    /**
     * Get the app state array for the current result type
     * @returns {Array} - Array of results
     */
    getResultsArray: function() {
        switch (this.currentType) {
            case 'race':
                return appState.raceResults;
            case 'qualifying':
                return appState.qualifyingResults;
            case 'sprint':
                return appState.sprintResults;
            case 'sprint-qualifying':
                return appState.sprintQualifyingResults;
            default:
                return appState.raceResults;
        }
    },
    
    /**
     * Save a result (create new or update existing)
     */
    saveResult: async function() {
        const form = document.getElementById('result-form');
        const resultId = form.getAttribute('data-result-id');
        const isEdit = !!resultId;
        
        // Get form values
        const raceId = parseInt(document.getElementById('result-race').value);
        const driverId = parseInt(document.getElementById('result-driver').value);
        const position = parseInt(document.getElementById('result-position').value);
        const fantasyPoints = parseInt(document.getElementById('result-fantasy-points').value);
        
        // Validate
        if (isNaN(raceId) || isNaN(driverId) || isNaN(position) || isNaN(fantasyPoints)) {
            Utils.showError('Please fill in all required fields');
            return;
        }
        
        // Prepare result data
        const resultData = {
            race_id: raceId,
            driver_id: driverId,
            position: position,
            fantasy_points: fantasyPoints
        };
        
        // Add race-specific fields if applicable
        if (this.currentType === 'race') {
            resultData.fastest_lap = document.getElementById('result-fastest-lap').checked;
            resultData.finished = document.getElementById('result-finished').checked;
        }
        
        try {
            let result;
            const endpoint = this.getResultEndpoint();
            
            if (isEdit) {
                // Update existing result
                result = await API.putData(`${endpoint}/${resultId}`, resultData);
                
                // Update in app state
                const resultsArray = this.getResultsArray();
                const index = resultsArray.findIndex(r => r.id === parseInt(resultId));
                if (index !== -1) {
                    resultsArray[index] = result;
                }
                
                Utils.showSuccess('Result updated successfully');
            } else {
                // Create new result
                result = await API.postData(endpoint, resultData);
                
                // Add to app state
                this.getResultsArray().push(result);
                
                Utils.showSuccess('Result created successfully');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('result-modal'));
            modal.hide();
            
            // Refresh view
            this.renderResults();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
        } catch (error) {
            Utils.showError('Failed to save result');
            console.error(error);
        }
    },
    
    /**
     * Delete a result
     * @param {number} resultId - ID of the result to delete
     */
    deleteResult: async function(resultId) {
        if (!confirm('Are you sure you want to delete this result?')) {
            return;
        }
        
        try {
            const endpoint = this.getResultEndpoint();
            await API.deleteData(`${endpoint}/${resultId}`);
            
            // Remove from app state
            const resultsArray = this.getResultsArray();
            const index = resultsArray.findIndex(r => r.id === resultId);
            if (index !== -1) {
                resultsArray.splice(index, 1);
            }
            
            // Refresh view
            this.renderResults();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
            
            Utils.showSuccess('Result deleted successfully');
        } catch (error) {
            Utils.showError('Failed to delete result');
            console.error(error);
        }
    }
};

// Make the ResultsView object available globally
window.ResultsView = ResultsView; 