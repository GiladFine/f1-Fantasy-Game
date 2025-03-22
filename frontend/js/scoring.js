/**
 * F1 Fantasy Scoring Utilities
 * 
 * This module contains all scoring calculation logic based on the defined rules.
 */

const ScoringSystem = {
    /**
     * Calculate race/sprint points based on official F1 scoring system
     * @param {number} position - The finishing position (1-20)
     * @param {boolean} fastestLap - Whether the driver got fastest lap
     * @returns {number} - Points earned
     */
    calculateRacePoints: function(position, fastestLap = false) {
        let points = 0;
        
        // Standard F1 points system
        switch(position) {
            case 1: points = 25; break;
            case 2: points = 18; break;
            case 3: points = 15; break;
            case 4: points = 12; break;
            case 5: points = 10; break;
            case 6: points = 8; break;
            case 7: points = 6; break;
            case 8: points = 4; break;
            case 9: points = 2; break;
            case 10: points = 1; break;
            default: points = 0;
        }
        
        // Add fastest lap point if applicable and in top 10
        if (fastestLap && position <= 10) {
            points += 1;
        }
        
        return points;
    },
    
    /**
     * Calculate sprint race points based on F1 sprint scoring system
     * @param {number} position - The finishing position (1-20)
     * @returns {number} - Points earned
     */
    calculateSprintPoints: function(position) {
        let points = 0;
        
        // Sprint race points system
        switch(position) {
            case 1: points = 8; break;
            case 2: points = 7; break;
            case 3: points = 6; break;
            case 4: points = 5; break;
            case 5: points = 4; break;
            case 6: points = 3; break;
            case 7: points = 2; break;
            case 8: points = 1; break;
            default: points = 0;
        }
        
        return points;
    },
    
    /**
     * Calculate qualifying points based on position
     * @param {number} position - The qualifying position (1-20)
     * @returns {number} - Points earned
     */
    calculateQualifyingPoints: function(position) {
        switch(position) {
            case 1: return 12;
            case 2: return 8;
            case 3: return 6;
            case 4: return 4;
            case 5: return 2;
            case 6: return 1;
            default: return 0;
        }
    },
    
    /**
     * Calculate points for positions gained from qualifying to finish
     * @param {number} qualifyingPosition - Position in qualifying
     * @param {number} finishPosition - Final race position
     * @returns {number} - Points earned (1 per position gained, 0 for positions lost)
     */
    calculatePositionGainPoints: function(qualifyingPosition, finishPosition) {
        const positionsGained = qualifyingPosition - finishPosition;
        
        return positionsGained > 0 ? positionsGained : 0;
    },
    
    /**
     * Calculate DNF penalty
     * @param {boolean} finished - Whether the driver finished the race
     * @returns {number} - Points penalty (-5 if DNF, 0 otherwise)
     */
    calculateDNFPenalty: function(finished) {
        return finished ? 0 : -5;
    },
    
    /**
     * Calculate team matchup points
     * @param {Array} teamDrivers - Array of driver positions from one team
     * @param {Array} otherTeamDrivers - Array of driver positions from another team
     * @returns {number} - Points earned from matchups
     */
    calculateTeamMatchupPoints: function(teamDrivers, otherTeamDrivers) {
        let points = 0;
        
        // Compare each driver with the corresponding driver from the other team
        for (let i = 0; i < Math.min(teamDrivers.length, otherTeamDrivers.length); i++) {
            if (teamDrivers[i] < otherTeamDrivers[i]) {
                points += 2; // +2 points for beating the corresponding driver
            }
        }
        
        return points;
    },
    
    /**
     * Calculate total fantasy points for a driver in a race
     * @param {Object} raceResult - Race result object
     * @param {Object} qualifyingResult - Qualifying result object
     * @returns {number} - Total fantasy points
     */
    calculateDriverRaceFantasyPoints: function(raceResult, qualifyingResult) {
        // Race points
        let totalPoints = this.calculateRacePoints(raceResult.position, raceResult.fastest_lap);
        
        // Position gain points
        totalPoints += this.calculatePositionGainPoints(
            qualifyingResult.position, 
            raceResult.position
        );
        
        // DNF penalty
        totalPoints += this.calculateDNFPenalty(raceResult.finished);
        
        return totalPoints;
    },
    
    /**
     * Calculate total fantasy points for a driver in a sprint race
     * @param {Object} sprintResult - Sprint race result object
     * @param {Object} qualifyingResult - Qualifying or sprint qualifying result object
     * @returns {number} - Total fantasy points
     */
    calculateDriverSprintFantasyPoints: function(sprintResult, qualifyingResult) {
        // Sprint race points
        let totalPoints = this.calculateSprintPoints(sprintResult.position);
        
        // Position gain points - 1 point per position gained, just like in main races
        totalPoints += this.calculatePositionGainPoints(
            qualifyingResult.position,
            sprintResult.position
        );
        
        // DNF penalty
        totalPoints += this.calculateDNFPenalty(sprintResult.finished);
        
        return totalPoints;
    },
    
    /**
     * Calculate total fantasy points for a team across all events
     * @param {Array} teamDriverIds - Array of driver IDs in the team
     * @param {Array} allResults - All results data
     * @returns {number} - Total fantasy points for the team
     */
    calculateTeamTotalPoints: function(teamDriverIds, allResults) {
        // Implementation would aggregate all points across races and drivers
        // This would require additional API calls and data integration
        // Simplified implementation for now
        return 0;
    }
};

// Export the scoring system for use in other modules
window.ScoringSystem = ScoringSystem; 