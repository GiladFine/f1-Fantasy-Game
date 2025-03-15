/**
 * Teams View
 * 
 * Handles the teams view which shows and allows editing of teams.
 */

const TeamsView = {
    /**
     * Initialize the teams view
     */
    initialize: function() {
        console.log('Initializing teams view...');
        this.renderTeams();
        this.setupEventListeners();
    },
    
    /**
     * Render the teams in the view
     */
    renderTeams: function() {
        const teamsView = document.getElementById('teams-view');
        teamsView.innerHTML = `
            <h2>Teams</h2>
            <div class="row mb-4">
                <div class="col-12">
                    <button id="add-team-btn" class="btn btn-primary">Add Team</button>
                </div>
            </div>
            <div class="row" id="teams-container">
                <!-- Teams will be rendered here -->
            </div>
        `;
        
        const teamsContainer = document.getElementById('teams-container');
        
        // Render each team
        appState.teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'col-md-4 mb-4';
            teamCard.innerHTML = `
                <div class="card team-card" data-team-id="${team.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3>${team.name}</h3>
                        <div>
                            <button class="btn btn-sm btn-outline-light edit-team-btn">Edit</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>Owner:</strong> ${team.owner}</p>
                        <h4>Drivers</h4>
                        <ul class="list-group team-drivers-list">
                            ${this.renderTeamDrivers(team.driver_ids)}
                        </ul>
                    </div>
                </div>
            `;
            
            teamsContainer.appendChild(teamCard);
        });
    },
    
    /**
     * Render the list of drivers for a team
     * @param {Array} driverIds - Array of driver IDs in the team
     * @returns {string} - HTML string of driver list items
     */
    renderTeamDrivers: function(driverIds) {
        let driversHtml = '';
        
        driverIds.forEach(driverId => {
            const driver = Utils.getDriverById(driverId);
            driversHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${driver.name}
                    <span class="badge bg-secondary">${driver.constructor}</span>
                </li>
            `;
        });
        
        return driversHtml;
    },
    
    /**
     * Set up event listeners for the teams view
     */
    setupEventListeners: function() {
        // Add team button
        const addTeamBtn = document.getElementById('add-team-btn');
        if (addTeamBtn) {
            addTeamBtn.addEventListener('click', this.showAddTeamModal.bind(this));
        }
        
        // Edit team buttons
        const editTeamBtns = document.querySelectorAll('.edit-team-btn');
        editTeamBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const teamCard = event.target.closest('.team-card');
                const teamId = parseInt(teamCard.getAttribute('data-team-id'));
                this.showEditTeamModal(teamId);
            });
        });
    },
    
    /**
     * Show modal for adding a new team
     */
    showAddTeamModal: function() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="team-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Team</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="team-form">
                                <div class="mb-3">
                                    <label for="team-name" class="form-label">Team Name</label>
                                    <input type="text" class="form-control" id="team-name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="team-owner" class="form-label">Owner</label>
                                    <input type="text" class="form-control" id="team-owner" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Select Drivers (5)</label>
                                    <div id="driver-selection-container">
                                        <!-- Driver selection will be rendered here -->
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-team-btn">Save Team</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Populate driver selection
        this.populateDriverSelection();
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('team-modal'));
        modal.show();
        
        // Add event listener for save button
        document.getElementById('save-team-btn').addEventListener('click', this.saveTeam.bind(this));
        
        // Remove modal from DOM when hidden
        document.getElementById('team-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Show modal for editing an existing team
     * @param {number} teamId - ID of the team to edit
     */
    showEditTeamModal: function(teamId) {
        const team = appState.teams.find(t => t.id === teamId);
        if (!team) {
            Utils.showError('Team not found');
            return;
        }
        
        // Create modal HTML (similar to add modal but with pre-filled values)
        const modalHtml = `
            <div class="modal fade" id="team-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Team</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="team-form" data-team-id="${team.id}">
                                <div class="mb-3">
                                    <label for="team-name" class="form-label">Team Name</label>
                                    <input type="text" class="form-control" id="team-name" value="${team.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="team-owner" class="form-label">Owner</label>
                                    <input type="text" class="form-control" id="team-owner" value="${team.owner}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Select Drivers (5)</label>
                                    <div id="driver-selection-container">
                                        <!-- Driver selection will be rendered here -->
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger me-auto" id="delete-team-btn">Delete Team</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-team-btn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Populate driver selection with pre-selected drivers
        this.populateDriverSelection(team.driver_ids);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('team-modal'));
        modal.show();
        
        // Add event listeners for save and delete buttons
        document.getElementById('save-team-btn').addEventListener('click', this.saveTeam.bind(this));
        document.getElementById('delete-team-btn').addEventListener('click', () => this.deleteTeam(teamId));
        
        // Remove modal from DOM when hidden
        document.getElementById('team-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Populate the driver selection in the team modal
     * @param {Array} selectedDriverIds - Array of pre-selected driver IDs (for editing)
     */
    populateDriverSelection: function(selectedDriverIds = []) {
        const container = document.getElementById('driver-selection-container');
        container.innerHTML = '';
        
        appState.drivers.forEach(driver => {
            const isSelected = selectedDriverIds.includes(driver.id);
            const driverCheckbox = document.createElement('div');
            driverCheckbox.className = 'form-check';
            driverCheckbox.innerHTML = `
                <input class="form-check-input driver-checkbox" type="checkbox" value="${driver.id}" 
                    id="driver-${driver.id}" ${isSelected ? 'checked' : ''}>
                <label class="form-check-label" for="driver-${driver.id}">
                    ${driver.name} (${driver.constructor})
                </label>
            `;
            
            container.appendChild(driverCheckbox);
        });
    },
    
    /**
     * Save a team (create new or update existing)
     */
    saveTeam: async function() {
        const form = document.getElementById('team-form');
        const teamId = form.getAttribute('data-team-id');
        const isEdit = !!teamId;
        
        // Get form values
        const name = document.getElementById('team-name').value.trim();
        const owner = document.getElementById('team-owner').value.trim();
        
        // Get selected drivers
        const selectedDrivers = [];
        document.querySelectorAll('.driver-checkbox:checked').forEach(checkbox => {
            selectedDrivers.push(parseInt(checkbox.value));
        });
        
        // Validate
        if (!name || !owner) {
            Utils.showError('Please fill in all required fields');
            return;
        }
        
        if (selectedDrivers.length !== 5) {
            Utils.showError('Please select exactly 5 drivers');
            return;
        }
        
        // Prepare team data
        const teamData = {
            name,
            owner,
            driver_ids: selectedDrivers
        };
        
        try {
            let result;
            
            if (isEdit) {
                // Update existing team
                result = await API.putData(`/teams/${teamId}`, teamData);
                
                // Update in app state
                const index = appState.teams.findIndex(t => t.id === parseInt(teamId));
                if (index !== -1) {
                    appState.teams[index] = result;
                }
                
                Utils.showSuccess('Team updated successfully');
            } else {
                // Create new team
                result = await API.postData('/teams', teamData);
                
                // Add to app state
                appState.teams.push(result);
                
                Utils.showSuccess('Team created successfully');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('team-modal'));
            modal.hide();
            
            // Refresh view
            this.renderTeams();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
        } catch (error) {
            Utils.showError('Failed to save team');
            console.error(error);
        }
    },
    
    /**
     * Delete a team
     * @param {number} teamId - ID of the team to delete
     */
    deleteTeam: async function(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) {
            return;
        }
        
        try {
            await API.deleteData(`/teams/${teamId}`);
            
            // Remove from app state
            appState.teams = appState.teams.filter(t => t.id !== parseInt(teamId));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('team-modal'));
            modal.hide();
            
            // Refresh view
            this.renderTeams();
            this.setupEventListeners();
            
            // Recalculate standings
            DataManager.calculateStandings();
            
            Utils.showSuccess('Team deleted successfully');
        } catch (error) {
            Utils.showError('Failed to delete team');
            console.error(error);
        }
    }
};

// Make the TeamsView object available globally
window.TeamsView = TeamsView; 