// Inisialisasi donationHistory
let donationHistory = [];
try {
    donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];
} catch (error) {
    console.error('Error parsing localStorage donationHistory:', error);
    donationHistory = [];
}

// Event listener untuk DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, rendering donation history...');
    renderDonationHistory();
    updateUsdValue();
});

// Fungsi untuk mengatur jumlah donasi
function setAmount(value) {
    console.log('Setting amount to:', value);
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.value = value;
        updateUsdValue();
    } else {
        console.error('Amount input not found');
    }
}

// Fungsi untuk memperbarui nilai USD
function updateUsdValue() {
    console.log('Updating USD value...');
    const amountInput = document.getElementById('amount');
    const usdValueSpan = document.querySelector('.usd-value');
    if (amountInput && usdValueSpan) {
        const amount = parseInt(amountInput.value) || 0;
        const usdValue = (amount * 0.0001).toFixed(2);
        usdValueSpan.textContent = `$${usdValue}`;
    } else {
        console.error('Amount input or usd-value span not found');
    }
}

// Event listener untuk input jumlah
const amountInput = document.getElementById('amount');
if (amountInput) {
    amountInput.addEventListener('input', () => {
        console.log('Amount input changed');
        updateUsdValue();
    });
}

// Fungsi untuk memproses donasi
async function makeDonation() {
    console.log('makeDonation called');
    const messageDiv = document.getElementById('donation-message');
    const invoiceDiv = document.getElementById('invoice');
    const amountInput = document.getElementById('amount');
    const messageInput = document.getElementById('message');

    if (!messageDiv || !invoiceDiv || !amountInput || !messageInput) {
        console.error('Required elements not found');
        if (messageDiv) {
            messageDiv.textContent = 'Kesalahan: Elemen formulir tidak ditemukan.';
            messageDiv.classList.add('error');
        }
        return;
    }

    messageDiv.textContent = '';
    messageDiv.classList.remove('error');
    invoiceDiv.innerHTML = '';

    const amount = parseInt(amountInput.value);
    const message = messageInput.value || 'Donasi untuk situs web';

    console.log('Amount:', amount, 'Message:', message);

    if (amount < 1 || amount > 50000) {
        console.log('Invalid amount');
        messageDiv.textContent = 'Jumlah harus antara 1 dan 50,000 satoshi.';
        messageDiv.classList.add('error');
        return;
    }

    try {
        let invoice;
        if (window.webln) {
            console.log('WebLN detected, attempting to create invoice...');
            await window.webln.enable();
            const lightningAddress = document.querySelector('meta[name="lightning"]').content;
            console.log('Lightning Address:', lightningAddress);

            invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: message
            });
            console.log('Invoice created:', invoice.paymentRequest);

            invoiceDiv.textContent = invoice.paymentRequest;

            // Tambahkan QR code
            const qrCanvas = document.createElement('canvas');
            invoiceDiv.appendChild(qrCanvas);
            QRCode.toCanvas(qrCanvas, invoice.paymentRequest, { width: 200 }, (error) => {
                if (error) console.error('QR Code error:', error);
            });

            console.log('Attempting to send payment via WebLN...');
            await window.webln.sendPayment(invoice.paymentRequest);
        } else {
            console.log('WebLN not available');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby atau gunakan QR code.';
            messageDiv.classList.add('error');

            // Fallback: Generate invoice manually (simulasi, karena Alby memerlukan modul)
            invoice = { paymentRequest: `lnbc${amount}...` }; // Ganti dengan logika nyata jika memungkinkan
            invoiceDiv.textContent = invoice.paymentRequest;

            // Tambahkan QR code
            const qrCanvas = document.createElement('canvas');
            invoiceDiv.appendChild(qrCanvas);
            QRCode.toCanvas(qrCanvas, invoice.paymentRequest, { width: 200 }, (error) => {
                if (error) console.error('QR Code error:', error);
            });

            // Berhenti di sini karena tidak ada pembayaran otomatis tanpa Alby
            return;
        }

        messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
        messageDiv.classList.remove('error');

        // Tambahkan efek confetti
        confetti();

        const donationTime = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'short',
            timeStyle: 'short'
        });
        const donation = {
            amount: amount,
            time: donationTime,
            message: message
        };
        console.log('Adding donation to history:', donation);
        donationHistory.push(donation);
        localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
        renderDonationHistory();
    } catch (error) {
        console.error('Error processing donation:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif.';
        messageDiv.classList.add('error');
    }
}

// Fungsi untuk merender riwayat donasi
function renderDonationHistory() {
    console.log('Rendering donation history:', donationHistory);
    const historyBody = document.getElementById('history-body');
    if (historyBody) {
        historyBody.innerHTML = '';
        donationHistory.forEach(donation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${donation.amount}</td>
                <td>${donation.time}</td>
                <td>${donation.message || 'Tidak ada pesan'}</td>
            `;
            historyBody.appendChild(row);
        });
    } else {
        console.error('History body not found');
    }
}
