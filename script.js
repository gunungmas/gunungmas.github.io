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
    const amount = parseInt(document.getElementById('amount').value) || 0;
    const usdValue = (amount * 0.0001).toFixed(2);
    document.querySelector('.usd-value').textContent = `$${usdValue}`;
}

document.getElementById('amount').addEventListener('input', updateUsdValue);

// Fungsi untuk membuat invoice menggunakan Alby API
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
        return { paymentRequest: data.payment_request, paymentHash: data.payment_hash };
    } catch (error) {
        throw new Error('Gagal membuat invoice dari Alby API: ' + error.message);
    }
}

// Fungsi untuk memeriksa status invoice
async function checkInvoiceStatus(paymentHash, amount, message) {
    const albyApiUrl = `https://api.getalby.com/invoices/${paymentHash}`;
    const accessToken = 'YOUR_ALBY_ACCESS_TOKEN';

    try {
        const response = await fetch(albyApiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.settled) {
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
            donationHistory.push(donation);
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            renderDonationHistory();
            document.getElementById('donation-message').textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
            document.getElementById('donation-message').classList.remove('error');
            document.getElementById('qr-code-container').style.display = 'none';
            return true;
        }
        return false;
    } catch (error) {
        console.error('Gagal memeriksa status invoice:', error);
        return false;
    }
}

// Fungsi untuk menampilkan kode QR
function showQRCode(paymentRequest) {
    const qrContainer = document.getElementById('qr-code-container');
    const qrCodeDiv = document.getElementById('qrcode');
    qrCodeDiv.innerHTML = '';
    QRCode.toCanvas(qrCodeDiv, paymentRequest, { width: 200 }, (error) => {
        if (error) {
            document.getElementById('donation-message').textContent = 'Gagal membuat kode QR.';
            document.getElementById('donation-message').classList.add('error');
        } else {
            qrContainer.style.display = 'block';
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
                timeZone:artist: 'Asia/Jakarta',
                dateStyle: 'short',
                timeStyle: 'short'
            });
            const donation = {
                amount: amount,
                time: donationTime,
                message: message // Simpan pesan
            };
            donationHistory.push(donation);
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            renderDonationHistory();
        } else {
            console.log('WebLN tidak tersedia, mencoba membuat invoice via Alby API...');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Menampilkan kode QR untuk donasi.';
            messageDiv.classList.add('error');

            const { paymentRequest, paymentHash } = await fetchInvoiceFromServer(amount, message);
            showQRCode(paymentRequest);

            // Polling untuk memeriksa status pembayaran
            const maxPollTime = 5 * 60 * 1000; // 5 menit
            const pollInterval = setInterval(async () => {
                const isPaid = await checkInvoiceStatus(paymentHash, amount, message);
                if (isPaid) {
                    clearInterval(pollInterval);
                }
            }, 5000); // Periksa setiap 5 detik

            // Hentikan polling setelah 5 menit
            setTimeout(() => {
                clearInterval(pollInterval);
                if (messageDiv.textContent.includes('Silakan pindai kode QR')) {
                    messageDiv.textContent = 'Waktu untuk memindai kode QR telah habis. Silakan coba lagi.';
                    messageDiv.classList.add('error');
                    document.getElementById('qr-code-container').style.display = 'none';
                }
            }, maxPollTime);
        }
    } catch (error) {
        console.error('Error saat memproses donasi:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif atau pindai kode QR.';
        messageDiv.classList.add('error');

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
            <td>${donation.message || 'Tidak ada pesan'}</td>
        `;
        historyBody.appendChild(row);
    });
}
