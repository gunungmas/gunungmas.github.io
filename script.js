let donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, rendering donation history...');
    renderDonationHistory();
    updateUsdValue();
});

function setAmount(value) {
    console.log('Setting amount to:', value);
    const amountInput = document.getElementById('amount');
    amountInput.value = value;
    updateUsdValue();
}

function updateUsdValue() {
    console.log('Updating USD value...');
    const amount = parseInt(document.getElementById('amount').value) || 0;
    const usdValue = (amount * 0.0001).toFixed(2);
    document.querySelector('.usd-value').textContent = `$${usdValue}`;
}

document.getElementById('amount').addEventListener('input', () => {
    console.log('Amount input changed');
    updateUsdValue();
});

// Fungsi untuk menampilkan kode QR
function showQRCode(paymentRequest) {
    console.log('Showing QR code for payment request:', paymentRequest);
    const qrContainer = document.getElementById('qr-code-container');
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';
    try {
        QRCode.toCanvas(qrCodeDiv, paymentRequest, { width: 200 }, (error) => {
            if (error) {
                console.error('Failed to generate QR code:', error);
                document.getElementById('donation-message').textContent = 'Gagal membuat kode QR.';
                document.getElementById('donation-message').classList.add('error');
            } else {
                qrContainer.style.display = 'block';
                document.getElementById('donation-message').textContent = 'Silakan pindai kode QR untuk menyelesaikan donasi.';
            }
        });
    } catch (error) {
        console.error('QRCode library error:', error);
        document.getElementById('donation-message').textContent = 'Pustaka QR Code tidak dimuat. Silakan coba lagi.';
        document.getElementById('donation-message').classList.add('error');
    }
}

async function makeDonation() {
    console.log('makeDonation called');
    const messageDiv = document.getElementById('donation-message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    const amount = parseInt(document.getElementById('amount').value);
    const message = document.getElementById('message').value || 'Donasi untuk situs web';

    console.log('Amount:', amount, 'Message:', message);

    if (amount < 1 || amount > 50000) {
        console.log('Invalid amount');
        messageDiv.textContent = 'Jumlah harus antara 1 dan 50,000 satoshi.';
        messageDiv.classList.add('error');
        return;
    }

    try {
        if (window.webln) {
            console.log('WebLN detected, attempting to create invoice...');
            await window.webln.enable();
            const lightningAddress = document.querySelector('meta[name="lightning"]').content;
            console.log('Lightning Address:', lightningAddress);

            const invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: message
            });
            console.log('Invoice created:', invoice.paymentRequest);

            console.log('Attempting to send payment via WebLN...');
            await window.webln.sendPayment(invoice.paymentRequest);

            messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
            messageDiv.classList.remove('error');

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
        } else {
            console.log('WebLN not available, showing QR code fallback...');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Menampilkan kode QR untuk donasi.';
            messageDiv.classList.add('error');

            // Invoice statis untuk pengujian (ganti dengan Alby API di produksi)
            const staticInvoice = 'lnbc1...'; // Ganti dengan invoice Lightning valid untuk pengujian
            showQRCode(staticInvoice);

            // Catatan: Riwayat tidak diperbarui untuk kode QR karena memerlukan verifikasi server-side
        }
    } catch (error) {
        console.error('Error processing donation:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif atau pindai kode QR.';
        messageDiv.classList.add('error');

        if (error.paymentRequest) {
            console.log('Error includes payment request, showing QR code...');
            showQRCode(error.paymentRequest);
        }
    }
}

function renderDonationHistory() {
    console.log('Rendering donation history:', donationHistory);
    const historyBody = document.getElementById('history-body');
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
}
