let donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];
let coffeeAmount = 1; // Default jumlah kopi
const coffeePrice = 3; // Harga per kopi dalam USD

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing...'); // Debugging
    renderDonationHistory();
    updateUsdValue();

    // Debugging untuk memastikan tombol donasi ada
    const donateButton = document.querySelector('.donate-button');
    if (donateButton) {
        console.log('Donate button found:', donateButton);
    } else {
        console.error('Donate button not found!');
    }
});

// Fungsi untuk menampilkan section support setelah klik Find Profile
function showSupportSection() {
    const zapInitial = document.getElementById('zap-initial');
    const supportSection = document.getElementById('support-section');
    const npubInput = document.getElementById('npub').value.trim();

    if (npubInput === '') {
        alert('Please enter a valid npub or email address.');
        return;
    }

    zapInitial.style.display = 'none';
    supportSection.style.display = 'block';
    updateSupportButton();
}

// Fungsi untuk mengatur jumlah kopi
function setCoffeeAmount(amount) {
    coffeeAmount = amount;
    document.getElementById('coffee-amount').value = amount;

    // Update tombol aktif
    const buttons = document.querySelectorAll('.coffee-button');
    buttons.forEach(button => {
        button.classList.remove('active');
        if (parseInt(button.textContent) === amount) {
            button.classList.add('active');
        }
    });

    updateSupportButton();
}

// Fungsi untuk memperbarui teks tombol Support
function updateSupportButton() {
    const totalPrice = coffeeAmount * coffeePrice;
    const supportButton = document.querySelector('.support-button');
    supportButton.textContent = `Support with $${totalPrice}`;
}

// Fungsi untuk menangani klik tombol Support
async function submitSupport() {
    const message = document.getElementById('support-message').value || "Support via coffee";
    const totalPrice = coffeeAmount * coffeePrice;

    alert(`Thank you for supporting with ${coffeeAmount} coffee(s) worth $${totalPrice}! Message: ${message}`);
}

// Fungsi untuk donasi satoshi
function setAmount(value) {
    console.log('setAmount called with value:', value); // Debugging
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.value = value;
        updateUsdValue();
    } else {
        console.error('Amount input not found!');
    }
}

function updateUsdValue() {
    console.log('updateUsdValue called'); // Debugging
    const amountInput = document.getElementById('amount');
    if (!amountInput) {
        console.error('Amount input not found for updateUsdValue!');
        return;
    }
    const amount = parseInt(amountInput.value);
    const usdValue = (amount * 0.0001).toFixed(2);
    const usdElement = document.querySelector('.usd-value');
    if (usdElement) {
        usdElement.textContent = `$${usdValue}`;
    } else {
        console.error('USD value element not found!');
    }
}

document.getElementById('amount')?.addEventListener('input', updateUsdValue);

async function makeDonation() {
    console.log('makeDonation called'); // Debugging

    const messageDiv = document.getElementById('donation-message');
    if (!messageDiv) {
        console.error('Donation message element not found!');
        return;
    }
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    const amountInput = document.getElementById('amount');
    if (!amountInput) {
        console.error('Amount input not found!');
        messageDiv.textContent = "Error: Amount input not found.";
        messageDiv.classList.add('error');
        return;
    }
    const amount = parseInt(amountInput.value);

    const messageInput = document.getElementById('message');
    if (!messageInput) {
        console.error('Message input not found!');
        messageDiv.textContent = "Error: Message input not found.";
        messageDiv.classList.add('error');
        return;
    }
    const message = messageInput.value || "Donasi untuk situs web";

    if (amount < 1 || amount > 50000 || isNaN(amount)) {
        messageDiv.textContent = "Jumlah harus antara 1 dan 50,000 satoshi.";
        messageDiv.classList.add('error');
        return;
    }

    try {
        if (window.webln) {
            console.log("WebLN detected, attempting to create invoice...");
            await window.webln.enable();
            const lightningAddress = document.querySelector('meta[name="lightning"]').content;
            console.log("Lightning Address:", lightningAddress);

            const invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: message
            });
            console.log("Invoice created successfully:", invoice.paymentRequest);

            console.log("Attempting to send payment via WebLN...");
            await window.webln.sendPayment(invoice.paymentRequest);

            messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;

            const donationTime = new Date().toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta', 
                dateStyle: 'short', 
                timeStyle: 'short' 
            });
            const donation = {
                amount: amount,
                time: donationTime
            };
            donationHistory.push(donation);
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            renderDonationHistory();
        } else {
            console.warn("WebLN not detected.");
            messageDiv.textContent = "Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby untuk melanjutkan.";
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error("Error during donation:", error);
        messageDiv.textContent = "Gagal memproses donasi: " + error.message + ". Pastikan dompet Lightning aktif atau coba lagi.";
        messageDiv.classList.add('error');
    }
}

function renderDonationHistory() {
    console.log('renderDonationHistory called'); // Debugging
    const historyBody = document.getElementById('history-body');
    if (!historyBody) {
        console.error('History body element not found!');
        return;
    }
    historyBody.innerHTML = '';

    donationHistory.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donation.amount}</td>
            <td>${donation.time}</td>
        `;
        historyBody.appendChild(row);
    });
}
