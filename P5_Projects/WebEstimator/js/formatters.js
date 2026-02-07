// Number formatting utilities
const Formatters = {
    formatNumber(num) {
        return num.toLocaleString();
    },

    parseFormattedNumber(str) {
        return parseInt(String(str).replace(/,/g, ''), 10) || 0;
    },

    formatInput(input) {
        const cursorPos = input.selectionStart;
        const value = String(input.value).replace(/,/g, '');
        const num = parseInt(value, 10) || 0;
        const formatted = this.formatNumber(num);
        input.value = formatted;
        const newCursorPos = Math.max(0, Math.min(formatted.length, formatted.length - (String(input.value).length - cursorPos)));
        input.setSelectionRange(newCursorPos, newCursorPos);
    },

    handleInputFocus(input) {
        input.value = String(input.value).replace(/,/g, '');
    }
};
