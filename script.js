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
            console.log('WebLN not available');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby untuk melanjutkan.';
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error('Error processing donation:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif.';
        messageDiv.classList.add('error');
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
