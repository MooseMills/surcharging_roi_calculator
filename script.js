// Constants based on the calculator data
const DI_SURCHARGE_RATE = 1.39; // Effective rate with surcharging (1.39%)
const DI_SURCHARGE_RATE_DECIMAL = DI_SURCHARGE_RATE / 100;

// Parse URL parameters and pre-fill form on page load
function prefillFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Map of URL parameter names to input field IDs
    const paramMap = {
        'volume': 'monthlyVolume',
        'cc_percent': 'creditCardPercentage',
        'comp_rate': 'competitorRate',
        'comp_cost': 'competitorSaas',
        'di_cost': 'diCost'
    };
    
    // Update each field if parameter exists
    Object.keys(paramMap).forEach(param => {
        const value = urlParams.get(param);
        if (value !== null) {
            const inputId = paramMap[param];
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.value = value;
            }
        }
    });
    
    // Handle competitor name parameter
    const competitorName = urlParams.get('competitor');
    if (competitorName) {
        const competitorNameElement = document.getElementById('competitorName');
        if (competitorNameElement) {
            // Convert to title case (capitalize first letter of each word)
            const titleCase = competitorName
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            competitorNameElement.textContent = titleCase;
        }
    }
    
    // Handle practice name parameter - personalizes "Your Practice" and "You"
    const practiceName = urlParams.get('practice');
    if (practiceName) {
        // Function to make practice name possessive
        const makePossessive = (name) => {
            // If name ends with 's', just add apostrophe, otherwise add 's
            return name.endsWith('s') ? name + "'" : name + "'s";
        };
        
        // Update all instances of "Your Practice" with the practice name
        const practiceNameTitle = document.getElementById('practiceNameTitle');
        const practiceNameDetails = document.getElementById('practiceNameDetails');
        const practiceNameMonthlySavings = document.getElementById('practiceNameMonthlySavings');
        const practiceNameAnnualSavings = document.getElementById('practiceNameAnnualSavings');
        
        if (practiceNameTitle) practiceNameTitle.textContent = practiceName;
        if (practiceNameDetails) practiceNameDetails.textContent = makePossessive(practiceName); // Possessive form
        if (practiceNameMonthlySavings) practiceNameMonthlySavings.textContent = practiceName;
        if (practiceNameAnnualSavings) practiceNameAnnualSavings.textContent = practiceName;
    }
    
    // Note: We no longer auto-calculate when parameters are present
    // Users must click "Calculate Savings" button themselves
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Main calculation function
function calculateROI() {
    // Get input values - use placeholder as default if field is empty
    const monthlyVolumeInput = document.getElementById('monthlyVolume');
    const creditCardPercentageInput = document.getElementById('creditCardPercentage');
    const competitorRateInput = document.getElementById('competitorRate');
    const competitorSaasInput = document.getElementById('competitorSaas');
    const diCostInput = document.getElementById('diCost');
    
    const monthlyVolume = parseFloat(monthlyVolumeInput.value || monthlyVolumeInput.placeholder) || 0;
    const creditCardPercentage = parseFloat(creditCardPercentageInput.value || creditCardPercentageInput.placeholder) || 0;
    const competitorRate = parseFloat(competitorRateInput.value || competitorRateInput.placeholder) || 0;
    const competitorSaas = parseFloat(competitorSaasInput.value || competitorSaasInput.placeholder.replace(/[^0-9.]/g, '')) || 0;
    const diCost = parseFloat(diCostInput.value || diCostInput.placeholder) || 0;

    // Validate inputs
    if (monthlyVolume <= 0) {
        alert('Please enter a valid monthly processing volume');
        return;
    }

    // Calculate credit card volume
    const creditCardVolume = monthlyVolume * (creditCardPercentage / 100);
    const debitVolume = monthlyVolume - creditCardVolume;

    // Calculate competitor costs
    const competitorRateDecimal = competitorRate / 100;
    const competitorProcessingCost = monthlyVolume * competitorRateDecimal;
    const competitorTotalCost = competitorSaas + competitorProcessingCost;

    // Calculate DI costs with surcharging
    // With surcharging, the effective rate on credit cards is ~1.39%
    // Debit cards are processed normally (assuming same rate for simplicity)
    const diProcessingCost = monthlyVolume * DI_SURCHARGE_RATE_DECIMAL;
    const diTotalCost = diCost + diProcessingCost;

    // Calculate savings
    const monthlySavings = competitorTotalCost - diTotalCost;
    const annualSavings = monthlySavings * 12;

    // Update the UI
    updateResults({
        competitorSaas: competitorSaas,
        competitorProcessing: competitorProcessingCost,
        competitorTotal: competitorTotalCost,
        diSaas: diCost,
        diProcessing: diProcessingCost,
        diTotal: diTotalCost,
        monthlySavings: monthlySavings,
        annualSavings: annualSavings
    });

    // Show results section with smooth scroll
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'grid';
    
    // Smooth scroll to the results section (just below the button)
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Update results in the UI
function updateResults(data) {
    // Competitor costs
    document.getElementById('compSaas').textContent = formatCurrency(data.competitorSaas);
    document.getElementById('compProcessing').textContent = formatCurrency(data.competitorProcessing);
    document.getElementById('compTotal').textContent = formatCurrency(data.competitorTotal);

    // DI costs
    document.getElementById('diSaas').textContent = formatCurrency(data.diSaas);
    document.getElementById('diProcessing').textContent = formatCurrency(data.diProcessing);
    document.getElementById('diTotal').textContent = formatCurrency(data.diTotal);

    // Savings
    document.getElementById('monthlySavings').textContent = formatCurrency(data.monthlySavings);
    document.getElementById('annualSavings').textContent = formatCurrency(data.annualSavings);

    // Add animation to savings values
    animateValue('monthlySavings', 0, data.monthlySavings, 1000);
    animateValue('annualSavings', 0, data.annualSavings, 1500);
}

// Animate number counting up
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = formatCurrency(current);
    }, 16);
}

// Add event listeners for real-time calculation on Enter key
document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill from URL parameters
    prefillFromURLParams();
    
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateROI();
            }
        });
    });

    // Add input validation
    const percentageInputs = ['creditCardPercentage', 'competitorRate'];
    percentageInputs.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('blur', () => {
            let value = parseFloat(input.value);
            if (value < 0) value = 0;
            if (value > 100) value = 100;
            input.value = value;
        });
    });

    // Ensure monetary inputs don't go negative
    const monetaryInputs = ['monthlyVolume', 'competitorSaas', 'diCost'];
    monetaryInputs.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('blur', () => {
            let value = parseFloat(input.value);
            if (value < 0) value = 0;
            input.value = value;
        });
    });
});

// Optional: Auto-calculate on input change (with debounce)
let calculateTimeout;
function debounceCalculate() {
    clearTimeout(calculateTimeout);
    calculateTimeout = setTimeout(() => {
        // Uncomment the line below if you want auto-calculation
        // calculateROI();
    }, 1000);
}

// Add input listeners for auto-calculation (optional)
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', debounceCalculate);
    });
});
