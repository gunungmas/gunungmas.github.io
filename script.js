a
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
    // Ganti ini dengan panggilan API ke server atau layanan seperti Alby
    // Contoh: panggil API Alby untuk membuat invoice berdasarkan lightning address
    try {
        const response = await fetch('https://api.getalby.com/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_ALBY_API_KEY' // Ganti dengan API key Anda
            },
            body: JSON.stringify({
                amount: amount,
                description: memo,
                lightning_address: 'evo@getalby.com'
            })
        });
        const data = await response.json();
        return data.payment_request; // Kembalikan string bolt11
    } catch (error) {
        throw new Error('Gagal membuat invoice dari server: ' + error.message);
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
                time: donationTime
            };
            donationHistory.push(donation);
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            renderDonationHistory();
        } else {
            // Fallback ke kode QR
            console.log('WebLN tidak tersedia, mencoba membuat invoice via server...');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Menampilkan kode QR untuk donasi.';
            messageDiv.classList.add('error');

            // Buat invoice melalui server
            const paymentRequest = await fetchInvoiceFromServer(amount, message);
            showQRCode(paymentRequest);

            // Catatan: Riwayat donasi tidak diperbarui di sini karena pembayaran perlu diverifikasi server-side
        }
    } catch (error) {
        console.error('Error saat memproses donasi:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif atau pindai kode QR.';
        messageDiv.classList.add('error');

        // Jika error menyertakan paymentRequest (misalnya, invoice dibuat tapi pembayaran gagal), tampilkan kode QR
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
        `;
        historyBody.appendChild(row);
    });
}
