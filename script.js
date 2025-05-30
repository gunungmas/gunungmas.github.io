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
    console.log('makeDonation called at', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
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

    messageDiv.textContent = 'Memproses donasi...';

    try {
        if (!window.webln) {
            console.error('WebLN not available');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal dan aktifkan ekstensi Alby.';
            messageDiv.classList.add('error');
            return;
        }

        console.log('WebLN detected, enabling...');
        try {
            await window.webln.enable();
            console.log('WebLN enabled successfully');
        } catch (enableError) {
            console.error('Failed to enable WebLN:', enableError);
            messageDiv.textContent = 'Gagal mengaktifkan WebLN: ' + enableError.message + '. Pastikan Anda login ke Alby.';
            messageDiv.classList.add('error');
            return;
        }

        const lightningAddress = document.querySelector('meta[name="lightning"]').content;
        if (!lightningAddress) {
            console.error('Lightning address not found');
            messageDiv.textContent = 'Kesalahan: Alamat Lightning tidak ditemukan.';
            messageDiv.classList.add('error');
            return;
        }
        console.log('Lightning Address:', lightningAddress);

        console.log('Creating invoice for', amount, 'satoshi...');
        let invoice;
        try {
            invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: message
            });
            console.log('Invoice created:', invoice.paymentRequest);
        } catch (invoiceError) {
            console.error('Failed to create invoice:', invoiceError);
            messageDiv.textContent = 'Gagal membuat invoice: ' + invoiceError.message;
            messageDiv.classList.add('error');
            return;
        }

        // Tampilkan invoice
        invoiceDiv.textContent = invoice.paymentRequest;

        // Tambahkan QR code
        const qrCanvas = document.createElement('canvas');
        invoiceDiv.appendChild(qrCanvas);
        try {
            QRCode.toCanvas(qrCanvas, invoice.paymentRequest, { width: 200 }, (error) => {
                if (error) console.error('QR Code error:', error);
                else console.log('QR code generated successfully');
            });
        } catch (qrError) {
            console.error('Failed to generate QR code:', qrError);
            invoiceDiv.textContent += '\n(Gagal membuat QR code)';
        }

        messageDiv.textContent = 'Mengirim pembayaran...';
        console.log('Attempting to send payment via WebLN...');

        try {
            const paymentResult = await window.webln.sendPayment(invoice.paymentRequest);
            console.log('Payment sent successfully:', paymentResult);
        } catch (paymentError) {
            console.error('Failed to send payment:', paymentError);
            messageDiv.textContent = 'Gagal mengirim pembayaran: ' + paymentError.message + '. Saldo mungkin tidak cukup atau ada masalah jaringan.';
            messageDiv.classList.add('error');
            return;
        }

        messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
        messageDiv.classList.remove('error');

        // Tambahkan efek confetti baru
        try {
            var count = 888;
            var defaults = {
                origin: { y: 0.7 }
            };

            function fire(particleRatio, opts) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });

            console.log('Confetti effect triggered');
        } catch (confettiError) {
            console.error('Failed to trigger confetti:', confettiError);
        }

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
        try {
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            console.log('Donation history saved to localStorage');
        } catch (storageError) {
            console.error('Failed to save donation history:', storageError);
        }
        renderDonationHistory();

    } catch (error) {
        console.error('Unexpected error processing donation:', error);
        messageDiv.textContent = 'Kesalahan tak terduga: ' + error.message + '. Silakan coba lagi.';
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
