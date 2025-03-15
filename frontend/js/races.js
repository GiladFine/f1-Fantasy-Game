/**
 * Races View
 * 
 * Handles the races view which shows and allows editing of races.
 */

const RacesView = {
    /**
     * Initialize the races view
     */
    initialize: function() {
        console.log('Initializing races view...');
        this.renderRaces();
        this.setupEventListeners();
    },
    
    /**
     * Render the races in the view
     */
    renderRaces: function() {
        const racesView = document.getElementById('races-view');
        racesView.innerHTML = `
            <h2>Races</h2>
            <div class="row mb-4">
                <div class="col-12">
                    <button id="add-race-btn" class="btn btn-primary">Add Race</button>
                </div>
            </div>
            <div class="row" id="races-container">
                <!-- Races will be rendered here -->
            </div>
        `;
        
        const racesContainer = document.getElementById('races-container');
        
        // Sort races by date
        const sortedRaces = [...appState.races].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Render each race
        sortedRaces.forEach(race => {
            const raceCard = document.createElement('div');
            raceCard.className = 'col-md-4 mb-4';
            raceCard.innerHTML = `
                <div class="card race-card" data-race-id="${race.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3>${race.name}</h3>
                        <div>
                            <button class="btn btn-sm btn-outline-light edit-race-btn">Edit</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="race-date">${Utils.formatDate(race.date)}</p>
                        <p class="race-track">${race.track}</p>
                        <p><strong>Sprint:</strong> ${race.has_sprint ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            `;
            
            racesContainer.appendChild(raceCard);
        });
    },
    
    /**
     * Set up event listeners for the races view
     */
    setupEventListeners: function() {
        // Add race button
        const addRaceBtn = document.getElementById('add-race-btn');
        if (addRaceBtn) {
            addRaceBtn.addEventListener('click', this.showAddRaceModal.bind(this));
        }
        
        // Edit race buttons
        const editRaceBtns = document.querySelectorAll('.edit-race-btn');
        editRaceBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const raceCard = event.target.closest('.race-card');
                const raceId = parseInt(raceCard.getAttribute('data-race-id'));
                this.showEditRaceModal(raceId);
            });
        });
    },
    
    /**
     * Show modal for adding a new race
     */
    showAddRaceModal: function() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="race-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Race</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="race-form">
                                <div class="mb-3">
                                    <label for="race-name" class="form-label">Race Name</label>
                                    <input type="text" class="form-control" id="race-name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="race-track" class="form-label">Track</label>
                                    <input type="text" class="form-control" id="race-track" required>
                                </div>
                                <div class="mb-3">
                                    <label for="race-date" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="race-date" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="race-has-sprint">
                                    <label class="form-check-label" for="race-has-sprint">Has Sprint Race</label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-race-btn">Save Race</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('race-modal'));
        modal.show();
        
        // Add event listener for save button
        document.getElementById('save-race-btn').addEventListener('click', this.saveRace.bind(this));
        
        // Remove modal from DOM when hidden
        document.getElementById('race-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Show modal for editing an existing race
     * @param {number} raceId - ID of the race to edit
     */
    showEditRaceModal: function(raceId) {
        const race = appState.races.find(r => r.id === raceId);
        if (!race) {
            Utils.showError('Race not found');
            return;
        }
        
        // Format date for input
        const dateObj = new Date(race.date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="race-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Race</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="race-form" data-race-id="${race.id}">
                                <div class="mb-3">
                                    <label for="race-name" class="form-label">Race Name</label>
                                    <input type="text" class="form-control" id="race-name" value="${race.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="race-track" class="form-label">Track</label>
                                    <input type="text" class="form-control" id="race-track" value="${race.track}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="race-date" class="form-label">Date</label>
                                    <input type="date" class="form-control" id="race-date" value="${formattedDate}" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="race-has-sprint" ${race.has_sprint ? 'checked' : ''}>
                                    <label class="form-check-label" for="race-has-sprint">Has Sprint Race</label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger me-auto" id="delete-race-btn">Delete Race</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-race-btn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('race-modal'));
        modal.show();
        
        // Add event listeners for save and delete buttons
        document.getElementById('save-race-btn').addEventListener('click', this.saveRace.bind(this));
        document.getElementById('delete-race-btn').addEventListener('click', () => this.deleteRace(raceId));
        
        // Remove modal from DOM when hidden
        document.getElementById('race-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Save a race (create new or update existing)
     */
    saveRace: async function() {
        const form = document.getElementById('race-form');
        const raceId = form.getAttribute('data-race-id');
        const isEdit = !!raceId;
        
        // Get form values
        const name = document.getElementById('race-name').value.trim();
        const track = document.getElementById('race-track').value.trim();
        const date = document.getElementById('race-date').value;
        const hasSprint = document.getElementById('race-has-sprint').checked;
        
        // Validate
        if (!name || !track || !date) {
            Utils.showError('Please fill in all required fields');
            return;
        }
        
        // Prepare race data
        const raceData = {
            name,
            track,
            date: new Date(date).toISOString(),
            has_sprint: hasSprint
        };
        
        try {
            let result;
            
            if (isEdit) {
                // Update existing race
                result = await API.putData(`/races/${raceId}`, raceData);
                
                // Update in app state
                const index = appState.races.findIndex(r => r.id === parseInt(raceId));
                if (index !== -1) {
                    appState.races[index] = result;
                }
                
                Utils.showSuccess('Race updated successfully');
            } else {
                // Create new race
                result = await API.postData('/races', raceData);
                
                // Add to app state
                appState.races.push(result);
                
                Utils.showSuccess('Race created successfully');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('race-modal'));
            modal.hide();
            
            // Refresh view
            this.renderRaces();
            this.setupEventListeners();
        } catch (error) {
            Utils.showError('Failed to save race');
            console.error(error);
        }
    },
    
    /**
     * Delete a race
     * @param {number} raceId - ID of the race to delete
     */
    deleteRace: async function(raceId) {
        if (!confirm('Are you sure you want to delete this race? This will also delete all results associated with this race.')) {
            return;
        }
        
        try {
            await API.deleteData(`/races/${raceId}`);
            
            // Remove from app state
            appState.races = appState.races.filter(r => r.id !== parseInt(raceId));
            
            // Also remove any results for this race
            appState.raceResults = appState.raceResults.filter(r => r.race_id !== parseInt(raceId));
            appState.qualifyingResults = appState.qualifyingResults.filter(r => r.race_id !== parseInt(raceId));
            appState.sprintResults = appState.sprintResults.filter(r => r.race_id !== parseInt(raceId));
            appState.sprintQualifyingResults = appState.sprintQualifyingResults.filter(r => r.race_id !== parseInt(raceId));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('race-modal'));
            modal.hide();
            
            // Refresh view
            this.renderRaces();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
            
            Utils.showSuccess('Race deleted successfully');
        } catch (error) {
            Utils.showError('Failed to delete race');
            console.error(error);
        }
    }
};

// Make the RacesView object available globally
window.RacesView = RacesView; 