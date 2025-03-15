/**
 * Dashboard View
 * 
 * Handles the dashboard view which shows team and driver standings.
 */

const Dashboard = {
    /**
     * Initialize the dashboard view
     */
    initialize: function() {
        console.log('Initializing dashboard view...');
        this.renderTeamStandings();
        this.renderDriverStandings();
    },
    
    /**
     * Render the team standings table
     */
    renderTeamStandings: function() {
        const tableBody = document.querySelector('#team-standings-table tbody');
        tableBody.innerHTML = '';
        
        appState.teamStandings.forEach((teamData, index) => {
            const row = document.createElement('tr');
            
            // Position column
            const positionCell = document.createElement('td');
            positionCell.textContent = index + 1;
            row.appendChild(positionCell);
            
            // Team name column
            const teamNameCell = document.createElement('td');
            teamNameCell.textContent = teamData.team.name;
            row.appendChild(teamNameCell);
            
            // Team owner column
            const ownerCell = document.createElement('td');
            ownerCell.textContent = teamData.team.owner;
            row.appendChild(ownerCell);
            
            // Points column
            const pointsCell = document.createElement('td');
            pointsCell.textContent = teamData.totalPoints;
            pointsCell.classList.add('fw-bold');
            row.appendChild(pointsCell);
            
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Render the driver standings table
     */
    renderDriverStandings: function() {
        const tableBody = document.querySelector('#driver-standings-table tbody');
        tableBody.innerHTML = '';
        
        appState.driverStandings.forEach((driverData, index) => {
            const row = document.createElement('tr');
            
            // Position column
            const positionCell = document.createElement('td');
            positionCell.textContent = index + 1;
            row.appendChild(positionCell);
            
            // Driver name column
            const driverNameCell = document.createElement('td');
            driverNameCell.textContent = driverData.driver.name;
            row.appendChild(driverNameCell);
            
            // Constructor column
            const constructorCell = document.createElement('td');
            constructorCell.textContent = driverData.driver.constructor;
            row.appendChild(constructorCell);
            
            // Points column
            const pointsCell = document.createElement('td');
            pointsCell.textContent = driverData.totalPoints;
            pointsCell.classList.add('fw-bold');
            row.appendChild(pointsCell);
            
            tableBody.appendChild(row);
        });
    }
};

// Make the Dashboard object available globally
window.Dashboard = Dashboard; 