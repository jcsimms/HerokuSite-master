// UI rendering and DOM manipulation
const UI = {
    renderStaticLines: function (customerCount, sources) {
        var staticLinesContainer = document.getElementById('staticLinesContainer');
        if (!staticLinesContainer) return;
        var systemRecordsAndEvents = Calculator.calculateSystemRecordsAndEvents(customerCount, sources);
        var systemProfiles = Calculator.calculateSystemProfiles(customerCount, sources);
        var unifiedProfiles = Calculator.calculateUnifiedProfiles(customerCount);
        staticLinesContainer.innerHTML = [
            '<div class="summary-block">',
            '<div class="summary-row"><span class="summary-label">System Records and Events</span><span class="summary-value" id="systemRecordsAndEvents">' + Formatters.formatNumber(systemRecordsAndEvents) + '</span></div>',
            '<div class="summary-row"><span class="summary-label">System Profiles</span><span class="summary-value" id="systemProfiles">' + Formatters.formatNumber(systemProfiles) + '</span></div>',
            '<div class="summary-row"><span class="summary-label">Unified Profiles</span><span class="summary-value" id="unifiedProfiles">' + Formatters.formatNumber(unifiedProfiles) + '</span></div>',
            '</div>'
        ].join('');
    },

    renderSources: function (sources, customerCount) {
        var sourcesContainer = document.getElementById('sourcesContainer');
        if (!sourcesContainer) return;
        sourcesContainer.innerHTML = '';

        var typeMultiplier;
        var baseValue;
        var calculatedTotal;
        var displayValue;
        var i;
        var line;
        var lineIndex;
        var advancedDiv;
        var calculatedLineValue;

        sources.forEach(function (source, index) {
            calculatedTotal = Calculator.calculateSourceTotal(
                customerCount,
                source.multiplier,
                source.type,
                source
            );

            typeMultiplier = source.type === 'events' ? Calculator.MULTIPLIERS.EVENTS : Calculator.MULTIPLIERS.RECORDS;
            baseValue = customerCount * typeMultiplier;

            var wrapperDiv = document.createElement('div');
            wrapperDiv.className = 'source-item-wrapper';

            var sourceDiv = document.createElement('div');
            sourceDiv.className = 'source-item';
            sourceDiv.innerHTML = [
                '<div class="source-name">',
                '<input type="text" class="source-name-input" value="' + (source.name || '').replace(/"/g, '&quot;') + '" oninput="App.updateSourceName(' + index + ', this.value)">',
                '</div>',
                '<div class="source-type">',
                '<div class="radio-column"><div class="radio-column-label">Customer Records</div>',
                '<input type="radio" name="type-' + index + '" class="radio-button" value="records" ' + (source.type === 'records' ? 'checked' : '') + ' onchange="App.updateSourceType(' + index + ', \'records\')">',
                '</div>',
                '<div class="radio-column"><div class="radio-column-label">Streaming Events</div>',
                '<input type="radio" name="type-' + index + '" class="radio-button" value="events" ' + (source.type === 'events' ? 'checked' : '') + ' onchange="App.updateSourceType(' + index + ', \'events\')">',
                '</div></div>',
                '<div class="source-multiplier">',
                '<div class="source-multiplier-label">Multiplier Value</div>',
                '<div class="stepper-container">',
                '<button class="stepper-button" onclick="App.changeSourceMultiplier(' + index + ', -1)" aria-label="Decrease">−</button>',
                '<input type="number" class="stepper-input" id="multiplier-' + index + '" value="' + source.multiplier + '" readonly>',
                '<button class="stepper-button" onclick="App.changeSourceMultiplier(' + index + ', 1)" aria-label="Increase">+</button>',
                '</div></div>',
                '<div class="source-checkbox">',
                '<input type="checkbox" id="profileCheckbox-' + index + '" ' + (source.containsProfiles ? 'checked' : '') + ' onchange="App.updateContainsProfiles(' + index + ', this.checked)">',
                '<label for="profileCheckbox-' + index + '" class="source-checkbox-label">Contains Customer Profiles</label>',
                '</div>',
                '<div class="source-result">',
                '<input type="text" class="source-result-input" id="result-' + index + '" value="' + Formatters.formatNumber(source.manualTotal !== undefined ? source.manualTotal : calculatedTotal) + '" oninput="Formatters.formatInput(this)" onblur="App.handleSourceTotalInput(' + index + ', this)" onfocus="Formatters.handleInputFocus(this)">',
                '<button class="revert-button ' + (source.manualTotal !== undefined ? 'enabled' : '') + '" id="revert-' + index + '" onclick="if (this.classList.contains(\'enabled\')) App.revertSourceTotal(' + index + ')" ' + (source.manualTotal === undefined ? 'disabled' : '') + ' title="' + (source.manualTotal !== undefined ? 'Revert to calculated value' : 'No manual edit to revert') + '">',
                '<span class="revert-button-icon">↶</span></button>',
                '</div>',
                '<button class="advanced-button" onclick="App.toggleAdvanced(' + index + ')">' + (source.expanded ? 'Hide' : 'Advanced') + '</button>'
            ].join('');

            wrapperDiv.appendChild(sourceDiv);

            if (source.expanded && source.advancedLines && source.advancedLines.length > 0) {
                for (lineIndex = 0; lineIndex < source.advancedLines.length; lineIndex++) {
                    line = source.advancedLines[lineIndex];
                    if (line.isProfile || (source.containsProfiles && lineIndex === 0)) {
                        calculatedLineValue = customerCount;
                    } else {
                        calculatedLineValue = baseValue;
                    }
                    displayValue = line.manualTotal !== undefined ? line.manualTotal : calculatedLineValue;

                    advancedDiv = document.createElement('div');
                    advancedDiv.className = 'source-item-advanced';
                    advancedDiv.innerHTML = [
                        '<div class="source-name">',
                        '<input type="text" class="source-name-input" value="' + (line.name || '').replace(/"/g, '&quot;') + '" oninput="App.updateAdvancedLineName(' + index + ', ' + lineIndex + ', this.value)">',
                        '</div>',
                        '<div class="advanced-line-profiles">',
                        '<input type="checkbox" id="advanced-profiles-' + index + '-' + lineIndex + '" ' + (line.isProfile ? 'checked' : '') + ' onchange="App.updateAdvancedLineProfiles(' + index + ', ' + lineIndex + ', this.checked)">',
                        '<label for="advanced-profiles-' + index + '-' + lineIndex + '" class="advanced-line-profiles-label">Profiles</label>',
                        '</div>',
                        '<div class="source-type"></div><div class="source-multiplier"></div><div class="source-checkbox"></div>',
                        '<div class="source-result">',
                        '<input type="text" class="source-result-input" id="result-advanced-' + index + '-' + lineIndex + '" value="' + Formatters.formatNumber(displayValue) + '" oninput="Formatters.formatInput(this)" onblur="App.handleAdvancedLineTotalInput(' + index + ', ' + lineIndex + ', this)" onfocus="Formatters.handleInputFocus(this)">',
                        '<button class="revert-button ' + (line.manualTotal !== undefined ? 'enabled' : '') + '" id="revert-advanced-' + index + '-' + lineIndex + '" onclick="if (this.classList.contains(\'enabled\')) App.revertAdvancedLineTotal(' + index + ', ' + lineIndex + ')" ' + (line.manualTotal === undefined ? 'disabled' : '') + ' title="Revert"><span class="revert-button-icon">↶</span></button>',
                        '</div>'
                    ].join('');
                    wrapperDiv.appendChild(advancedDiv);
                }
            }

            sourcesContainer.appendChild(wrapperDiv);
        });
    },

    updateGrandTotal: function (total) {
        var el = document.getElementById('grandTotal');
        if (el) el.textContent = Formatters.formatNumber(total);
    },

    updateStaticLines: function (customerCount, sources) {
        var systemRecordsAndEvents = Calculator.calculateSystemRecordsAndEvents(customerCount, sources);
        var systemProfiles = Calculator.calculateSystemProfiles(customerCount, sources);
        var unifiedProfiles = Calculator.calculateUnifiedProfiles(customerCount);
        var el;
        el = document.getElementById('systemRecordsAndEvents');
        if (el) el.textContent = Formatters.formatNumber(systemRecordsAndEvents);
        el = document.getElementById('systemProfiles');
        if (el) el.textContent = Formatters.formatNumber(systemProfiles);
        el = document.getElementById('unifiedProfiles');
        if (el) el.textContent = Formatters.formatNumber(unifiedProfiles);
    }
};
