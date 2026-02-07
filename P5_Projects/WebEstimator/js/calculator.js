// Calculation logic and constants
const Calculator = {
    MULTIPLIERS: {
        RECORDS: 5,
        EVENTS: 25
    },

    calculateSourceTotal(customerCount, multiplier, type, source) {
        if (source && source.advancedLines && source.advancedLines.length > 0) {
            let total = 0;
            const typeMultiplier = type === 'events' ? this.MULTIPLIERS.EVENTS : this.MULTIPLIERS.RECORDS;
            const baseValue = customerCount * typeMultiplier;

            source.advancedLines.forEach(function (line, lineIndex) {
                if (line.manualTotal !== undefined) {
                    total += line.manualTotal;
                } else {
                    if (line.isProfile || (source.containsProfiles && lineIndex === 0)) {
                        total += customerCount;
                    } else {
                        total += baseValue;
                    }
                }
            });
            return total;
        }
        const typeMultiplier = type === 'events' ? this.MULTIPLIERS.EVENTS : this.MULTIPLIERS.RECORDS;
        return customerCount * multiplier * typeMultiplier;
    },

    calculateUnifiedProfiles(customerCount) {
        return customerCount;
    },

    calculateSystemProfiles(customerCount, sources) {
        var total = 0;
        sources.forEach(function (source) {
            if (!source.advancedLines || source.advancedLines.length === 0) return;
            source.advancedLines.forEach(function (line, lineIndex) {
                if (line.isProfile || (source.containsProfiles && lineIndex === 0)) {
                    total += line.manualTotal !== undefined ? line.manualTotal : customerCount;
                }
            });
        });
        return total;
    },

    calculateSystemRecordsAndEvents(customerCount, sources) {
        var total = 0;
        var typeMultiplier, baseValue;
        sources.forEach(function (source) {
            if (source.advancedLines && source.advancedLines.length > 0) {
                typeMultiplier = source.type === 'events' ? this.MULTIPLIERS.EVENTS : this.MULTIPLIERS.RECORDS;
                baseValue = customerCount * typeMultiplier;
                source.advancedLines.forEach(function (line, lineIndex) {
                    if (line.isProfile || (source.containsProfiles && lineIndex === 0)) return;
                    total += line.manualTotal !== undefined ? line.manualTotal : baseValue;
                });
            } else {
                total += this.calculateSourceTotal(customerCount, source.multiplier, source.type, source);
            }
        }.bind(this));
        return total;
    },

    calculateGrandTotal(customerCount, sources) {
        var unifiedProfiles = this.calculateUnifiedProfiles(customerCount);
        var systemProfiles = this.calculateSystemProfiles(customerCount, sources);
        var systemRecordsAndEvents = this.calculateSystemRecordsAndEvents(customerCount, sources);
        return unifiedProfiles + systemProfiles + systemRecordsAndEvents;
    },

    reverseCalculateMultiplier(desiredTotal, customerCount, type) {
        var typeMultiplier = type === 'events' ? this.MULTIPLIERS.EVENTS : this.MULTIPLIERS.RECORDS;
        if (customerCount > 0 && typeMultiplier > 0) {
            return Math.max(1, Math.round(desiredTotal / (customerCount * typeMultiplier)));
        }
        return 1;
    }
};
