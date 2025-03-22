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
        // Recalculate driver points to ensure accuracy
        const driverPointsMap = this.recalculateDriverPoints();
        
        // Create a map for quick lookup of driver points
        const driverTotalPointsMap = {};
        appState.drivers.forEach(driver => {
            const points = driverPointsMap[driver.id] || { race: 0, qualifying: 0, sprint: 0, sprintQualifying: 0, details: [] };
            // Use collectDetailedStats to get accurate totals from details
            const stats = this.collectDetailedStats(points);
            driverTotalPointsMap[driver.id] = points.race + points.qualifying + stats.sprintPoints + stats.sprintQualifyingPoints;
        });
        
        // Calculate team points
        const teamPoints = {};
        
        // Initialize team points
        appState.teams.forEach(team => {
            teamPoints[team.id] = {
                team: team,
                totalPoints: 0,
                drivers: []
            };
            
            // Add driver points to team
            if (team.driver_ids && team.driver_ids.length > 0) {
                team.driver_ids.forEach(driverId => {
                    const driver = Utils.getDriverById(driverId);
                    const driverPoints = driverTotalPointsMap[driverId] || 0;
                    
                    if (driver) {
                        teamPoints[team.id].totalPoints += driverPoints;
                        teamPoints[team.id].drivers.push({
                            driver: driver,
                            points: driverPoints
                        });
                    }
                });
            }
        });
        
        // Convert to array and sort by points
        const teamStandings = Object.values(teamPoints).sort((a, b) => b.totalPoints - a.totalPoints);
        
        // Get the table body
        const tableBody = document.querySelector('#team-standings-table tbody');
        tableBody.innerHTML = '';
        
        // Add rows for each team
        teamStandings.forEach((team, index) => {
            const row = document.createElement('tr');
            
            // Position
            const positionCell = document.createElement('td');
            positionCell.textContent = index + 1;
            row.appendChild(positionCell);
            
            // Team
            const teamCell = document.createElement('td');
            teamCell.textContent = team.team.name;
            row.appendChild(teamCell);
            
            // Owner
            const ownerCell = document.createElement('td');
            ownerCell.textContent = team.team.owner || 'N/A';
            row.appendChild(ownerCell);
            
            // Points with tooltip
            const pointsCell = document.createElement('td');
            pointsCell.textContent = team.totalPoints;
            pointsCell.setAttribute('data-bs-toggle', 'tooltip');
            pointsCell.setAttribute('data-bs-html', 'true');
            pointsCell.setAttribute('title', this.generateTeamPointsBreakdownTooltip(team));
            row.appendChild(pointsCell);
            
            tableBody.appendChild(row);
        });
        
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    },
    
    /**
     * Generate HTML for team points breakdown tooltip
     * @param {Object} team - Team object with drivers and points
     * @returns {string} - HTML for tooltip
     */
    generateTeamPointsBreakdownTooltip: function(team) {
        let html = '<div class="team-points-breakdown-tooltip" style="text-align: left;">';
        html += `<div style="font-weight: bold; margin-bottom: 5px;">${team.team.name}</div>`;
        
        // Sort drivers by points (highest first)
        const sortedDrivers = [...team.drivers].sort((a, b) => b.points - a.points);
        
        // Add each driver's points
        sortedDrivers.forEach(driverData => {
            html += `<div>${Utils.getDriverNameWithFlag(driverData.driver.name)}: ${driverData.points} points</div>`;
        });
        
        // Total
        html += `<div style="margin-top: 8px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">Total: ${team.totalPoints} points</div>`;
        
        html += '</div>';
        return html;
    },
    
    /**
     * Render driver standings
     */
    renderDriverStandings: function() {
        const driverPointsMap = this.recalculateDriverPoints();
        
        // Convert to array and sort by total points
        const driverStandings = appState.drivers.map(driver => {
            const points = driverPointsMap[driver.id] || { race: 0, qualifying: 0, sprint: 0, sprintQualifying: 0, details: [] };
            
            // Use collectDetailedStats to get accurate totals from details
            const stats = this.collectDetailedStats(points);
            const totalPoints = points.race + points.qualifying + stats.sprintPoints + stats.sprintQualifyingPoints;
            
            return {
                driver: driver,
                totalPoints: totalPoints,
                pointsBreakdown: points
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);
        
        // Get the table body
        const tableBody = document.querySelector('#driver-standings-table tbody');
        tableBody.innerHTML = '';
        
        // Add rows for each driver
        driverStandings.forEach((standing, index) => {
            const row = document.createElement('tr');
            
            // Position
            const positionCell = document.createElement('td');
            positionCell.textContent = index + 1;
            row.appendChild(positionCell);
            
            // Driver
            const driverCell = document.createElement('td');
            driverCell.innerHTML = Utils.getDriverNameWithFlag(standing.driver.name);
            row.appendChild(driverCell);
            
            // Constructor
            const constructorCell = document.createElement('td');
            constructorCell.innerHTML = Utils.getConstructorWithLogo(standing.driver.constructor);
            row.appendChild(constructorCell);
            
            // Team (Fantasy Team)
            const teamCell = document.createElement('td');
            // Find the fantasy team this driver belongs to
            const team = appState.teams.find(t => t.driver_ids && t.driver_ids.includes(standing.driver.id));
            teamCell.textContent = team ? team.name : 'FA';
            row.appendChild(teamCell);
            
            // Points with tooltip
            const pointsCell = document.createElement('td');
            pointsCell.textContent = standing.totalPoints;
            pointsCell.setAttribute('data-bs-toggle', 'tooltip');
            pointsCell.setAttribute('data-bs-html', 'true');
            pointsCell.setAttribute('title', this.generatePointsBreakdownTooltip(standing.pointsBreakdown));
            row.appendChild(pointsCell);
            
            tableBody.appendChild(row);
        });
        
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    },
    
    /**
     * Recalculate driver points from scratch
     * @returns {Object} - Map of driver IDs to points
     */
    recalculateDriverPoints: function() {
        const driverPoints = {};
        
        // Initialize all drivers with 0 points
        appState.drivers.forEach(driver => {
            driverPoints[driver.id] = {
                race: 0,
                qualifying: 0,
                sprint: 0,
                sprintQualifying: 0, // We'll rely on collectDetailedStats to calculate this correctly
                details: []
            };
        });
        
        // Calculate race points
        appState.raceResults.forEach(result => {
            const driver_id = result.driver_id;
            if (driverPoints[driver_id]) {
                const breakdown = this.calculateRacePointsBreakdown(result);
                driverPoints[driver_id].race += breakdown.total;
                
                // Add details for tooltip
                driverPoints[driver_id].details.push({
                    type: 'Race',
                    race_id: result.race_id,
                    race_name: Utils.getRaceById(result.race_id)?.name || 'Unknown Race',
                    position: result.position,
                    breakdown: breakdown
                });
            }
        });
        
        // Calculate qualifying points
        appState.qualifyingResults.forEach(result => {
            const driver_id = result.driver_id;
            if (driverPoints[driver_id]) {
                const breakdown = this.calculateQualifyingPointsBreakdown(result);
                driverPoints[driver_id].qualifying += breakdown.total;
                
                // Add details for tooltip
                driverPoints[driver_id].details.push({
                    type: 'Qualifying',
                    race_id: result.race_id,
                    race_name: Utils.getRaceById(result.race_id)?.name || 'Unknown Race',
                    position: result.position,
                    breakdown: breakdown
                });
            }
        });
        
        // Calculate sprint points
        appState.sprintResults.forEach(result => {
            const driver_id = result.driver_id;
            if (driverPoints[driver_id]) {
                const breakdown = this.calculateSprintPointsBreakdown(result);
                driverPoints[driver_id].sprint += breakdown.total;
                
                // Add details for tooltip
                driverPoints[driver_id].details.push({
                    type: 'Sprint',
                    race_id: result.race_id,
                    race_name: Utils.getRaceById(result.race_id)?.name || 'Unknown Race',
                    position: result.position,
                    breakdown: breakdown
                });
            }
        });
        
        // Calculate sprint qualifying points
        appState.sprintQualifyingResults.forEach(result => {
            const driver_id = result.driver_id;
            if (driverPoints[driver_id]) {
                const breakdown = this.calculateSprintQualifyingPointsBreakdown(result);
                // Note: We don't add to sprintQualifying directly to avoid double counting
                // We'll calculate this value from the details in collectDetailedStats
                
                // Add details for tooltip
                driverPoints[driver_id].details.push({
                    type: 'Sprint Qualifying',
                    race_id: result.race_id,
                    race_name: Utils.getRaceById(result.race_id)?.name || 'Unknown Race',
                    position: result.position,
                    breakdown: breakdown
                });
            }
        });
        
        return driverPoints;
    },
    
    /**
     * Calculate race points breakdown for a result
     * @param {Object} result - Race result object
     * @returns {Object} - Points breakdown
     */
    calculateRacePointsBreakdown: function(result) {
        const breakdown = {
            basePoints: 0,
            fastestLapPoints: 0,
            dnfPenalty: 0,
            positionGainPoints: 0,
            teammatePoints: 0,
            total: 0
        };
        
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
        
        // Calculate total
        breakdown.total = breakdown.basePoints + breakdown.fastestLapPoints + 
                          breakdown.dnfPenalty + breakdown.positionGainPoints + 
                          breakdown.teammatePoints;
        
        return breakdown;
    },
    
    /**
     * Calculate qualifying points breakdown for a result
     * @param {Object} result - Qualifying result object
     * @returns {Object} - Points breakdown
     */
    calculateQualifyingPointsBreakdown: function(result) {
        const breakdown = {
            basePoints: 0,
            teammatePoints: 0,
            total: 0
        };
        
        // Base qualifying points
        breakdown.basePoints = ScoringSystem.calculateQualifyingPoints(result.position);
        
        // Teammate points - each constructor has only 2 drivers
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
        
        // Calculate total
        breakdown.total = breakdown.basePoints + breakdown.teammatePoints;
        
        return breakdown;
    },
    
    /**
     * Calculate sprint points breakdown for a result
     * @param {Object} result - Sprint result object
     * @returns {Object} - Points breakdown
     */
    calculateSprintPointsBreakdown: function(result) {
        const breakdown = {
            basePoints: 0,
            teammatePoints: 0,
            positionGainPoints: 0,
            positionsGained: 0,
            total: 0
        };
        
        // Base sprint points
        breakdown.basePoints = ScoringSystem.calculateSprintPoints(result.position);
        
        // Position gain points for sprint races
        const sprintQualifyingResult = appState.sprintQualifyingResults.find(sqr => 
            sqr.race_id === result.race_id && sqr.driver_id === result.driver_id
        );
        
        if (sprintQualifyingResult) {
            const positionsGained = sprintQualifyingResult.position - result.position;
            breakdown.positionGainPoints = ScoringSystem.calculatePositionGainPoints(
                sprintQualifyingResult.position, 
                result.position
            );
            breakdown.positionsGained = positionsGained > 0 ? positionsGained : 0;
        }
        
        // Teammate points - each constructor has only 2 drivers
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
        
        // Calculate total
        breakdown.total = breakdown.basePoints + breakdown.teammatePoints + breakdown.positionGainPoints;
        
        return breakdown;
    },
    
    /**
     * Calculate sprint qualifying points breakdown for a result
     * @param {Object} result - Sprint qualifying result object
     * @returns {Object} - Points breakdown
     */
    calculateSprintQualifyingPointsBreakdown: function(result) {
        const breakdown = {
            basePoints: 0,
            teammatePoints: 0,
            total: 0
        };
        
        // Base sprint qualifying points
        breakdown.basePoints = ScoringSystem.calculateQualifyingPoints(result.position);
        
        // Teammate points - each constructor has only 2 drivers
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
        
        // Calculate total
        breakdown.total = breakdown.basePoints + breakdown.teammatePoints;
        
        return breakdown;
    },
    
    /**
     * Generate HTML for points breakdown tooltip
     * @param {Object} breakdown - Points breakdown object
     * @returns {string} - HTML for tooltip
     */
    generatePointsBreakdownTooltip: function(breakdown) {
        let html = '<div class="points-breakdown-tooltip" style="text-align: left;">';
        
        // Collect detailed statistics
        const stats = this.collectDetailedStats(breakdown);
        
        // Filter out positions with 0 points
        const racePositionsWithPoints = stats.racePositions.filter(pos => pos.points > 0);
        const qualifyingPositionsWithPoints = stats.qualifyingPositions.filter(pos => pos.points > 0);
        const sprintPositionsWithPoints = stats.sprintPositions.filter(pos => pos.points > 0);
        const sprintQualifyingPositionsWithPoints = stats.sprintQualifyingPositions.filter(pos => pos.points > 0);
        
        // Generate HTML for detailed statistics - RACE SECTION
        if (racePositionsWithPoints.length > 0 || stats.raceMatchupWins > 0 || stats.positionsGained > 0 || stats.dnfCount > 0 || stats.fastestLaps > 0) {
            html += '<div style="margin-bottom: 5px;"><strong>Race:</strong></div>';
            
            // Race Positions
            if (racePositionsWithPoints.length > 0) {
                racePositionsWithPoints.forEach(pos => {
                    html += `<div>${pos.count} P${pos.position} - +${pos.points} points</div>`;
                });
            }
            
            // Race matchup wins
            if (stats.raceMatchupWins > 0) {
                html += `<div>${stats.raceMatchupWins} race matchup wins - +${stats.raceMatchupWins * 2} points</div>`;
            }
            
            // Positions gained
            if (stats.positionsGained > 0 && stats.positionsGainedPoints > 0) {
                html += `<div>${stats.positionsGained} positions gained - +${stats.positionsGainedPoints} points</div>`;
            }
            
            // DNFs
            if (stats.dnfCount > 0) {
                html += `<div>${stats.dnfCount} DNFs - ${stats.dnfPoints} points</div>`;
            }
            
            // Fastest laps
            if (stats.fastestLaps > 0) {
                html += `<div>${stats.fastestLaps} fastest laps - +${stats.fastestLaps} points</div>`;
            }
        }
        
        // QUALIFYING SECTION
        if (qualifyingPositionsWithPoints.length > 0 || stats.qualifyingMatchupWins > 0) {
            html += '<div style="margin-top: 8px; margin-bottom: 5px;"><strong>Qualifying:</strong></div>';
            
            // Qualifying Positions
            if (qualifyingPositionsWithPoints.length > 0) {
                qualifyingPositionsWithPoints.forEach(pos => {
                    html += `<div>${pos.count} P${pos.position} - +${pos.points} points</div>`;
                });
            }
            
            // Qualifying matchup wins
            if (stats.qualifyingMatchupWins > 0) {
                html += `<div>${stats.qualifyingMatchupWins} qualifying matchup wins - +${stats.qualifyingMatchupWins * 2} points</div>`;
            }
        }
        
        // SPRINT RACE SECTION
        if (sprintPositionsWithPoints.length > 0 || stats.sprintMatchupWins > 0 || stats.sprintPositionsGained > 0) {
            html += '<div style="margin-top: 8px; margin-bottom: 5px;"><strong>Sprint Race:</strong></div>';
            
            // Sprint Race Positions
            if (sprintPositionsWithPoints.length > 0) {
                sprintPositionsWithPoints.forEach(pos => {
                    html += `<div>${pos.count} P${pos.position} - +${pos.points} points</div>`;
                });
            }
            
            // Sprint matchup wins
            if (stats.sprintMatchupWins > 0) {
                html += `<div>${stats.sprintMatchupWins} sprint matchup wins - +${stats.sprintMatchupWins * 2} points</div>`;
            }
            
            // Sprint positions gained
            if (stats.sprintPositionsGained > 0 && stats.sprintPositionsGainedPoints > 0) {
                html += `<div>${stats.sprintPositionsGained} positions gained - +${stats.sprintPositionsGainedPoints} points</div>`;
            }
        }
        
        // SPRINT QUALIFYING SECTION
        if (sprintQualifyingPositionsWithPoints.length > 0 || stats.sprintQualifyingMatchupWins > 0) {
            html += '<div style="margin-top: 8px; margin-bottom: 5px;"><strong>Sprint Qualifying:</strong></div>';
            
            // Sprint Qualifying Positions
            if (sprintQualifyingPositionsWithPoints.length > 0) {
                sprintQualifyingPositionsWithPoints.forEach(pos => {
                    html += `<div>${pos.count} P${pos.position} - +${pos.points} points</div>`;
                });
            }
            
            // Sprint Qualifying matchup wins
            if (stats.sprintQualifyingMatchupWins > 0) {
                html += `<div>${stats.sprintQualifyingMatchupWins} sprint qualifying matchup wins - +${stats.sprintQualifyingMatchupWins * 2} points</div>`;
            }
        }
        
        // Total
        html += `<div style="margin-top: 8px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">Total: ${breakdown.race + breakdown.qualifying + stats.sprintPoints + stats.sprintQualifyingPoints} points</div>`;
        
        html += '</div>';
        
        return html;
    },
    
    /**
     * Collect detailed statistics from points breakdown
     * @param {Object} breakdown - Points breakdown object
     * @returns {Object} - Detailed statistics
     */
    collectDetailedStats: function(breakdown) {
        const stats = {
            racePositions: [],
            qualifyingPositions: [],
            sprintPositions: [], // Added array to track sprint race positions
            sprintQualifyingPositions: [],
            raceMatchupWins: 0,
            qualifyingMatchupWins: 0,
            dnfCount: 0,
            dnfPoints: 0,
            positionsGained: 0,
            positionsGainedPoints: 0,
            sprintPositionsGained: 0, // Track sprint positions gained separately
            sprintPositionsGainedPoints: 0, // Track sprint position gain points separately
            fastestLaps: 0,
            sprintPoints: 0, // We'll calculate this from details instead, not using breakdown.sprint
            sprintQualifyingPoints: 0,
            sprintMatchupWins: 0,
            sprintQualifyingMatchupWins: 0
        };
        
        // Process race details
        const racePositionCounts = {};
        const qualifyingPositionCounts = {};
        const sprintPositionCounts = {}; // Added object to track sprint race positions
        const sprintQualifyingPositionCounts = {};
        
        breakdown.details.forEach(detail => {
            if (detail.type === 'Race') {
                // Count positions
                const position = detail.position;
                if (!racePositionCounts[position]) {
                    racePositionCounts[position] = { count: 0, points: 0 };
                }
                
                // Add base points to position count
                racePositionCounts[position].count++;
                racePositionCounts[position].points += detail.breakdown.basePoints;
                
                // Count matchup wins
                if (detail.breakdown.teammatePoints > 0) {
                    stats.raceMatchupWins++;
                }
                
                // Count DNFs
                if (detail.breakdown.dnfPenalty < 0) {
                    stats.dnfCount++;
                    stats.dnfPoints += detail.breakdown.dnfPenalty;
                }
                
                // Count positions gained
                if (detail.breakdown.positionsGained > 0) {
                    stats.positionsGained += detail.breakdown.positionsGained;
                    stats.positionsGainedPoints += detail.breakdown.positionGainPoints;
                }
                
                // Count fastest laps
                if (detail.breakdown.fastestLapPoints > 0) {
                    stats.fastestLaps++;
                }
            } else if (detail.type === 'Qualifying') {
                // Count qualifying positions
                const position = detail.position;
                if (!qualifyingPositionCounts[position]) {
                    qualifyingPositionCounts[position] = { count: 0, points: 0 };
                }
                
                // Add base points to position count
                qualifyingPositionCounts[position].count++;
                qualifyingPositionCounts[position].points += detail.breakdown.basePoints;
                
                // Count qualifying matchup wins
                if (detail.breakdown.teammatePoints > 0) {
                    stats.qualifyingMatchupWins++;
                }
            } else if (detail.type === 'Sprint Qualifying') {
                // Track sprint qualifying positions properly
                const position = detail.position;
                if (!sprintQualifyingPositionCounts[position]) {
                    sprintQualifyingPositionCounts[position] = { count: 0, points: 0 };
                }
                
                // Add base points to position count
                sprintQualifyingPositionCounts[position].count++;
                sprintQualifyingPositionCounts[position].points += detail.breakdown.basePoints;
                
                // Add to total sprint qualifying points
                stats.sprintQualifyingPoints += detail.breakdown.total;
                
                // Count sprint qualifying matchup wins
                if (detail.breakdown.teammatePoints > 0) {
                    stats.sprintQualifyingMatchupWins++;
                }
            } else if (detail.type === 'Sprint') {
                // Track sprint race positions properly
                const position = detail.position;
                if (!sprintPositionCounts[position]) {
                    sprintPositionCounts[position] = { count: 0, points: 0 };
                }
                
                // Add base points to position count
                sprintPositionCounts[position].count++;
                sprintPositionCounts[position].points += detail.breakdown.basePoints;
                
                // Add to total sprint points
                stats.sprintPoints += detail.breakdown.total;
                
                // Count sprint matchup wins
                if (detail.breakdown.teammatePoints > 0) {
                    stats.sprintMatchupWins++;
                }
                
                // Count positions gained in sprint
                if (detail.breakdown.positionsGained > 0) {
                    stats.sprintPositionsGained += detail.breakdown.positionsGained;
                    stats.sprintPositionsGainedPoints += detail.breakdown.positionGainPoints;
                }
            }
        });
        
        // Convert race position counts to array and sort
        for (const position in racePositionCounts) {
            stats.racePositions.push({
                position: parseInt(position),
                count: racePositionCounts[position].count,
                points: racePositionCounts[position].points
            });
        }
        
        // Convert qualifying position counts to array and sort
        for (const position in qualifyingPositionCounts) {
            stats.qualifyingPositions.push({
                position: parseInt(position),
                count: qualifyingPositionCounts[position].count,
                points: qualifyingPositionCounts[position].points
            });
        }
        
        // Convert sprint position counts to array and sort
        for (const position in sprintPositionCounts) {
            stats.sprintPositions.push({
                position: parseInt(position),
                count: sprintPositionCounts[position].count,
                points: sprintPositionCounts[position].points
            });
        }
        
        // Convert sprint qualifying position counts to array and sort
        for (const position in sprintQualifyingPositionCounts) {
            stats.sprintQualifyingPositions.push({
                position: parseInt(position),
                count: sprintQualifyingPositionCounts[position].count,
                points: sprintQualifyingPositionCounts[position].points
            });
        }
        
        // Sort positions by position number
        stats.racePositions.sort((a, b) => a.position - b.position);
        stats.qualifyingPositions.sort((a, b) => a.position - b.position);
        stats.sprintPositions.sort((a, b) => a.position - b.position);
        stats.sprintQualifyingPositions.sort((a, b) => a.position - b.position);
        
        return stats;
    }
};

// Make the Dashboard object available globally
window.Dashboard = Dashboard; 