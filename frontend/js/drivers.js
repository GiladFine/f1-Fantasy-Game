/**
 * Drivers View
 * 
 * Handles the drivers view which shows all drivers and free agents,
 * and allows for driver transfers between teams.
 */

const DriversView = {
    /**
     * Initialize the drivers view
     */
    initialize: function() {
        console.log('Initializing drivers view...');
        this.renderDrivers();
        this.setupEventListeners();
    },
    
    /**
     * Render the drivers in the view
     */
    renderDrivers: function() {
        const driversView = document.getElementById('drivers-view');
        driversView.innerHTML = `
            <h2>Drivers</h2>
            <ul class="nav nav-tabs mb-4" id="drivers-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="all-drivers-tab" data-bs-toggle="tab" 
                        data-bs-target="#all-drivers" type="button" role="tab" aria-selected="true">
                        All Drivers
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="free-agents-tab" data-bs-toggle="tab" 
                        data-bs-target="#free-agents" type="button" role="tab" aria-selected="false">
                        Free Agents
                    </button>
                </li>
            </ul>
            
            <div class="tab-content" id="drivers-tab-content">
                <div class="tab-pane fade show active" id="all-drivers" role="tabpanel">
                    <div class="row mb-4">
                        <div class="col-12">
                            <button id="add-driver-btn" class="btn btn-primary">Add Driver</button>
                        </div>
                    </div>
                    <div class="row" id="all-drivers-container">
                        <!-- All drivers will be rendered here -->
                    </div>
                </div>
                
                <div class="tab-pane fade" id="free-agents" role="tabpanel">
                    <div class="row" id="free-agents-container">
                        <!-- Free agents will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        
        // Render all drivers
        this.renderAllDrivers();
        
        // Fetch and render free agents
        this.renderFreeAgents();
    },
    
    /**
     * Render all drivers in the system
     */
    renderAllDrivers: function() {
        const container = document.getElementById('all-drivers-container');
        container.innerHTML = '';
        
        appState.drivers.forEach(driver => {
            const driverCard = document.createElement('div');
            driverCard.className = 'col-md-4 mb-4';
            driverCard.innerHTML = `
                <div class="card driver-card" data-driver-id="${driver.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3>${driver.name}</h3>
                        <div>
                            <button class="btn btn-sm btn-outline-light edit-driver-btn">Edit</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>Number:</strong> ${driver.number}</p>
                        <p><strong>Constructor:</strong> ${driver.constructor}</p>
                        <p><strong>Status:</strong> ${driver.is_active ? 'Active' : 'Inactive'}</p>
                        <p><strong>Team:</strong> ${this.getTeamNameForDriver(driver.id)}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(driverCard);
        });
    },
    
    /**
     * Render free agent drivers (not on any team)
     */
    renderFreeAgents: async function() {
        const container = document.getElementById('free-agents-container');
        container.innerHTML = '<div class="col-12"><p>Loading free agents...</p></div>';
        
        try {
            const freeAgents = await API.getFreeAgents();
            
            if (!freeAgents || freeAgents.length === 0) {
                container.innerHTML = '<div class="col-12"><p>No free agents available.</p></div>';
                return;
            }
            
            container.innerHTML = '';
            
            freeAgents.forEach(driver => {
                const driverCard = document.createElement('div');
                driverCard.className = 'col-md-4 mb-4';
                driverCard.innerHTML = `
                    <div class="card driver-card" data-driver-id="${driver.id}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h3>${driver.name}</h3>
                            <div>
                                <button class="btn btn-sm btn-outline-light transfer-driver-btn">Transfer</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <p><strong>Number:</strong> ${driver.number}</p>
                            <p><strong>Constructor:</strong> ${driver.constructor}</p>
                            <p><strong>Status:</strong> ${driver.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                `;
                
                container.appendChild(driverCard);
            });
            
            // Add event listeners for transfer buttons
            document.querySelectorAll('.transfer-driver-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const driverCard = event.target.closest('.driver-card');
                    const driverId = parseInt(driverCard.getAttribute('data-driver-id'));
                    this.showTransferModal(driverId);
                });
            });
        } catch (error) {
            container.innerHTML = '<div class="col-12"><p>Error loading free agents.</p></div>';
            console.error('Error loading free agents:', error);
        }
    },
    
    /**
     * Get the team name for a driver
     * @param {number} driverId - The driver ID
     * @returns {string} - Team name or "Free Agent"
     */
    getTeamNameForDriver: function(driverId) {
        for (const team of appState.teams) {
            if (team.driver_ids.includes(driverId)) {
                return team.name;
            }
        }
        return 'Free Agent';
    },
    
    /**
     * Set up event listeners for the drivers view
     */
    setupEventListeners: function() {
        // Add driver button
        const addDriverBtn = document.getElementById('add-driver-btn');
        if (addDriverBtn) {
            addDriverBtn.addEventListener('click', this.showAddDriverModal.bind(this));
        }
        
        // Edit driver buttons
        const editDriverBtns = document.querySelectorAll('.edit-driver-btn');
        editDriverBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const driverCard = event.target.closest('.driver-card');
                const driverId = parseInt(driverCard.getAttribute('data-driver-id'));
                this.showEditDriverModal(driverId);
            });
        });
    },
    
    /**
     * Show modal for adding a new driver
     */
    showAddDriverModal: function() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="driver-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Driver</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="driver-form">
                                <div class="mb-3">
                                    <label for="driver-name" class="form-label">Driver Name</label>
                                    <input type="text" class="form-control" id="driver-name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="driver-number" class="form-label">Number</label>
                                    <input type="number" class="form-control" id="driver-number" required>
                                </div>
                                <div class="mb-3">
                                    <label for="driver-constructor" class="form-label">Constructor</label>
                                    <input type="text" class="form-control" id="driver-constructor" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="driver-active" checked>
                                    <label class="form-check-label" for="driver-active">Active</label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-driver-btn">Save Driver</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('driver-modal'));
        modal.show();
        
        // Add event listener for save button
        document.getElementById('save-driver-btn').addEventListener('click', this.saveDriver.bind(this));
        
        // Remove modal from DOM when hidden
        document.getElementById('driver-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Show modal for editing an existing driver
     * @param {number} driverId - ID of the driver to edit
     */
    showEditDriverModal: function(driverId) {
        const driver = appState.drivers.find(d => d.id === driverId);
        if (!driver) {
            Utils.showError('Driver not found');
            return;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="driver-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Driver</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="driver-form" data-driver-id="${driver.id}">
                                <div class="mb-3">
                                    <label for="driver-name" class="form-label">Driver Name</label>
                                    <input type="text" class="form-control" id="driver-name" value="${driver.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="driver-number" class="form-label">Number</label>
                                    <input type="number" class="form-control" id="driver-number" value="${driver.number}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="driver-constructor" class="form-label">Constructor</label>
                                    <input type="text" class="form-control" id="driver-constructor" value="${driver.constructor}" required>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input" id="driver-active" ${driver.is_active ? 'checked' : ''}>
                                    <label class="form-check-label" for="driver-active">Active</label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger me-auto" id="delete-driver-btn">Delete Driver</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="save-driver-btn">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('driver-modal'));
        modal.show();
        
        // Add event listeners for save and delete buttons
        document.getElementById('save-driver-btn').addEventListener('click', this.saveDriver.bind(this));
        document.getElementById('delete-driver-btn').addEventListener('click', () => this.deleteDriver(driverId));
        
        // Remove modal from DOM when hidden
        document.getElementById('driver-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Show modal for transferring a driver to a team
     * @param {number} driverId - ID of the driver to transfer
     */
    showTransferModal: function(driverId) {
        const driver = appState.drivers.find(d => d.id === driverId);
        if (!driver) {
            Utils.showError('Driver not found');
            return;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="transfer-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Transfer ${driver.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="transfer-form" data-driver-id="${driver.id}">
                                <div class="mb-3">
                                    <label for="team-select" class="form-label">Select Team</label>
                                    <select class="form-select" id="team-select" required>
                                        <option value="">Select a team</option>
                                        ${this.renderTeamOptions()}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="replace-driver-select" class="form-label">Replace Driver</label>
                                    <select class="form-select" id="replace-driver-select" disabled required>
                                        <option value="">Select a driver to replace</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirm-transfer-btn" disabled>Confirm Transfer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('transfer-modal'));
        modal.show();
        
        // Add event listeners
        const teamSelect = document.getElementById('team-select');
        const replaceDriverSelect = document.getElementById('replace-driver-select');
        const confirmBtn = document.getElementById('confirm-transfer-btn');
        
        teamSelect.addEventListener('change', () => {
            const teamId = parseInt(teamSelect.value);
            if (teamId) {
                this.populateReplaceDriverSelect(teamId);
                replaceDriverSelect.disabled = false;
            } else {
                replaceDriverSelect.innerHTML = '<option value="">Select a driver to replace</option>';
                replaceDriverSelect.disabled = true;
                confirmBtn.disabled = true;
            }
        });
        
        replaceDriverSelect.addEventListener('change', () => {
            confirmBtn.disabled = !replaceDriverSelect.value;
        });
        
        confirmBtn.addEventListener('click', () => {
            const teamId = parseInt(teamSelect.value);
            const replaceDriverId = parseInt(replaceDriverSelect.value);
            this.transferDriver(teamId, replaceDriverId, driverId);
        });
        
        // Remove modal from DOM when hidden
        document.getElementById('transfer-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Render options for team select dropdown
     * @returns {string} - HTML string of option elements
     */
    renderTeamOptions: function() {
        let options = '';
        appState.teams.forEach(team => {
            options += `<option value="${team.id}">${team.name}</option>`;
        });
        return options;
    },
    
    /**
     * Populate the replace driver select dropdown based on selected team
     * @param {number} teamId - ID of the selected team
     */
    populateReplaceDriverSelect: function(teamId) {
        const team = appState.teams.find(t => t.id === teamId);
        if (!team) return;
        
        const select = document.getElementById('replace-driver-select');
        select.innerHTML = '<option value="">Select a driver to replace</option>';
        
        team.driver_ids.forEach(driverId => {
            const driver = appState.drivers.find(d => d.id === driverId);
            if (driver) {
                select.innerHTML += `<option value="${driver.id}">${driver.name}</option>`;
            }
        });
    },
    
    /**
     * Save a driver (create new or update existing)
     */
    saveDriver: async function() {
        const form = document.getElementById('driver-form');
        const driverId = form.getAttribute('data-driver-id');
        const isEdit = !!driverId;
        
        // Get form values
        const name = document.getElementById('driver-name').value.trim();
        const number = parseInt(document.getElementById('driver-number').value);
        const constructor = document.getElementById('driver-constructor').value.trim();
        const isActive = document.getElementById('driver-active').checked;
        
        // Validate
        if (!name || isNaN(number) || !constructor) {
            Utils.showError('Please fill in all required fields');
            return;
        }
        
        // Prepare driver data
        const driverData = {
            name,
            number,
            constructor,
            is_active: isActive
        };
        
        try {
            let result;
            
            if (isEdit) {
                // Update existing driver
                result = await API.putData(`/drivers/${driverId}`, driverData);
                
                // Update in app state
                const index = appState.drivers.findIndex(d => d.id === parseInt(driverId));
                if (index !== -1) {
                    appState.drivers[index] = result;
                }
                
                Utils.showSuccess('Driver updated successfully');
            } else {
                // Create new driver
                result = await API.postData('/drivers', driverData);
                
                // Add to app state
                appState.drivers.push(result);
                
                Utils.showSuccess('Driver created successfully');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('driver-modal'));
            modal.hide();
            
            // Refresh view
            this.renderDrivers();
            this.setupEventListeners();
        } catch (error) {
            Utils.showError('Failed to save driver');
            console.error(error);
        }
    },
    
    /**
     * Delete a driver
     * @param {number} driverId - ID of the driver to delete
     */
    deleteDriver: async function(driverId) {
        if (!confirm('Are you sure you want to delete this driver?')) {
            return;
        }
        
        try {
            await API.deleteData(`/drivers/${driverId}`);
            
            // Remove from app state
            appState.drivers = appState.drivers.filter(d => d.id !== parseInt(driverId));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('driver-modal'));
            modal.hide();
            
            // Refresh view
            this.renderDrivers();
            this.setupEventListeners();
            
            Utils.showSuccess('Driver deleted successfully');
        } catch (error) {
            Utils.showError('Failed to delete driver');
            console.error(error);
        }
    },
    
    /**
     * Transfer a driver to a team
     * @param {number} teamId - ID of the team
     * @param {number} currentDriverId - ID of the driver to replace
     * @param {number} newDriverId - ID of the new driver
     */
    transferDriver: async function(teamId, currentDriverId, newDriverId) {
        try {
            const result = await API.postData(`/teams/${teamId}/transfer`, {
                current_driver_id: currentDriverId,
                new_driver_id: newDriverId
            });
            
            // Update team in app state
            const teamIndex = appState.teams.findIndex(t => t.id === teamId);
            if (teamIndex !== -1) {
                appState.teams[teamIndex] = result.team;
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('transfer-modal'));
            modal.hide();
            
            // Refresh view
            this.renderDrivers();
            this.setupEventListeners();
            
            Utils.showSuccess('Driver transferred successfully');
        } catch (error) {
            Utils.showError('Failed to transfer driver');
            console.error(error);
        }
    }
};

// Make the DriversView object available globally
window.DriversView = DriversView; 