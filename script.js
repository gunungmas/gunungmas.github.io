let donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderDonationHistory();
    updateUsdValue();
});

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

// Fungsi placeholder untuk mengambil invoice dari server
async function fetchInvoiceFromServer(amount, memo) {
    const albyApiUrl = 'https://api.getalby.com/invoices';
    const accessToken = 'YOUR_ALBY_ACCESS_TOKEN'; // Ganti dengan access token dari Alby Developer Portal
    const lightningAddress = 'evo@getalby.com';

    try {
        const response = await fetch(albyApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                description: memo,
                lightning_address: lightningAddress
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.payment_request; // Kembalikan string bolt11
    } catch (error) {
        throw new Error('Gagal membuat invoice dari Alby API: ' + error.message);
    }
}

// Fungsi untuk menampilkan kode QR
function showQRCode(paymentRequest) {
    const qrContainer = document.getElementById('qr-code-container');
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = ''; // Bersihkan kode QR sebelumnya
    QRCode.toCanvas(qrCodeDiv, paymentRequest, { width: 200 }, (error) => {
        if (error) {
            document.getElementById('donation-message').textContent = 'Gagal membuat kode QR.';
            document.getElementById('donation-message').classList.add('error');
        } else {
            qrContainer.style.display = 'block'; // Tampilkan kontainer kode QR
            document.getElementById('donation-message').textContent = 'Silakan pindai kode QR untuk menyelesaikan donasi.';
        }
    });
}

async function makeDonation() {
    const messageDiv = document.getElementById('donation-message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    const amount = parseInt(document.getElementById('amount').value);
    const message = document.getElementById('message').value || 'Donasi untuk situs web';

    if (amount < 1 || amount > 50000) {
        messageDiv.textContent = 'Jumlah harus antara 1 dan 50,000 satoshi.';
        messageDiv.classList.add('error');
        return;
    }

    try {
        if (window.webln) {
            console.log('WebLN terdeteksi, mencoba membuat invoice...');
            await window.webln.enable();
            const lightningAddress = document.querySelector('meta[name="lightning"]').content;
            console.log('Lightning Address:', lightningAddress);

            const invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: message
            });
            console.log('Invoice berhasil dibuat:', invoice.paymentRequest);

            console.log('Mencoba mengirim pembayaran via WebLN...');
            await window.webln.sendPayment(invoice.paymentRequest);

            messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;

            const donationTime = new Date().toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                dateStyle: 'short',
                timeStyle: 'short'
            });
            const donation = {
                amount: amount,
                time: donationTime,
                message: message // Simpan pesan di riwayat
            };
            donationHistory.push(donation);
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            renderDonationHistory();
        } else {
            // Fallback ke kode QR
            console.log('WebLN tidak tersedia, mencoba membuat invoice via server...');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Menampilkan kode QR untuk donasi.';
            messageDiv.classList.add('error');

            const paymentRequest = await fetchInvoiceFromServer(amount, message);
            showQRCode(paymentRequest);

            // Catatan: Riwayat donasi tidak diperbarui di sini karena pembayaran perlu diverifikasi server-side
        }
    } catch (error) {
        console.error('Error saat memproses donasi:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif atau pindai kode QR.';
        messageDiv.classList.add('error');

        // Jika error menyertakan paymentRequest, tampilkan kode QR
        if (error.paymentRequest) {
            showQRCode(error.paymentRequest);
        }
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
            <td>${donation.message}</td>
        `;
        historyBody.appendChild(row);
    });
}
