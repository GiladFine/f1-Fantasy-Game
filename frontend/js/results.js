/**
 * Results View
 * 
 * Handles the results views for race, qualifying, sprint, and sprint qualifying results.
 */

const ResultsView = {
    // Track render count
    renderCounter: 0,
    
    /**
     * Initialize the results view
     * @param {string} type - Type of results to display ('race', 'qualifying', 'sprint', 'sprint-qualifying')
     */
    initialize: function(type = 'race') {
        console.log(`=== INITIALIZING ${type.toUpperCase()} RESULTS VIEW ===`);
        console.log('Previous type:', this.currentType);
        console.log('New type:', type);
        
        // Log the state of the results data
        console.log('Race results count:', appState.raceResults ? appState.raceResults.length : 0);
        console.log('Qualifying results count:', appState.qualifyingResults ? appState.qualifyingResults.length : 0);
        console.log('Sprint results count:', appState.sprintResults ? appState.sprintResults.length : 0);
        console.log('Sprint qualifying results count:', appState.sprintQualifyingResults ? appState.sprintQualifyingResults.length : 0);
        
        // Store the previous type before updating
        const previousType = this.currentType;
        
        // Update the current type
        this.currentType = type;
        
        // Reset render counter
        this.renderCounter = 0;
        
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        // Check if sprint/sprint-qualifying is requested but no races have sprints
        if ((type === 'sprint' || type === 'sprint-qualifying') && !this.hasSprintRaces()) {
            console.log('No sprint races found, showing message');
            // Show message that no races have sprints
            this.renderNoSprintMessage();
            
            // Make sure we set up event listeners even for the no-sprint message view
            this.setupEventListeners();
            
            console.log(`=== FINISHED INITIALIZING ${type.toUpperCase()} RESULTS VIEW (NO SPRINT RACES) ===`);
            return;
        }
        
        this.renderResults();
        this.setupEventListeners();
        console.log(`=== FINISHED INITIALIZING ${type.toUpperCase()} RESULTS VIEW ===`);
    },
    
    /**
     * Set up global event listeners that persist across view changes
     */
    setupGlobalEventListeners: function() {
        // Remove any existing global listeners
        document.removeEventListener('change', this.handleGlobalRaceFilterChange);
        document.removeEventListener('click', this.handleGlobalAddResultClick);
        
        // Add global event listener for race filter changes
        document.addEventListener('change', this.handleGlobalRaceFilterChange.bind(this));
        
        // Add global event listener for Add Result button clicks
        document.addEventListener('click', this.handleGlobalAddResultClick.bind(this));
        
        // Disconnect any existing observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Set up a simpler MutationObserver to detect when the race filter is added to the DOM
        const self = this;
        this.observer = new MutationObserver(function(mutations) {
            const raceFilter = document.getElementById('race-filter');
            if (raceFilter) {
                console.log('MutationObserver: Race filter detected in DOM');
                
                // Disconnect observer once we've found the element
                self.observer.disconnect();
                
                // Add a direct event listener
                raceFilter.addEventListener('change', function() {
                    console.log('MutationObserver: Race filter change event detected');
                    const raceId = this.value ? parseInt(this.value) : null;
                    console.log('MutationObserver: Selected Race ID:', raceId);
                    
                    // Use the helper function to handle filtering
                    self.handleRaceFiltering(raceId);
                });
            }
        });
        
        // Start observing the document
        this.observer.observe(document.body, { childList: true, subtree: true });
        console.log('MutationObserver started');
    },
    
    /**
     * Handle global race filter change events
     * @param {Event} event - Change event
     */
    handleGlobalRaceFilterChange: function(event) {
        // Check if this is a race filter change
        if (event.target && event.target.classList.contains('race-filter')) {
            console.log('=== GLOBAL RACE FILTER CHANGE ===');
            console.log('Target ID:', event.target.id);
            
            const raceFilter = event.target;
            const raceId = raceFilter.value ? parseInt(raceFilter.value) : null;
            console.log('Global race filter change - Race ID:', raceId);
            
            // Get the view type from the data attribute
            const viewType = raceFilter.getAttribute('data-view-type');
            console.log('View type from data attribute:', viewType);
            
            // Update current type if needed
            if (viewType && viewType !== this.currentType) {
                console.log('Updating current type from', this.currentType, 'to', viewType);
                this.currentType = viewType;
            }
            
            // Use the helper function to handle filtering
            this.handleRaceFiltering(raceId);
            console.log('=== END GLOBAL RACE FILTER CHANGE ===');
        }
    },
    
    /**
     * Check if there are any races with sprints
     * @returns {boolean} - True if at least one race has a sprint
     */
    hasSprintRaces: function() {
        return appState.races.some(race => race.has_sprint);
    },
    
    /**
     * Render a message when there are no sprint races
     */
    renderNoSprintMessage: function() {
        const viewId = this.currentType === 'sprint' ? 'sprint-results-view' : 'sprint-qualifying-results-view';
        const title = this.currentType === 'sprint' ? 'Sprint Results' : 'Sprint Qualifying Results';
        
        const resultsView = document.getElementById(viewId);
        resultsView.innerHTML = `
            <h2>${title}</h2>
            <div class="row mb-4">
                <div class="col-12">
                    <button id="add-result-btn" class="btn btn-primary">Add Result</button>
                </div>
            </div>
            <div class="alert alert-info mt-4">
                No races with sprint sessions available. Only races with sprint sessions will appear here.
            </div>
        `;
        
        // Set up event listener for the Add Result button
        const addResultBtn = document.getElementById('add-result-btn');
        if (addResultBtn) {
            // Store a reference to this for use in the event handler
            const self = this;
            
            // Add event listener with explicit binding
            addResultBtn.addEventListener('click', function(event) {
                console.log('Add result button clicked from no-sprint message view for type:', self.currentType);
                self.showAddResultModal.call(self);
            });
            
            console.log('Event listener added to add result button in no-sprint message view');
        }
    },
    
    /**
     * Render the results in the view
     */
    renderResults: function() {
        // Increment render counter
        this.renderCounter++;
        console.log(`=== RENDERING RESULTS VIEW (${this.renderCounter}) ===`);
        console.log('Current type:', this.currentType);
        
        // Determine which view to render based on type
        let viewId, title, resultsData;
        
        switch (this.currentType) {
            case 'race':
                viewId = 'race-results-view';
                title = 'Race Results';
                resultsData = appState.raceResults;
                console.log('Using race results data, count:', appState.raceResults.length);
                break;
            case 'qualifying':
                viewId = 'qualifying-results-view';
                title = 'Qualifying Results';
                resultsData = appState.qualifyingResults;
                console.log('Using qualifying results data, count:', appState.qualifyingResults.length);
                break;
            case 'sprint':
                viewId = 'sprint-results-view';
                title = 'Sprint Results';
                resultsData = appState.sprintResults;
                console.log('Using sprint results data, count:', appState.sprintResults.length);
                break;
            case 'sprint-qualifying':
                viewId = 'sprint-qualifying-results-view';
                title = 'Sprint Qualifying Results';
                resultsData = appState.sprintQualifyingResults;
                console.log('Using sprint qualifying results data, count:', appState.sprintQualifyingResults.length);
                break;
            default:
                viewId = 'race-results-view';
                title = 'Race Results';
                resultsData = appState.raceResults;
                console.log('Using default (race) results data, count:', appState.raceResults.length);
        }
        
        // Get the view container
        const resultsView = document.getElementById(viewId);
        console.log('Results view container:', resultsView);
        
        if (!resultsView) {
            console.error(`Results view container with ID "${viewId}" not found in the DOM`);
            return;
        }
        
        console.log('Rendering HTML for view:', viewId);
        
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
                        <label for="race-filter-${this.currentType}">Filter by Race</label>
                        <select class="form-select race-filter" id="race-filter-${this.currentType}" data-view-type="${this.currentType}">
                            <option value="">All Races</option>
                            ${this.renderRaceOptions()}
                        </select>
                    </div>
                </div>
            </div>
            
            ${resultsData.length === 0 ? 
                `<div class="alert alert-info">No ${title.toLowerCase()} available yet. Add results using the button above.</div>` : 
                `<div class="table-responsive">
                    <table class="table table-striped" id="results-table-${this.currentType}">
                        <thead>
                            <tr>
                                <th>Driver</th>
                                <th>Position</th>
                                ${this.currentType === 'race' ? '<th>Fastest Lap</th><th>Finished</th>' : ''}
                                <th>Fantasy Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Results will be rendered here -->
                        </tbody>
                    </table>
                    ${this.currentType === 'race' ? `
                    <div class="text-muted small mt-2">
                        <i class="fas fa-info-circle me-1"></i> Fantasy points include: base position points, fastest lap (top 10 only), position gains from qualifying, beating teammates, and DNF penalties. Hover over points for a breakdown.
                    </div>
                    ` : ''}
                </div>`
            }
        `;
        
        console.log('HTML rendered for view:', viewId);
        
        // Render the results table if there are results
        if (resultsData.length > 0) {
            console.log('Rendering results table with', resultsData.length, 'results');
            this.renderResultsTable(resultsData);
        } else {
            console.log('No results to render in table');
        }
        
        // Verify that the race filter element exists after rendering
        const raceFilter = document.getElementById(`race-filter-${this.currentType}`);
        console.log(`Race filter element (race-filter-${this.currentType}) after rendering:`, raceFilter);
        
        // Add a direct event listener to the race filter
        if (raceFilter) {
            const self = this;
            raceFilter.addEventListener('change', function() {
                console.log(`Race filter (${self.currentType}) change event fired`);
                const raceId = this.value ? parseInt(this.value) : null;
                console.log('Selected Race ID:', raceId);
                
                // Use the helper function to handle filtering
                self.handleRaceFiltering(raceId);
            });
            console.log(`Event listener added to race filter (${this.currentType})`);
            
            // Automatically select the first race (id = 1)
            if (appState.races.some(race => race.id === 1)) {
                console.log('Setting race filter to first race (id = 1)');
                raceFilter.value = "1";
                
                // Trigger the change event to apply the filter
                const changeEvent = new Event('change');
                raceFilter.dispatchEvent(changeEvent);
            } else {
                console.log('First race (id = 1) not found in races array');
            }
        } else {
            console.error(`Race filter element (race-filter-${this.currentType}) not found after rendering`);
        }
        
        // Check for duplicate race filter elements
        const allRaceFilters = document.querySelectorAll('.race-filter');
        console.log('Number of elements with class race-filter:', allRaceFilters.length);
        allRaceFilters.forEach((filter, index) => {
            console.log(`Race filter ${index + 1}:`, filter.id, 'View type:', filter.getAttribute('data-view-type'));
        });
        
        console.log(`=== FINISHED RENDERING RESULTS VIEW (${this.renderCounter}) ===`);
    },
    
    /**
     * Render the race options for the filter dropdown
     * @returns {string} - HTML string of option elements
     */
    renderRaceOptions: function() {
        let options = '';
        
        // Filter races based on sprint status if needed
        let filteredRaces = appState.races;
        if (this.currentType === 'sprint' || this.currentType === 'sprint-qualifying') {
            filteredRaces = appState.races.filter(race => race.has_sprint);
        }
        
        // Sort races by date
        const sortedRaces = [...filteredRaces].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Add a debug log
        console.log('Rendering race options for', this.currentType, ':', sortedRaces.length, 'races');
        
        sortedRaces.forEach(race => {
            options += `<option value="${race.id}" data-race-name="${race.name}" data-race-date="${race.date}">${race.name}</option>`;
        });
        
        return options;
    },
    
    /**
     * Render the results table
     * @param {Array} resultsData - Array of result objects
     * @param {number} raceId - Optional race ID to filter by
     */
    renderResultsTable: function(resultsData, raceId = null) {
        console.log('=== RENDERING RESULTS TABLE ===');
        console.log('Current type:', this.currentType);
        console.log('Results data count:', resultsData.length);
        console.log('Filtering by race ID:', raceId);
        
        const tableId = `results-table-${this.currentType}`;
        console.log('Looking for table with ID:', tableId);
        
        const tableBody = document.querySelector(`#${tableId} tbody`);
        console.log('Table body element:', tableBody);
        
        if (!tableBody) {
            console.error(`Results table body for ${tableId} not found in the DOM`);
            return;
        }
        
        tableBody.innerHTML = '';
        console.log('Table body cleared');
        
        // Filter by race if specified
        let filteredResults = resultsData;
        if (raceId) {
            filteredResults = resultsData.filter(result => result.race_id === parseInt(raceId));
            console.log('Filtered results by race ID:', raceId, 'Count:', filteredResults.length);
        }
        
        // Sort by race and then by position
        filteredResults.sort((a, b) => {
            if (a.race_id !== b.race_id) {
                return a.race_id - b.race_id;
            }
            return a.position - b.position;
        });
        console.log('Results sorted by race and position');
        
        // Group results by race
        const resultsByRace = {};
        filteredResults.forEach(result => {
            if (!resultsByRace[result.race_id]) {
                resultsByRace[result.race_id] = [];
            }
            resultsByRace[result.race_id].push(result);
        });
        console.log('Results grouped by race, race count:', Object.keys(resultsByRace).length);
        
        // Render each race group
        Object.keys(resultsByRace).forEach(raceId => {
            const raceResults = resultsByRace[raceId];
            console.log('Rendering results for race ID:', raceId, 'Count:', raceResults.length);
            
            // Render rows for each driver result
            raceResults.forEach(result => {
                const driver = Utils.getDriverById(result.driver_id);
                if (!driver) {
                    console.error('Driver not found for ID:', result.driver_id);
                    return;
                }
                
                const row = document.createElement('tr');
                row.setAttribute('data-result-id', result.id);
                row.setAttribute('data-race-id', result.race_id);
                row.classList.add('driver-result-row');
                row.style.cursor = 'pointer';
                
                // Driver column
                const driverCell = document.createElement('td');
                driverCell.innerHTML = Utils.getDriverNameWithFlag(driver.name);
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
                
                // Fantasy points column with tooltip breakdown
                const pointsCell = document.createElement('td');
                
                // Calculate points breakdown for tooltip
                const pointsBreakdown = this.calculatePointsBreakdown(result);
                
                // Create a span with tooltip
                const pointsSpan = document.createElement('span');
                pointsSpan.textContent = pointsBreakdown.total;
                pointsSpan.setAttribute('data-bs-toggle', 'tooltip');
                pointsSpan.setAttribute('data-bs-html', 'true');
                pointsSpan.setAttribute('title', pointsBreakdown.tooltipHtml);
                pointsSpan.classList.add('fantasy-points');
                
                pointsCell.appendChild(pointsSpan);
                row.appendChild(pointsCell);
                
                tableBody.appendChild(row);
            });
        });
        
        console.log('Table rendering complete');
        
        // Initialize tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        console.log('Tooltips initialized');
        
        // Set up action listeners for edit and delete buttons
        this.setupResultActionListeners();
        console.log('=== FINISHED RENDERING RESULTS TABLE ===');
    },
    
    /**
     * Set up event listeners for the results view
     */
    setupEventListeners: function() {
        console.log('=== SETTING UP EVENT LISTENERS ===');
        console.log('Current type:', this.currentType);
        
        // First, remove any existing event listeners to prevent duplicates
        const existingAddResultBtn = document.getElementById('add-result-btn');
        if (existingAddResultBtn) {
            console.log('Removing existing event listeners from Add Result button');
            const newAddResultBtn = existingAddResultBtn.cloneNode(true);
            existingAddResultBtn.parentNode.replaceChild(newAddResultBtn, existingAddResultBtn);
        }
        
        // Add result button
        const addResultBtn = document.getElementById('add-result-btn');
        console.log('Add result button:', addResultBtn);
        
        if (addResultBtn) {
            // Store a reference to this for use in the event handler
            const self = this;
            
            // Add event listener with explicit binding
            addResultBtn.addEventListener('click', function(event) {
                console.log('Add result button clicked for type:', self.currentType);
                self.showAddResultModal.call(self);
            });
            
            console.log('Event listener added to add result button');
        } else {
            console.error('Add result button not found');
        }
        
        // Race filter
        const raceFilterId = `race-filter-${this.currentType}`;
        const raceFilter = document.getElementById(raceFilterId);
        console.log(`Race Filter Element (${raceFilterId}):`, raceFilter);
        
        if (raceFilter) {
            // Store reference to this for use in event handler
            const self = this;
            
            // Add direct event listener
            raceFilter.addEventListener('change', function() {
                console.log(`Race filter (${self.currentType}) change event fired`);
                const raceId = this.value ? parseInt(this.value) : null;
                console.log('Selected Race ID:', raceId);
                
                // Use the helper function to handle filtering
                self.handleRaceFiltering(raceId);
            });
            console.log(`Event listener added to race filter (${raceFilterId})`);
        } else {
            console.error(`Race filter element (${raceFilterId}) not found`);
        }
        
        console.log('=== FINISHED SETTING UP EVENT LISTENERS ===');
    },
    
    /**
     * Set up click handlers for race filter options
     */
    setupRaceFilterOptionHandlers: function() {
        const raceFilter = document.getElementById('race-filter');
        if (!raceFilter) return;
        
        // Add click handlers to each option
        const options = raceFilter.querySelectorAll('option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                console.log('Race filter option clicked:', option.value);
                const raceId = option.value ? parseInt(option.value) : null;
                
                // Get the appropriate results data
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
                
                // Render the filtered results
                this.renderResultsTable(resultsData, raceId);
                this.setupResultActionListeners();
            });
        });
    },
    
    /**
     * Set up event listeners for result action buttons
     */
    setupResultActionListeners: function() {
        console.log('=== SETTING UP RESULT ACTION LISTENERS ===');
        console.log('Current type:', this.currentType);
        
        // Make driver rows clickable to edit results
        const driverRows = document.querySelectorAll('.driver-result-row');
        console.log('Found driver rows:', driverRows.length);
        
        driverRows.forEach(row => {
            row.addEventListener('click', (event) => {
                const raceId = parseInt(row.getAttribute('data-race-id'));
                console.log('Driver row clicked, race ID:', raceId);
                this.openRaceResultsEditor(raceId);
            });
        });
        
        console.log('=== FINISHED SETTING UP RESULT ACTION LISTENERS ===');
    },
    
    /**
     * Open the race results editor for a race
     * @param {number} raceId - ID of the race to edit results for
     */
    openRaceResultsEditor: function(raceId) {
        // Find the first result for this race to use as entry point
        const resultsArray = this.getResultsArray();
        const firstResult = resultsArray.find(r => r.race_id === raceId);
        
        if (firstResult) {
            this.showEditResultModal(firstResult.id);
        }
    },
    
    /**
     * Show modal for adding a new result
     */
    showAddResultModal: function() {
        console.log('=== SHOW ADD RESULT MODAL CALLED ===');
        console.log('Current type:', this.currentType);
        
        // Check if this is a sprint view and there are no sprint races
        if ((this.currentType === 'sprint' || this.currentType === 'sprint-qualifying') && !this.hasSprintRaces()) {
            console.log('No sprint races available for adding results');
            Utils.showError('No races with sprint sessions are available. Please add sprint sessions to races first.');
            return;
        }
        
        // Create modal HTML with drag-and-drop interface
        const modalHtml = `
            <div class="modal fade" id="result-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
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
                                        ${this.renderModalRaceOptions()}
                                    </select>
                                </div>
                                
                                <div class="mt-4">
                                    <h6>Arrange Drivers in Finishing Order</h6>
                                    <p class="text-muted small">Drag and drop drivers to arrange them in the correct finishing order.</p>
                                    
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="card mb-3">
                                                <div class="card-header bg-primary text-white">
                                                    <strong>Driver Order</strong>
                                                </div>
                                                <div class="card-body p-0">
                                                    <ul id="driver-order-list" class="list-group driver-sortable">
                                                        <!-- Drivers will be added here via JS -->
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-4">
                                            <div class="card">
                                                <div class="card-header bg-secondary text-white">
                                                    <strong>Available Drivers</strong>
                                                </div>
                                                <div class="card-body p-0">
                                                    <ul id="driver-available-list" class="list-group driver-sortable">
                                                        <!-- Available drivers will be added here via JS -->
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${this.currentType === 'race' ? `
                                    <div class="card mt-3">
                                        <div class="card-header bg-light">
                                            <strong>Additional Options</strong>
                                        </div>
                                        <div class="card-body">
                                            <div id="fastest-lap-container" class="mb-3">
                                                <label>Fastest Lap:</label>
                                                <select id="fastest-lap-select" class="form-select">
                                                    <option value="">No Fastest Lap</option>
                                                    <!-- Options will be added based on top 10 drivers -->
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-result-btn">Save Results</button>
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
        
        // Set up event listeners
        document.getElementById('result-race').addEventListener('change', this.populateDriverLists.bind(this));
        document.getElementById('save-result-btn').addEventListener('click', this.saveDragDropResult.bind(this));
        
        // Initial population of driver lists will be done when race is selected
        
        // Remove modal from DOM when hidden
        document.getElementById('result-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        // Log the current type for debugging
        console.log('Modal opened for result type:', this.currentType);
    },
    
    /**
     * Populate the driver lists when a race is selected
     */
    populateDriverLists: function() {
        const raceId = parseInt(document.getElementById('result-race').value);
        if (isNaN(raceId)) return;
        
        // Validate for sprint races
        if ((this.currentType === 'sprint' || this.currentType === 'sprint-qualifying')) {
            const race = Utils.getRaceById(raceId);
            console.log('Selected race for sprint/sprint-qualifying:', race);
            
            if (!race) {
                console.error('Race not found with ID:', raceId);
                Utils.showError('Race not found');
                return;
            }
            
            if (!race.has_sprint) {
                console.error('Race does not have sprint session:', race.name);
                Utils.showError('This race does not have a sprint session');
                return;
            }
        }
        
        const availableList = document.getElementById('driver-available-list');
        const orderList = document.getElementById('driver-order-list');
        
        // Clear existing lists
        availableList.innerHTML = '';
        orderList.innerHTML = '';
        
        // Add all drivers to available list
        appState.drivers.forEach(driver => {
            availableList.appendChild(this.createDriverListItem(driver, false));
        });
        
        // Initialize drag and drop
        this.initDragAndDrop();
        
        // Set up special race options if this is a race result
        if (this.currentType === 'race') {
            this.setupRaceOptions();
        }
        
        // For all other result types, we still need to update position numbers
        this.updatePositionNumbers();
    },
    
    /**
     * Create a list item for a driver
     * @param {Object} driver - Driver object
     * @param {boolean} isOrderList - Whether this is for the order list or available list
     * @returns {HTMLElement} - List item element
     */
    createDriverListItem: function(driver, isOrderList = false) {
        const li = document.createElement('li');
        li.className = 'list-group-item driver-item';
        li.setAttribute('draggable', 'true');
        li.setAttribute('data-driver-id', driver.id);
        
        // Find driver's team for the color
        const driverTeam = appState.teams.find(team => team.driver_ids.includes(driver.id));
        const teamColor = driverTeam ? driverTeam.color : '#999999';
        
        // Create the content
        const content = document.createElement('div');
        content.className = 'd-flex align-items-center';
        
        // Handle
        const handle = document.createElement('div');
        handle.className = 'driver-handle me-2';
        handle.innerHTML = '<i class="fas fa-grip-lines"></i>';
        content.appendChild(handle);
        
        // Team color indicator
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'driver-color-indicator me-2';
        colorIndicator.style.width = '4px';
        colorIndicator.style.height = '20px';
        colorIndicator.style.backgroundColor = teamColor;
        content.appendChild(colorIndicator);
        
        // Driver name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'driver-name flex-grow-1';
        nameDiv.innerHTML = Utils.getDriverNameWithFlag(driver.name);
        content.appendChild(nameDiv);
        
        // Add DNF checkbox if in race mode and in order list
        if (this.currentType === 'race' && isOrderList) {
            const dnfContainer = document.createElement('div');
            dnfContainer.className = 'form-check me-2';
            
            const dnfCheckbox = document.createElement('input');
            dnfCheckbox.type = 'checkbox';
            dnfCheckbox.className = 'form-check-input inline-dnf-checkbox';
            dnfCheckbox.id = `inline-dnf-${driver.id}`;
            dnfCheckbox.setAttribute('data-driver-id', driver.id);
            
            const dnfLabel = document.createElement('label');
            dnfLabel.className = 'form-check-label small';
            dnfLabel.htmlFor = `inline-dnf-${driver.id}`;
            dnfLabel.textContent = 'DNF';
            
            dnfContainer.appendChild(dnfCheckbox);
            dnfContainer.appendChild(dnfLabel);
            
            content.appendChild(dnfContainer);
            
            // Add event listener for the DNF checkbox
            dnfCheckbox.addEventListener('change', e => {
                this.handleInlineDNFCheck(e.target);
            });
        }
        
        // Position badge
        const positionBadge = document.createElement('div');
        positionBadge.className = 'driver-position badge bg-secondary';
        content.appendChild(positionBadge);
        
        li.appendChild(content);
        
        // If this is in the available list, add click handler to add to order list
        if (!isOrderList) {
            li.addEventListener('click', () => {
                this.addDriverToOrder(driver.id);
            });
            li.classList.add('available-driver');
        }
        
        return li;
    },
    
    /**
     * Handle click on available driver to add to order
     * @param {number} driverId - Driver ID to add
     */
    addDriverToOrder: function(driverId) {
        const availableList = document.getElementById('driver-available-list');
        const orderList = document.getElementById('driver-order-list');
        
        // Find the driver item in the available list
        const driverItem = availableList.querySelector(`.driver-item[data-driver-id="${driverId}"]`);
        if (!driverItem) return;
        
        // Get the driver object
        const driver = Utils.getDriverById(driverId);
        if (!driver) return;
        
        // Create a new list item for the order list with isOrderList=true
        const newOrderItem = this.createDriverListItem(driver, true);
        
        // Append to the order list
        orderList.appendChild(newOrderItem);
        
        // Remove from available list
        availableList.removeChild(driverItem);
        
        // Update positions and other UI elements
        this.updatePositionNumbers();
        
        // Update race-specific elements
        if (this.currentType === 'race') {
            this.updateDNFCheckboxes();
            this.updateFastestLapOptions();
        }
    },
    
    /**
     * Handle inline DNF checkbox changes
     * @param {HTMLElement} checkbox - The checkbox element that changed
     */
    handleInlineDNFCheck: function(checkbox) {
        const driverId = checkbox.getAttribute('data-driver-id');
        const driverItem = checkbox.closest('.driver-item');
        const orderList = document.getElementById('driver-order-list');
        
        if (checkbox.checked) {
            // Add visual styling to indicate DNF
            driverItem.classList.add('driver-dnf');
            
            // Move driver to the right position - at the end but before other DNFs
            // Find the first DNF driver that isn't this one
            const otherDnfItems = Array.from(orderList.querySelectorAll('.driver-item.driver-dnf')).filter(
                item => item !== driverItem
            );
            
            if (otherDnfItems.length > 0) {
                // Insert before the first DNF driver
                orderList.insertBefore(driverItem, otherDnfItems[0]);
            } else {
                // No other DNF drivers, append to the end
                orderList.appendChild(driverItem);
            }
        } else {
            // Remove DNF styling
            driverItem.classList.remove('driver-dnf');
            
            // Move driver above all DNF drivers
            const firstDnfItem = orderList.querySelector('.driver-item.driver-dnf');
            if (firstDnfItem) {
                orderList.insertBefore(driverItem, firstDnfItem);
            }
        }
        
        // Update positions
        this.updatePositionNumbers();
        
        // Update fastest lap options
        this.updateFastestLapOptions();
    },
    
    /**
     * Initialize drag and drop functionality
     */
    initDragAndDrop: function() {
        // Get both lists
        const availableList = document.getElementById('driver-available-list');
        const orderList = document.getElementById('driver-order-list');
        
        // Add event listeners for all driver items
        document.querySelectorAll('.driver-item').forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragover', this.handleDragOver.bind(this));
            item.addEventListener('drop', this.handleDrop.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
        
        // Add event listeners for both lists
        [availableList, orderList].forEach(list => {
            list.addEventListener('dragover', this.handleDragOver.bind(this));
            list.addEventListener('drop', this.handleDrop.bind(this));
        });
        
        // Initial position numbering
        this.updatePositionNumbers();
    },
    
    /**
     * Handle drag start event
     * @param {Event} e - Drag start event
     */
    handleDragStart: function(e) {
        e.dataTransfer.setData('text/plain', e.target.getAttribute('data-driver-id'));
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    },
    
    /**
     * Handle drag over event
     * @param {Event} e - Drag over event
     */
    handleDragOver: function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.driver-item') || e.target.closest('.driver-sortable');
        if (!target) return;
        
        // Add visual indication
        if (target.classList.contains('driver-item')) {
            const rect = target.getBoundingClientRect();
            const midpoint = (rect.top + rect.bottom) / 2;
            
            // Clear existing drop position indicators
            document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
                el.classList.remove('drop-before', 'drop-after');
            });
            
            // Add indicator based on mouse position
            if (e.clientY < midpoint) {
                target.classList.add('drop-before');
            } else {
                target.classList.add('drop-after');
            }
        }
    },
    
    /**
     * Handle drop event
     * @param {Event} e - Drop event
     */
    handleDrop: function(e) {
        e.preventDefault();
        
        // Clear drop indicators
        document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
            el.classList.remove('drop-before', 'drop-after');
        });
        
        // Get the dragged driver id
        const driverId = e.dataTransfer.getData('text/plain');
        const draggedItem = document.querySelector(`.driver-item[data-driver-id="${driverId}"]`);
        if (!draggedItem) return;
        
        // Determine where to drop the item
        const targetList = e.target.closest('.driver-sortable');
        if (!targetList) return;
        
        // Determine position within the list
        const targetItem = e.target.closest('.driver-item');
        if (targetItem) {
            const rect = targetItem.getBoundingClientRect();
            const midpoint = (rect.top + rect.bottom) / 2;
            
            if (e.clientY < midpoint) {
                targetList.insertBefore(draggedItem, targetItem);
            } else {
                targetList.insertBefore(draggedItem, targetItem.nextSibling);
            }
        } else {
            // If dropped directly on the list (not on an item)
            targetList.appendChild(draggedItem);
        }
        
        // Update position numbers
        this.updatePositionNumbers();
        
        // Update fastest lap options if this is a race
        if (this.currentType === 'race') {
            this.updateFastestLapOptions();
        }
    },
    
    /**
     * Handle drag end event
     * @param {Event} e - Drag end event
     */
    handleDragEnd: function(e) {
        e.target.classList.remove('dragging');
        
        // Clear drop indicators
        document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
            el.classList.remove('drop-before', 'drop-after');
        });
        
        // Update position numbers
        this.updatePositionNumbers();
        
        // Update fastest lap options if this is a race
        if (this.currentType === 'race') {
            this.updateFastestLapOptions();
        }
    },
    
    /**
     * Update position numbers on driver items
     */
    updatePositionNumbers: function() {
        // Update ordered list positions
        const orderedDrivers = document.querySelectorAll('#driver-order-list .driver-item');
        orderedDrivers.forEach((item, index) => {
            const positionBadge = item.querySelector('.driver-position');
            if (positionBadge) {
                positionBadge.textContent = (index + 1).toString();
                positionBadge.classList.remove('bg-secondary');
                positionBadge.classList.add('bg-primary');
            }
        });
        
        // Hide position numbers in available list
        document.querySelectorAll('#driver-available-list .driver-position').forEach(badge => {
            badge.textContent = '';
            badge.classList.remove('bg-primary');
            badge.classList.add('bg-secondary');
        });
    },
    
    /**
     * Set up race-specific options (DNF checkboxes, fastest lap)
     */
    setupRaceOptions: function() {
        // Initial fastest lap options
        this.updateFastestLapOptions();
    },
    
    /**
     * Update the DNF checkboxes based on drivers in the order list
     */
    updateDNFCheckboxes: function() {
        // This function is no longer needed since we removed the DNF checkboxes section
    },
    
    /**
     * Handle DNF checkbox changes
     * @param {HTMLElement} checkbox - The checkbox element that changed
     */
    handleDNFCheck: function(checkbox) {
        // This function is no longer needed since we removed the DNF checkboxes section
    },
    
    /**
     * Update fastest lap options based on current driver order
     */
    updateFastestLapOptions: function() {
        const fastestLapSelect = document.getElementById('fastest-lap-select');
        if (!fastestLapSelect) return;
        
        // Save current selection
        const currentSelection = fastestLapSelect.value;
        
        // Clear existing options except the "No Fastest Lap" option
        while (fastestLapSelect.options.length > 1) {
            fastestLapSelect.remove(1);
        }
        
        // Get top 10 drivers from the order list
        const orderedDrivers = document.querySelectorAll('#driver-order-list .driver-item');
        const top10Drivers = Array.from(orderedDrivers).slice(0, 10);
        
        // Add options for each top 10 driver
        top10Drivers.forEach((driverItem, index) => {
            const driverId = driverItem.getAttribute('data-driver-id');
            const driver = Utils.getDriverById(parseInt(driverId));
            
            const option = document.createElement('option');
            option.value = driverId;
            option.text = `P${index + 1} - ${driver.name}`;
            
            fastestLapSelect.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (currentSelection && Array.from(fastestLapSelect.options).some(opt => opt.value === currentSelection)) {
            fastestLapSelect.value = currentSelection;
        } else {
            fastestLapSelect.value = '';  // Default to no fastest lap
        }
    },
    
    /**
     * Save the results from the drag-drop interface
     */
    saveDragDropResult: async function() {
        const raceId = parseInt(document.getElementById('result-race').value);
        
        // Validate
        if (isNaN(raceId)) {
            Utils.showError('Please select a race');
            return;
        }
        
        // Validate for sprint races
        if ((this.currentType === 'sprint' || this.currentType === 'sprint-qualifying')) {
            const race = Utils.getRaceById(raceId);
            if (!race.has_sprint) {
                Utils.showError('This race does not have a sprint session');
                return;
            }
        }
        
        // Get ordered drivers
        const orderedDrivers = document.querySelectorAll('#driver-order-list .driver-item');
        if (orderedDrivers.length === 0) {
            Utils.showError('Please arrange at least one driver in the results order');
            return;
        }
        
        // Prepare results data
        const results = [];
        
        // Get DNF status for race - check for drivers with the DNF class or inline checkboxes
        const dnfDrivers = new Set();
        if (this.currentType === 'race') {
            // Check for inline DNF checkboxes and drivers with DNF class
            document.querySelectorAll('.inline-dnf-checkbox:checked').forEach(checkbox => {
                dnfDrivers.add(parseInt(checkbox.getAttribute('data-driver-id')));
            });
            
            // Also check for drivers with the DNF class
            document.querySelectorAll('#driver-order-list .driver-item.driver-dnf').forEach(driverItem => {
                dnfDrivers.add(parseInt(driverItem.getAttribute('data-driver-id')));
            });
        }
        
        // Get fastest lap for race
        let fastestLapDriverId = null;
        if (this.currentType === 'race') {
            const fastestLapSelect = document.getElementById('fastest-lap-select');
            if (fastestLapSelect && fastestLapSelect.value) {
                fastestLapDriverId = parseInt(fastestLapSelect.value);
            }
        }
        
        // Build the results
        orderedDrivers.forEach((driverItem, index) => {
            const driverId = parseInt(driverItem.getAttribute('data-driver-id'));
            const position = index + 1;
            
            // Create base result
            const result = {
                race_id: raceId,
                driver_id: driverId,
                position: position
            };
            
            // Add race-specific fields
            if (this.currentType === 'race') {
                result.fastest_lap = (driverId === fastestLapDriverId);
                result.finished = !dnfDrivers.has(driverId);
            }
            
            // Add to the results array - we'll calculate fantasy points at the end
            // after all results are created, so we can account for teammate comparisons
            results.push(result);
        });
        
        try {
            // Create all results
            const endpoint = this.getResultEndpoint();
            const savedResults = [];
            
            // Show a loading indicator or message
            Utils.showSuccess('Saving results...');
            
            // Calculate fantasy points for all results
            // We need to do this after all results are prepared to calculate teammate comparisons correctly
            if (this.currentType === 'race') {
                // Use the results array directly
                const allResults = results;
                
                // Calculate fantasy points using our calculatePointsBreakdown method
                allResults.forEach(result => {
                    // We need to temporarily add the result to the app state for proper calculation
                    const tempResults = [...this.getResultsArray(), result];
                    const originalResults = this.getResultsArray().slice();
                    this.getResultsArray().length = 0;
                    tempResults.forEach(r => this.getResultsArray().push(r));
                    
                    // Calculate points
                    const breakdown = this.calculatePointsBreakdown(result);
                    result.fantasy_points = breakdown.total;
                    
                    // Restore original results
                    this.getResultsArray().length = 0;
                    originalResults.forEach(r => this.getResultsArray().push(r));
                });
            } else {
                // For non-race results, standard fantasy points calculation
                results.forEach(result => {
                    const breakdown = this.calculatePointsBreakdown(result);
                    result.fantasy_points = breakdown.total;
                });
            }
            
            // Use Promise.all to create all results in parallel
            await Promise.all(results.map(async (result) => {
                const savedResult = await API.postData(endpoint, result);
                if (savedResult) {
                    savedResults.push(savedResult);
                }
            }));
            
            // Add to app state
            const resultsArray = this.getResultsArray();
            savedResults.forEach(result => {
                resultsArray.push(result);
            });
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('result-modal'));
            modal.hide();
            
            // Refresh view
            this.renderResults();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
            
            Utils.showSuccess(`${savedResults.length} results saved successfully`);
        } catch (error) {
            Utils.showError('Failed to save results');
            console.error(error);
        }
    },
    
    /**
     * Calculate a detailed breakdown of fantasy points for a result
     * @param {Object} result - Result object
     * @returns {Object} - Object with total points and tooltip HTML
     */
    calculatePointsBreakdown: function(result) {
        const breakdown = {
            basePoints: 0,
            fastestLapPoints: 0,
            dnfPenalty: 0,
            positionGainPoints: 0,
            teammatePoints: 0,
            total: 0,
            tooltipHtml: ''
        };
        
        switch (this.currentType) {
            case 'race':
                // 1. Base race points (without fastest lap)
                breakdown.basePoints = ScoringSystem.calculateRacePoints(result.position, false);
                
                // 2. Add fastest lap point separately (only if in top 10)
                if (result.fastest_lap && result.position <= 10) {
                    breakdown.fastestLapPoints = 1;
                }
                
                // 3. DNF penalty
                if (!result.finished) {
                    breakdown.dnfPenalty = ScoringSystem.calculateDNFPenalty(false);
                }
                
                // 4. Position gain points
                const qualifyingResult = appState.qualifyingResults.find(qr => 
                    qr.race_id === result.race_id && qr.driver_id === result.driver_id
                );
                
                if (qualifyingResult) {
                    const positionsGained = qualifyingResult.position - result.position;
                    breakdown.positionGainPoints = ScoringSystem.calculatePositionGainPoints(
                        qualifyingResult.position, 
                        result.position
                    );
                    breakdown.positionsGained = positionsGained > 0 ? positionsGained : 0;
                }
                
                // 5. Teammate points - each constructor has only 2 drivers
                const driver = Utils.getDriverById(result.driver_id);
                if (driver && driver.constructor) {
                    // Find teammates (drivers from the same constructor)
                    const teammates = appState.drivers.filter(d => 
                        d.id !== driver.id && d.constructor === driver.constructor
                    );
                    
                    if (teammates.length > 0) {
                        // Check if this driver beat all teammates
                        let beatAllTeammates = true;
                        let teammatesWithResults = 0;
                        
                        for (const teammate of teammates) {
                            const teammateResult = appState.raceResults.find(rr => 
                                rr.race_id === result.race_id && rr.driver_id === teammate.id
                            );
                            
                            // If teammate has a result and finished ahead or tied, driver didn't beat all teammates
                            if (teammateResult) {
                                teammatesWithResults++;
                                if (teammateResult.position <= result.position) {
                                    beatAllTeammates = false;
                                    break;
                                }
                            }
                        }
                        
                        // Add 2 points if driver beat all teammates (and at least one teammate had a result)
                        if (beatAllTeammates && teammatesWithResults > 0) {
                            breakdown.teammatePoints = 2;
                            breakdown.teammatesBeaten = teammatesWithResults;
                        } else {
                            breakdown.teammatePoints = 0;
                            breakdown.teammatesBeaten = 0;
                        }
                    }
                }
                break;
                
            case 'qualifying':
                // Base qualifying points
                breakdown.basePoints = ScoringSystem.calculateQualifyingPoints(result.position);
                
                // Teammate points - each constructor has only 2 drivers
                const qualifyingDriver = Utils.getDriverById(result.driver_id);
                if (qualifyingDriver && qualifyingDriver.constructor) {
                    // Find teammates (drivers from the same constructor)
                    const teammates = appState.drivers.filter(d => 
                        d.id !== qualifyingDriver.id && d.constructor === qualifyingDriver.constructor
                    );
                    
                    if (teammates.length > 0) {
                        // Check if this driver beat all teammates
                        let beatAllTeammates = true;
                        let teammatesWithResults = 0;
                        
                        for (const teammate of teammates) {
                            const teammateResult = appState.qualifyingResults.find(qr => 
                                qr.race_id === result.race_id && qr.driver_id === teammate.id
                            );
                            
                            // If teammate has a result and finished ahead or tied, driver didn't beat all teammates
                            if (teammateResult) {
                                teammatesWithResults++;
                                if (teammateResult.position <= result.position) {
                                    beatAllTeammates = false;
                                    break;
                                }
                            }
                        }
                        
                        // Add 2 points if driver beat all teammates (and at least one teammate had a result)
                        if (beatAllTeammates && teammatesWithResults > 0) {
                            breakdown.teammatePoints = 2;
                            breakdown.teammatesBeaten = teammatesWithResults;
                        } else {
                            breakdown.teammatePoints = 0;
                            breakdown.teammatesBeaten = 0;
                        }
                    }
                }
                break;
                
            case 'sprint':
                breakdown.basePoints = ScoringSystem.calculateSprintPoints(result.position);
                
                // Add teammate points for sprint
                const sprintDriver = Utils.getDriverById(result.driver_id);
                if (sprintDriver && sprintDriver.constructor) {
                    // Find teammates (drivers from the same constructor)
                    const teammates = appState.drivers.filter(d => 
                        d.id !== sprintDriver.id && d.constructor === sprintDriver.constructor
                    );
                    
                    if (teammates.length > 0) {
                        // Check if this driver beat all teammates
                        let beatAllTeammates = true;
                        let teammatesWithResults = 0;
                        
                        for (const teammate of teammates) {
                            const teammateResult = appState.sprintResults.find(sr => 
                                sr.race_id === result.race_id && sr.driver_id === teammate.id
                            );
                            
                            // If teammate has a result and finished ahead or tied, driver didn't beat all teammates
                            if (teammateResult) {
                                teammatesWithResults++;
                                if (teammateResult.position <= result.position) {
                                    beatAllTeammates = false;
                                    break;
                                }
                            }
                        }
                        
                        // Add 2 points if driver beat all teammates (and at least one teammate had a result)
                        if (beatAllTeammates && teammatesWithResults > 0) {
                            breakdown.teammatePoints = 2;
                            breakdown.teammatesBeaten = teammatesWithResults;
                        } else {
                            breakdown.teammatePoints = 0;
                            breakdown.teammatesBeaten = 0;
                        }
                    }
                }
                break;
                
            case 'sprint-qualifying':
                breakdown.basePoints = ScoringSystem.calculateQualifyingPoints(result.position);
                
                // Add teammate points for sprint qualifying
                const sprintQualifyingDriver = Utils.getDriverById(result.driver_id);
                if (sprintQualifyingDriver && sprintQualifyingDriver.constructor) {
                    // Find teammates (drivers from the same constructor)
                    const teammates = appState.drivers.filter(d => 
                        d.id !== sprintQualifyingDriver.id && d.constructor === sprintQualifyingDriver.constructor
                    );
                    
                    if (teammates.length > 0) {
                        // Check if this driver beat all teammates
                        let beatAllTeammates = true;
                        let teammatesWithResults = 0;
                        
                        for (const teammate of teammates) {
                            const teammateResult = appState.sprintQualifyingResults.find(sqr => 
                                sqr.race_id === result.race_id && sqr.driver_id === teammate.id
                            );
                            
                            // If teammate has a result and finished ahead or tied, driver didn't beat all teammates
                            if (teammateResult) {
                                teammatesWithResults++;
                                if (teammateResult.position <= result.position) {
                                    beatAllTeammates = false;
                                    break;
                                }
                            }
                        }
                        
                        // Add 2 points if driver beat all teammates (and at least one teammate had a result)
                        if (beatAllTeammates && teammatesWithResults > 0) {
                            breakdown.teammatePoints = 2;
                            breakdown.teammatesBeaten = teammatesWithResults;
                        } else {
                            breakdown.teammatePoints = 0;
                            breakdown.teammatesBeaten = 0;
                        }
                    }
                }
                break;
        }
        
        // Calculate total
        breakdown.total = breakdown.basePoints + breakdown.fastestLapPoints + 
                          breakdown.dnfPenalty + breakdown.positionGainPoints + 
                          breakdown.teammatePoints;
        
        // Generate tooltip HTML
        let tooltipHtml = '<div class="points-breakdown">';
        
        if (this.currentType === 'race') {
            tooltipHtml += `<div>Position P${result.position}: ${breakdown.basePoints} points</div>`;
            
            if (breakdown.fastestLapPoints > 0) {
                tooltipHtml += `<div>Fastest Lap: +${breakdown.fastestLapPoints} point</div>`;
            }
            
            if (breakdown.dnfPenalty !== 0) {
                tooltipHtml += `<div>DNF Penalty: ${breakdown.dnfPenalty} points</div>`;
            }
            
            if (breakdown.positionGainPoints > 0) {
                tooltipHtml += `<div>Positions Gained (${breakdown.positionsGained}): +${breakdown.positionGainPoints} points</div>`;
            }
            
            if (breakdown.teammatePoints > 0) {
                tooltipHtml += `<div>Teammate Matchup Win: +${breakdown.teammatePoints} points</div>`;
            }
            
            tooltipHtml += `<div class="fw-bold mt-1">Total: ${breakdown.total} points</div>`;
        } else if (this.currentType === 'qualifying') {
            tooltipHtml += `<div>Position P${result.position}: ${breakdown.basePoints} points</div>`;
            
            if (breakdown.teammatePoints > 0) {
                tooltipHtml += `<div>Teammate Matchup Win: +${breakdown.teammatePoints} points</div>`;
            }
            
            tooltipHtml += `<div class="fw-bold mt-1">Total: ${breakdown.total} points</div>`;
        } else if (this.currentType === 'sprint') {
            tooltipHtml += `<div>Position P${result.position}: ${breakdown.basePoints} points</div>`;
            
            if (breakdown.teammatePoints > 0) {
                tooltipHtml += `<div>Teammate Matchup Win: +${breakdown.teammatePoints} points</div>`;
            }
            
            tooltipHtml += `<div class="fw-bold mt-1">Total: ${breakdown.total} points</div>`;
        } else if (this.currentType === 'sprint-qualifying') {
            tooltipHtml += `<div>Position P${result.position}: ${breakdown.basePoints} points</div>`;
            
            if (breakdown.teammatePoints > 0) {
                tooltipHtml += `<div>Teammate Matchup Win: +${breakdown.teammatePoints} points</div>`;
            }
            
            tooltipHtml += `<div class="fw-bold mt-1">Total: ${breakdown.total} points</div>`;
        } else {
            tooltipHtml += `<div>Position P${result.position}: ${breakdown.basePoints} points</div>`;
            tooltipHtml += `<div class="fw-bold mt-1">Total: ${breakdown.total} points</div>`;
        }
        
        tooltipHtml += '</div>';
        breakdown.tooltipHtml = tooltipHtml;
        
        return breakdown;
    },
    
    /**
     * Calculate fantasy points for a driver result
     * @param {Object} result - Result object with position, fastest_lap, etc.
     * @returns {number} - Fantasy points
     */
    calculateDriverPoints: function(result) {
        // Use the breakdown calculator and return the total
        const breakdown = this.calculatePointsBreakdown(result);
        return breakdown.total;
    },
    
    /**
     * Show modal for editing an existing result
     * @param {number} resultId - ID of the result to edit
     */
    showEditResultModal: function(resultId) {
        // Find the corresponding race result first
        let result, results;
        switch (this.currentType) {
            case 'race':
                results = appState.raceResults;
                break;
            case 'qualifying':
                results = appState.qualifyingResults;
                break;
            case 'sprint':
                results = appState.sprintResults;
                break;
            case 'sprint-qualifying':
                results = appState.sprintQualifyingResults;
                break;
            default:
                results = appState.raceResults;
        }
        
        result = results.find(r => r.id === resultId);
        if (!result) {
            Utils.showError('Result not found');
            return;
        }
        
        // Find all results for the same race
        const raceId = result.race_id;
        const raceResults = results.filter(r => r.race_id === raceId);
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="result-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit ${this.getResultTypeTitle()} Results</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="result-form" data-result-ids="${raceResults.map(r => r.id).join(',')}">
                                <div class="mb-3">
                                    <label for="result-race" class="form-label">Race</label>
                                    <select class="form-select" id="result-race" disabled>
                                        <option value="${raceId}">${Utils.getRaceById(raceId).name}</option>
                                    </select>
                                    <input type="hidden" id="result-race-id" value="${raceId}">
                                </div>
                                
                                <div class="mt-4">
                                    <h6>Arrange Drivers in Finishing Order</h6>
                                    <p class="text-muted small">Drag and drop drivers to rearrange the finishing order.</p>
                                    
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="card mb-3">
                                                <div class="card-header bg-primary text-white">
                                                    <strong>Driver Order</strong>
                                                </div>
                                                <div class="card-body p-0">
                                                    <ul id="driver-order-list" class="list-group driver-sortable">
                                                        <!-- Drivers will be added here via JS -->
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-4">
                                            <div class="card">
                                                <div class="card-header bg-secondary text-white">
                                                    <strong>Available Drivers</strong>
                                                </div>
                                                <div class="card-body p-0">
                                                    <ul id="driver-available-list" class="list-group driver-sortable">
                                                        <!-- Available drivers will be added here via JS -->
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${this.currentType === 'race' ? `
                                    <div class="card mt-3">
                                        <div class="card-header bg-light">
                                            <strong>Additional Options</strong>
                                        </div>
                                        <div class="card-body">
                                            <div id="fastest-lap-container" class="mb-3">
                                                <label>Fastest Lap:</label>
                                                <select id="fastest-lap-select" class="form-select">
                                                    <option value="">No Fastest Lap</option>
                                                    <!-- Options will be added based on top 10 drivers -->
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger me-auto" id="delete-all-results-btn">Delete Result</button>
                            <button type="button" class="btn btn-primary" id="save-result-btn">Save Changes</button>
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
        
        // Populate driver lists with pre-existing order
        this.populateEditDriverLists(raceResults);
        
        // Set up event listeners
        document.getElementById('save-result-btn').addEventListener('click', this.updateDragDropResult.bind(this));
        document.getElementById('delete-all-results-btn').addEventListener('click', () => {
            this.deleteAllRaceResults(raceId);
        });
        
        // Remove modal from DOM when hidden
        document.getElementById('result-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Populate driver lists for editing results
     * @param {Array} raceResults - Array of existing results for the race
     */
    populateEditDriverLists: function(raceResults) {
        const orderList = document.getElementById('driver-order-list');
        const availableList = document.getElementById('driver-available-list');
        
        // Clear both lists
        orderList.innerHTML = '';
        availableList.innerHTML = '';
        
        // Sort the race results by position
        const sortedResults = [...raceResults].sort((a, b) => a.position - b.position);
        
        // Add drivers from the results to the order list
        sortedResults.forEach(result => {
            const driver = Utils.getDriverById(result.driver_id);
            const li = this.createDriverListItem(driver, true);
            
            // Add result data attributes
            li.setAttribute('data-result-id', result.id);
            if (this.currentType === 'race') {
                li.setAttribute('data-finished', result.finished);
                li.setAttribute('data-fastest-lap', result.fastest_lap);
                
                // Check DNF checkbox if driver didn't finish
                if (!result.finished) {
                    li.classList.add('driver-dnf');
                    const inlineDnfCheckbox = li.querySelector('.inline-dnf-checkbox');
                    if (inlineDnfCheckbox) {
                        inlineDnfCheckbox.checked = true;
                    }
                }
            }
            
            orderList.appendChild(li);
        });
        
        // Add remaining drivers to the available list
        const existingDriverIds = new Set(sortedResults.map(r => r.driver_id));
        
        appState.drivers.forEach(driver => {
            if (!existingDriverIds.has(driver.id)) {
                availableList.appendChild(this.createDriverListItem(driver, false));
            }
        });
        
        // Initialize drag and drop
        this.initDragAndDrop();
        
        // Set up race-specific options
        if (this.currentType === 'race') {
            this.setupEditRaceOptions(sortedResults);
        }
    },
    
    /**
     * Set up race-specific options for editing
     * @param {Array} raceResults - Array of existing results for the race
     */
    setupEditRaceOptions: function(raceResults) {
        // Update fastest lap options
        this.updateFastestLapOptions();
        
        // Set selected fastest lap driver
        const fastestLapResult = raceResults.find(r => r.fastest_lap);
        if (fastestLapResult) {
            const fastestLapSelect = document.getElementById('fastest-lap-select');
            if (fastestLapSelect) {
                // Find option for this driver (might not exist if not in top 10)
                const options = Array.from(fastestLapSelect.options);
                const option = options.find(opt => opt.value === fastestLapResult.driver_id.toString());
                
                if (option) {
                    fastestLapSelect.value = fastestLapResult.driver_id;
                } else {
                    // If driver not in top 10, add a special option
                    const driver = Utils.getDriverById(fastestLapResult.driver_id);
                    const position = fastestLapResult.position;
                    
                    const specialOption = document.createElement('option');
                    specialOption.value = fastestLapResult.driver_id;
                    specialOption.text = `P${position} - ${driver.name} (outside top 10)`;
                    
                    fastestLapSelect.appendChild(specialOption);
                    fastestLapSelect.value = fastestLapResult.driver_id;
                }
            }
        }
    },
    
    /**
     * Update results from the drag-drop interface
     */
    updateDragDropResult: async function() {
        const form = document.getElementById('result-form');
        const resultIdsStr = form.getAttribute('data-result-ids');
        const resultIds = resultIdsStr ? resultIdsStr.split(',').map(id => parseInt(id)) : [];
        
        const raceId = parseInt(document.getElementById('result-race-id').value);
        
        // Get ordered drivers
        const orderedDrivers = document.querySelectorAll('#driver-order-list .driver-item');
        if (orderedDrivers.length === 0) {
            Utils.showError('Please arrange at least one driver in the results order');
            return;
        }
        
        // Get DNF status for race - check for drivers with the DNF class or inline checkboxes
        const dnfDrivers = new Set();
        if (this.currentType === 'race') {
            // Check for inline DNF checkboxes and drivers with DNF class
            document.querySelectorAll('.inline-dnf-checkbox:checked').forEach(checkbox => {
                dnfDrivers.add(parseInt(checkbox.getAttribute('data-driver-id')));
            });
            
            // Also check for drivers with the DNF class
            document.querySelectorAll('#driver-order-list .driver-item.driver-dnf').forEach(driverItem => {
                dnfDrivers.add(parseInt(driverItem.getAttribute('data-driver-id')));
            });
        }
        
        // Get fastest lap for race
        let fastestLapDriverId = null;
        if (this.currentType === 'race') {
            const fastestLapSelect = document.getElementById('fastest-lap-select');
            if (fastestLapSelect && fastestLapSelect.value) {
                fastestLapDriverId = parseInt(fastestLapSelect.value);
            }
        }
        
        // Map existing result IDs to drivers for updating
        const resultIdMap = new Map();
        resultIds.forEach(id => {
            const result = this.getResultsArray().find(r => r.id === id);
            if (result) {
                resultIdMap.set(result.driver_id, id);
            }
        });
        
        // Prepare results data for update and create
        const updateResults = [];
        const createResults = [];
        
        // Build the results
        orderedDrivers.forEach((driverItem, index) => {
            const driverId = parseInt(driverItem.getAttribute('data-driver-id'));
            const position = index + 1;
            
            // Create base result
            const result = {
                race_id: raceId,
                driver_id: driverId,
                position: position
            };
            
            // Add race-specific fields
            if (this.currentType === 'race') {
                result.fastest_lap = (driverId === fastestLapDriverId);
                result.finished = !dnfDrivers.has(driverId);
            }
            
            // Check if this is an update or create
            if (resultIdMap.has(driverId)) {
                // Update
                result.id = resultIdMap.get(driverId);
                updateResults.push(result);
                resultIdMap.delete(driverId); // Remove from map to track what's left
            } else {
                // Create
                createResults.push(result);
            }
        });
        
        // Any remaining IDs in the map are for drivers that were removed
        const deleteIds = Array.from(resultIdMap.values());
        
        try {
            const endpoint = this.getResultEndpoint();
            
            // Show loading message
            Utils.showSuccess('Updating results...');
            
            // Calculate fantasy points for all results
            // We need to do this after all results are prepared to calculate teammate comparisons correctly
            if (this.currentType === 'race') {
                // Create a temporary combined array of all results for this race
                const allResults = [...updateResults, ...createResults];
                
                // Make a copy of the current app state results
                const originalResults = this.getResultsArray().slice();
                
                // Remove existing results for this race from the copy
                const filteredResults = originalResults.filter(r => r.race_id !== raceId);
                
                // Add our new/updated results to the filtered results
                const tempResults = [...filteredResults, ...allResults];
                
                // Temporarily replace the app state results with our combined results
                this.getResultsArray().length = 0;
                tempResults.forEach(r => this.getResultsArray().push(r));
                
                // Calculate points for each result
                allResults.forEach(result => {
                    const breakdown = this.calculatePointsBreakdown(result);
                    result.fantasy_points = breakdown.total;
                });
                
                // Restore original app state
                this.getResultsArray().length = 0;
                originalResults.forEach(r => this.getResultsArray().push(r));
            } else {
                // For non-race results, standard fantasy points calculation
                updateResults.forEach(result => {
                    const breakdown = this.calculatePointsBreakdown(result);
                    result.fantasy_points = breakdown.total;
                });
                createResults.forEach(result => {
                    const breakdown = this.calculatePointsBreakdown(result);
                    result.fantasy_points = breakdown.total;
                });
            }
            
            // Process deletes
            await Promise.all(deleteIds.map(async (id) => {
                await API.deleteData(`${endpoint}/${id}`);
                
                // Remove from app state
                const resultsArray = this.getResultsArray();
                const index = resultsArray.findIndex(r => r.id === id);
                if (index !== -1) {
                    resultsArray.splice(index, 1);
                }
            }));
            
            // Process updates
            await Promise.all(updateResults.map(async (result) => {
                const id = result.id;
                delete result.id; // Remove ID from payload
                const updatedResult = await API.putData(`${endpoint}/${id}`, result);
                
                // Update in app state
                if (updatedResult) {
                    const resultsArray = this.getResultsArray();
                    const index = resultsArray.findIndex(r => r.id === id);
                    if (index !== -1) {
                        resultsArray[index] = updatedResult;
                    }
                }
            }));
            
            // Process creates
            await Promise.all(createResults.map(async (result) => {
                const newResult = await API.postData(endpoint, result);
                
                // Add to app state
                if (newResult) {
                    this.getResultsArray().push(newResult);
                }
            }));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('result-modal'));
            modal.hide();
            
            // Refresh view
            this.renderResults();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
            
            Utils.showSuccess('Results updated successfully');
        } catch (error) {
            Utils.showError('Failed to update results');
            console.error(error);
        }
    },
    
    /**
     * Delete Result for a race
     * @param {number} raceId - ID of the race to delete results for
     */
    deleteAllRaceResults: async function(raceId) {
        if (!confirm('Are you sure you want to delete result for this race?')) {
            return;
        }
        
        // Get all result IDs for this race
        const resultsArray = this.getResultsArray();
        const resultsToDelete = resultsArray.filter(r => r.race_id === raceId);
        
        if (resultsToDelete.length === 0) {
            Utils.showError('No results found for this race');
            return;
        }
        
        try {
            const endpoint = this.getResultEndpoint();
            
            // Show loading message
            Utils.showSuccess('Deleting results...');
            
            // Delete result
            await Promise.all(resultsToDelete.map(async (result) => {
                await API.deleteData(`${endpoint}/${result.id}`);
            }));
            
            // Update app state
            const newResults = resultsArray.filter(r => r.race_id !== raceId);
            
            // Replace the array content
            resultsArray.length = 0;
            newResults.forEach(r => resultsArray.push(r));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('result-modal'));
            modal.hide();
            
            // Refresh view
            this.renderResults();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
            
            Utils.showSuccess(`Deleted ${resultsToDelete.length} results successfully`);
        } catch (error) {
            Utils.showError('Failed to delete results');
            console.error(error);
        }
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
     * Render race options specifically for the modal, filtering by sprint status
     * @param {number} selectedRaceId - Optional race ID to pre-select
     * @returns {string} - HTML string of option elements
     */
    renderModalRaceOptions: function(selectedRaceId = null) {
        let options = '';
        
        // Filter races based on sprint status if needed
        let filteredRaces = appState.races;
        if (this.currentType === 'sprint' || this.currentType === 'sprint-qualifying') {
            console.log('Filtering races for sprint/sprint-qualifying view');
            filteredRaces = appState.races.filter(race => race.has_sprint);
            console.log('Found', filteredRaces.length, 'races with sprint sessions');
        }
        
        // Sort races by date
        const sortedRaces = [...filteredRaces].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        console.log('Rendering', sortedRaces.length, 'race options for', this.currentType, 'view');
        
        sortedRaces.forEach(race => {
            const selected = selectedRaceId === race.id ? 'selected' : '';
            options += `<option value="${race.id}" ${selected}>${race.name}</option>`;
        });
        
        return options;
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
                // Save the race ID before removing the result
                const raceId = resultsArray[index].race_id;
                
                // Remove the result
                resultsArray.splice(index, 1);
                
                // Check if this was the last result for this race
                const raceHasMoreResults = resultsArray.some(r => r.race_id === raceId);
                
                if (!raceHasMoreResults) {
                    Utils.showSuccess('Result deleted successfully. This was the last result for this race.');
                } else {
                    Utils.showSuccess('Result deleted successfully');
                }
            }
            
            // Refresh view
            this.renderResults();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
        } catch (error) {
            Utils.showError('Failed to delete result');
            console.error(error);
        }
    },
    
    /**
     * Helper function to handle race filtering
     * @param {number} raceId - Race ID to filter by
     */
    handleRaceFiltering: function(raceId) {
        console.log('=== RACE FILTERING DEBUG ===');
        console.log('Handling race filtering for race ID:', raceId);
        console.log('Current view type:', this.currentType);
        
        try {
            // Get the appropriate results data
            let resultsData;
            switch (this.currentType) {
                case 'race':
                    resultsData = appState.raceResults;
                    console.log('Using race results data, count:', appState.raceResults.length);
                    break;
                case 'qualifying':
                    resultsData = appState.qualifyingResults;
                    console.log('Using qualifying results data, count:', appState.qualifyingResults.length);
                    break;
                case 'sprint':
                    resultsData = appState.sprintResults;
                    console.log('Using sprint results data, count:', appState.sprintResults.length);
                    break;
                case 'sprint-qualifying':
                    resultsData = appState.sprintQualifyingResults;
                    console.log('Using sprint qualifying results data, count:', appState.sprintQualifyingResults.length);
                    break;
                default:
                    resultsData = appState.raceResults;
                    console.log('Using default (race) results data, count:', appState.raceResults.length);
            }
            
            // Log the actual results data
            console.log('Results data to be filtered:', resultsData);
            
            // Verify that the results table exists
            const tableId = `results-table-${this.currentType}`;
            const resultsTable = document.getElementById(tableId);
            console.log(`Results table element (${tableId}):`, resultsTable);
            
            if (!resultsTable) {
                console.error(`Results table (${tableId}) not found in the DOM when filtering`);
                return;
            }
            
            // Log the filtered results
            const filteredResults = raceId ? resultsData.filter(result => result.race_id === parseInt(raceId)) : resultsData;
            console.log('Filtered results count:', filteredResults.length);
            console.log('Filtered results:', filteredResults);
            
            // Render the filtered results
            this.renderResultsTable(resultsData, raceId);
            console.log('=== END RACE FILTERING DEBUG ===');
        } catch (error) {
            console.error('Error handling race filtering:', error);
        }
    },
    
    /**
     * Handle global Add Result button click events
     * @param {Event} event - Click event
     */
    handleGlobalAddResultClick: function(event) {
        // Check if this is an Add Result button click
        if (event.target && event.target.id === 'add-result-btn') {
            console.log('=== GLOBAL ADD RESULT BUTTON CLICK ===');
            console.log('Current type:', this.currentType);
            
            // Prevent default action and stop propagation
            event.preventDefault();
            event.stopPropagation();
            
            // Call the showAddResultModal method
            this.showAddResultModal();
            
            console.log('=== END GLOBAL ADD RESULT BUTTON CLICK ===');
        }
    }
};

// Make the ResultsView object available globally
window.ResultsView = ResultsView; 