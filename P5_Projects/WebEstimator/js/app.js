// Main application logic and state management
const App = {
    state: {
        customerCount: 1000000,
        sources: []
    },

    init: function () {
        this.setupEventListeners();
        this.updateSources(3);
        this.calculateAll();
    },

    setupEventListeners: function () {
        var totalCustomersInput = document.getElementById('totalCustomers');
        var decreaseBtn = document.getElementById('decreaseSources');
        var increaseBtn = document.getElementById('increaseSources');
        var proceedButton = document.getElementById('proceedButton');

        if (totalCustomersInput) {
            totalCustomersInput.addEventListener('input', function (e) {
                Formatters.formatInput(e.target);
            });
            totalCustomersInput.addEventListener('blur', function (e) {
                App.handleCustomerInput(e.target);
            });
            totalCustomersInput.addEventListener('focus', function (e) {
                Formatters.handleInputFocus(e.target);
            });
        }
        if (decreaseBtn) decreaseBtn.addEventListener('click', function () { App.changeSourceCount(-1); });
        if (increaseBtn) increaseBtn.addEventListener('click', function () { App.changeSourceCount(1); });
        if (proceedButton) proceedButton.addEventListener('click', function () { App.proceedToUseCases(); });
    },

    handleCustomerInput: function (input) {
        var num = Formatters.parseFormattedNumber(input.value);
        this.state.customerCount = num;
        input.value = Formatters.formatNumber(num);
        this.calculateAll();
    },

    changeSourceCount: function (val) {
        var sourceCountInput = document.getElementById('sourceCount');
        if (!sourceCountInput) return;
        var current = Formatters.parseFormattedNumber(sourceCountInput.value) || 3;
        var newVal = Math.max(1, current + val);
        sourceCountInput.value = Formatters.formatNumber(newVal);
        this.updateSources(newVal);
        this.calculateAll();
    },

    updateSources: function (count) {
        var sources = this.state.sources;
        while (sources.length < count) {
            sources.push({
                name: 'Source ' + (sources.length + 1),
                type: 'records',
                multiplier: 1,
                containsProfiles: true,
                manualTotal: undefined,
                expanded: false,
                advancedLines: []
            });
        }
        while (sources.length > count) {
            sources.pop();
        }
        sources.forEach(function (source, index) {
            App.initializeAdvancedLines(index);
        });
        UI.renderSources(this.state.sources, this.state.customerCount);
        UI.renderStaticLines(this.state.customerCount, this.state.sources);
    },

    initializeAdvancedLines: function (sourceIndex) {
        var source = this.state.sources[sourceIndex];
        var multiplier = source.multiplier;
        var targetTotal = source.containsProfiles ? multiplier + 1 : multiplier;

        if (source.containsProfiles) {
            if (source.advancedLines.length === 0) {
                source.advancedLines.unshift({
                    name: 'Customer Profiles',
                    value: undefined,
                    manualTotal: undefined,
                    isProfile: true
                });
            }
        } else {
            if (source.advancedLines.length > 0) {
                source.advancedLines.shift();
            }
        }

        var currentMultiplierLines = source.containsProfiles && source.advancedLines.length > 0
            ? source.advancedLines.length - 1
            : source.advancedLines.length;

        while (currentMultiplierLines < multiplier) {
            var lineIndex = source.advancedLines.length;
            var objectNumber = source.containsProfiles ? lineIndex : lineIndex + 1;
            var prefix = source.type === 'events' ? 'Stream' : 'Object';
            source.advancedLines.push({
                name: prefix + ' ' + objectNumber,
                value: undefined,
                manualTotal: undefined,
                isProfile: false
            });
            currentMultiplierLines++;
        }

        while (source.advancedLines.length > targetTotal) {
            source.advancedLines.pop();
        }
    },

    updateSourceName: function (index, value) {
        if (this.state.sources[index]) this.state.sources[index].name = value;
    },

    updateSourceType: function (index, type) {
        this.state.sources[index].type = type;
        this.initializeAdvancedLines(index);
        if (this.state.sources[index].expanded) {
            UI.renderSources(this.state.sources, this.state.customerCount);
        }
        this.calculateAll();
    },

    updateContainsProfiles: function (index, checked) {
        this.state.sources[index].containsProfiles = checked;
        this.initializeAdvancedLines(index);
        if (this.state.sources[index].expanded) {
            UI.renderSources(this.state.sources, this.state.customerCount);
        }
        this.calculateAll();
    },

    changeSourceMultiplier: function (index, val) {
        var source = this.state.sources[index];
        var current = parseInt(source.multiplier, 10);
        var newVal = Math.max(1, current + val);
        source.multiplier = newVal;
        var input = document.getElementById('multiplier-' + index);
        if (input) input.value = newVal;
        this.initializeAdvancedLines(index);
        if (source.expanded) {
            UI.renderSources(this.state.sources, this.state.customerCount);
        }
        this.calculateAll();
    },

    handleSourceTotalInput: function (index, input) {
        var newTotal = Formatters.parseFormattedNumber(input.value);
        input.value = Formatters.formatNumber(newTotal);
        this.state.sources[index].manualTotal = newTotal;
        var revertBtn = document.getElementById('revert-' + index);
        if (revertBtn) {
            revertBtn.classList.add('enabled');
            revertBtn.removeAttribute('disabled');
            revertBtn.title = 'Revert to calculated value';
        }
        this.calculateAll();
    },

    revertSourceTotal: function (index) {
        this.state.sources[index].manualTotal = undefined;
        var revertBtn = document.getElementById('revert-' + index);
        if (revertBtn) {
            revertBtn.classList.remove('enabled');
            revertBtn.setAttribute('disabled', 'disabled');
            revertBtn.title = 'No manual edit to revert';
        }
        this.calculateAll();
    },

    toggleAdvanced: function (index) {
        this.state.sources[index].expanded = !this.state.sources[index].expanded;
        UI.renderSources(this.state.sources, this.state.customerCount);
        this.calculateAll();
    },

    updateAdvancedLineName: function (sourceIndex, lineIndex, value) {
        var line = this.state.sources[sourceIndex].advancedLines[lineIndex];
        if (line) line.name = value;
    },

    updateAdvancedLineProfiles: function (sourceIndex, lineIndex, checked) {
        var line = this.state.sources[sourceIndex].advancedLines[lineIndex];
        if (!line) return;
        line.isProfile = checked;
        line.manualTotal = undefined;
        this.calculateAll();
    },

    handleAdvancedLineTotalInput: function (sourceIndex, lineIndex, input) {
        var newTotal = Formatters.parseFormattedNumber(input.value);
        input.value = Formatters.formatNumber(newTotal);
        this.state.sources[sourceIndex].advancedLines[lineIndex].manualTotal = newTotal;
        var revertBtn = document.getElementById('revert-advanced-' + sourceIndex + '-' + lineIndex);
        if (revertBtn) {
            revertBtn.classList.add('enabled');
            revertBtn.removeAttribute('disabled');
            revertBtn.title = 'Revert to calculated value';
        }
        this.calculateAll();
    },

    revertAdvancedLineTotal: function (sourceIndex, lineIndex) {
        this.state.sources[sourceIndex].advancedLines[lineIndex].manualTotal = undefined;
        var revertBtn = document.getElementById('revert-advanced-' + sourceIndex + '-' + lineIndex);
        if (revertBtn) {
            revertBtn.classList.remove('enabled');
            revertBtn.setAttribute('disabled', 'disabled');
            revertBtn.title = 'No manual edit to revert';
        }
        this.calculateAll();
    },

    calculateAll: function () {
        var totalCustomersInput = document.getElementById('totalCustomers');
        if (totalCustomersInput) {
            this.state.customerCount = Formatters.parseFormattedNumber(totalCustomersInput.value);
        }

        UI.updateStaticLines(this.state.customerCount, this.state.sources);

        this.state.sources.forEach(function (source, index) {
            if (source.manualTotal === undefined) {
                var total = Calculator.calculateSourceTotal(
                    this.state.customerCount,
                    source.multiplier,
                    source.type,
                    source
                );
                var resultElement = document.getElementById('result-' + index);
                if (resultElement && document.activeElement !== resultElement) {
                    resultElement.value = Formatters.formatNumber(total);
                }
            }

            if (source.expanded && source.advancedLines) {
                var typeMultiplier = source.type === 'events' ? Calculator.MULTIPLIERS.EVENTS : Calculator.MULTIPLIERS.RECORDS;
                var baseValue = this.state.customerCount * typeMultiplier;
                source.advancedLines.forEach(function (line, lineIndex) {
                    if (line.manualTotal === undefined) {
                        var resultEl = document.getElementById('result-advanced-' + index + '-' + lineIndex);
                        if (resultEl && document.activeElement !== resultEl) {
                            var calculatedValue = (line.isProfile || (source.containsProfiles && lineIndex === 0))
                                ? this.state.customerCount
                                : baseValue;
                            resultEl.value = Formatters.formatNumber(calculatedValue);
                        }
                    }
                }.bind(this));
            }
        }.bind(this));

        var grandTotal = Calculator.calculateGrandTotal(this.state.customerCount, this.state.sources);
        UI.updateGrandTotal(grandTotal);
    },

    proceedToUseCases: function () {
        var totalCustomersInput = document.getElementById('totalCustomers');
        var grandTotalElement = document.getElementById('grandTotal');
        alert('Proceeding to use cases...\n\nTotal Customers: ' + (totalCustomersInput ? totalCustomersInput.value : '') + '\nSources: ' + this.state.sources.length + '\nGrand Total: ' + (grandTotalElement ? grandTotalElement.textContent : ''));
    }
};

document.addEventListener('DOMContentLoaded', function () {
    App.init();
});
