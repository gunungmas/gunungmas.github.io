let donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];
let coffeeAmount = 1; // Default jumlah kopi
const coffeePrice = 3; // Harga per kopi dalam USD

document.addEventListener('DOMContentLoaded', () => {
    renderDonationHistory();
    updateUsdValue();
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

    // Untuk saat ini, kita hanya menampilkan alert sebagai simulasi
    alert(`Thank you for supporting with ${coffeeAmount} coffee(s) worth $${totalPrice}! Message: ${message}`);
    // Jika Anda ingin mengintegrasikan dengan WebLN untuk pembayaran, Anda bisa menambahkan logika serupa seperti makeDonation() di sini
}

// Fungsi untuk donasi satoshi (tidak berubah)
function setAmount(value) {
    const amountInput = document.getElementById('amount');
    amountInput.value = value;
    updateUsdValue();
}

function updateUsdValue() {
    const amount = parseInt(document.getElementById('amount').value);
    const usdValue = (amount * 0.0001).toFixed(2);
    document.querySelector('.usd-value').textContent = `$${usdValue}`;
}

document.getElementById('amount').addEventListener('input', updateUsdValue);

async function makeDonation() {
    const messageDiv = document.getElementById('donation-message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    const amount = parseInt(document.getElementById('amount').value);
    const message = document.getElementById('message').value || "Donasi untuk situs web";

    if (amount < 1 || amount > 50000) {
        messageDiv.textContent = "Jumlah harus antara 1 dan 50,000 satoshi.";
        messageDiv.classList.add('error');
        return;
    }

    try {
        if (window.webln) {
            console.log("WebLN terdeteksi, mencoba membuat invoice...");
            await window.webln.enable();
            const lightningAddress = document.querySelector('meta[name="lightning"]').content;
            console.log("Lightning Address:", lightningAddress);

            const invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: message
            });
            console.log("Invoice berhasil dibuat:", invoice.paymentRequest);

            console.log("Mencoba mengirim pembayaran via WebLN...");
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
            messageDiv.textContent = "Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby untuk melanjutkan.";
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error("Error saat memproses donasi:", error);
        messageDiv.textContent = "Gagal memproses donasi: " + error.message + ". Pastikan dompet Lightning aktif atau coba lagi.";
        messageDiv.classList.add('error');
    }
}

function renderDonationHistory() {
    const historyBody = document.getElementById('history-body');
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
