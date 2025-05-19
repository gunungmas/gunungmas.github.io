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

async function makeDonation() {
    const messageDiv = document.getElementById('donation-message');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeDiv = document.getElementById('qrcode');
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');
    qrCodeContainer.style.display = 'none';
    qrCodeDiv.innerHTML = '';

    const amount = parseInt(document.getElementById('amount').value);
    const message = document.getElementById('message').value || "Donasi untuk situs web";

    if (amount < 1 || amount > 50000) {
        messageDiv.textContent = "Jumlah harus antara 1 dan 50,000 satoshi.";
        messageDiv.classList.add('error');
        return;
    }

    try {
        if (typeof QRCode === 'undefined') {
            messageDiv.textContent = "Gagal memuat library QR Code. Pastikan kamu terhubung ke internet.";
            messageDiv.classList.add('error');
            return;
        }

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

            qrCodeContainer.style.display = 'block';
            new QRCode(qrCodeDiv, {
                text: invoice.paymentRequest,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            messageDiv.textContent = "Silakan scan kode QR untuk membayar.";

            try {
                console.log("Mencoba mengirim pembayaran via WebLN...");
                await window.webln.sendPayment(invoice.paymentRequest);
                messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
                qrCodeContainer.style.display = 'none';

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
            } catch (paymentError) {
                console.error("Gagal mengirim pembayaran via WebLN:", paymentError);
                messageDiv.textContent = "Gagal mengirim donasi via WebLN. Silakan scan kode QR untuk membayar.";
                messageDiv.classList.add('error');
            }
        } else {
            messageDiv.textContent = "Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby untuk melanjutkan.";
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error("Error saat memproses donasi:", error);
        messageDiv.textContent = "Terjadi kesalahan: " + error.message + ". Pastikan dompet Lightning aktif atau coba lagi.";
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
