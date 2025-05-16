// Load transactions from localStorage or initialize empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Chart.js instances
let transactionChart, growthChart, growthChart2;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderTransactions();
    updateSummary();
    initTransactionChart();
    initGrowthSimulation();
});

// Handle form submission
document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const asset = document.getElementById('asset').value.toUpperCase();
    const type = document.getElementById('type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const entry = parseFloat(document.getElementById('entry').value);
    const exit = parseFloat(document.getElementById('exit').value || 0);
    const notes = document.getElementById('notes').value;
    const errorMessage = document.getElementById('errorMessage');

    // Validation
    if (!asset || !['EURUSD', 'XAUUSD', 'BTC', 'ETH'].includes(asset)) {
        errorMessage.textContent = 'Simbol harus EURUSD, XAUUSD, BTC, atau ETH!';
        return;
    }
    if (amount <= 0 || entry <= 0) {
        errorMessage.textContent = 'Ukuran dan Harga Masuk harus lebih dari 0!';
        return;
    }

    errorMessage.textContent = '';

    // Calculate Profit/Loss
    let profitLoss = 0;
    if (exit > 0) {
        profitLoss = type === 'buy' ? (exit - entry) * amount : (entry - exit) * amount;
    }

    // Create transaction
    const transaction = {
        date: new Date().toLocaleDateString(),
        asset,
        type,
        amount,
        entry,
        exit: exit > 0 ? exit : '-',
        profitLoss: exit > 0 ? profitLoss.toFixed(2) : '-',
        notes
    };

    // Add to transactions
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Update UI
    renderTransactions();
    updateSummary();
    updateTransactionChart();
    document.getElementById('transactionForm').reset();
});

// Render transactions to table
function renderTransactions() {
    const tbody = document.getElementById('transactionBody');
    tbody.innerHTML = '';

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.asset}</td>
            <td>${transaction.type}</td>
            <td>${transaction.amount}</td>
            <td>${transaction.entry}</td>
            <td>${transaction.exit}</td>
            <td>${transaction.profitLoss}</td>
            <td>${transaction.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update summary table
function updateSummary() {
    const totalTrades = transactions.length;
    const totalPL = transactions.reduce((sum, t) => sum + (parseFloat(t.profitLoss) || 0), 0);
    const avgPL = totalTrades > 0 ? (totalPL / totalTrades).toFixed(2) : 0;
    const btcTrades = transactions.filter(t => t.asset === 'BTC').length;
    const ethTrades = transactions.filter(t => t.asset === 'ETH').length;
    const forexTrades = transactions.filter(t => t.asset === 'EURUSD').length;
    const xauTrades = transactions.filter(t => t.asset === 'XAUUSD').length;

    document.getElementById('totalTrades').textContent = totalTrades;
    document.getElementById('totalPL').textContent = totalPL.toFixed(2);
    document.getElementById('avgPL').textContent = avgPL;
    document.getElementById('btcTrades').textContent = btcTrades;
    document.getElementById('ethTrades').textContent = ethTrades;
    document.getElementById('forexTrades').textContent = forexTrades;
    document.getElementById('xauTrades').textContent = xauTrades;
}

// Initialize transaction chart
function initTransactionChart() {
    const ctx = document.getElementById('transactionChart').getContext('2d');
    transactionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit/Loss',
                data: [],
                borderColor: '#3498db',
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Tanggal' } },
                y: { title: { display: true, text: 'Profit/Loss' } }
            }
        }
    });
}

function updateTransactionChart() {
    const labels = transactions.map(t => t.date);
    const data = transactions.map(t => parseFloat(t.profitLoss) || 0);
    transactionChart.data.labels = labels;
    transactionChart.data.datasets[0].data = data;
    transactionChart.update();
}

// Initialize growth simulation
function initGrowthSimulation() {
    const tbody = document.getElementById('growthTable').getElementsByTagName('tbody')[0];
    let initialCapital = 0.50;
    let capital = initialCapital;
    const trades = 30;
    const growthData = [];
    const growthData2 = [];

    for (let i = 1; i <= trades; i++) {
        const profit = capital;
        const finalCapital = capital + profit;
        const volume = (capital / 100).toFixed(2);
        const targetPoints = (profit / volume).toFixed(2);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i}</td>
            <td>${volume}</td>
            <td>${targetPoints}</td>
            <td>$${capital.toFixed(2)}</td>
            <td>$${profit.toFixed(2)}</td>
            <td>$${finalCapital.toFixed(2)}</td>
        `;
        tbody.appendChild(row);

        growthData.push(finalCapital);
        growthData2.push(Math.log(finalCapital));
        capital = finalCapital;
    }

    // Growth Chart 1 (Linear)
    const ctx1 = document.getElementById('growthChart').getContext('2d');
    growthChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: Array.from({ length: trades }, (_, i) => i + 1),
            datasets: [{
                label: 'Modal Akhir ($)',
                data: growthData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Transaksi' } },
                y: { title: { display: true, text: 'Modal Akhir ($)' } }
            }
        }
    });

    // Growth Chart 2 (Logarithmic)
    const ctx2 = document.getElementById('growthChart2').getContext('2d');
    growthChart2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Array.from({ length: trades }, (_, i) => i + 1),
            datasets: [{
                label: 'Log Modal Akhir',
                data: growthData2,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Transaksi' } },
                y: { title: { display: true, text: 'Log Modal Akhir' } }
            }
        }
    });
}

// Reset all transactions
document.getElementById('resetButton').addEventListener('click', () => {
    transactions = [];
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
    updateSummary();
    updateTransactionChart();
});
