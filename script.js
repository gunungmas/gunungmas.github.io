// Impor modul eksternal
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { requestProvider } from 'https://esm.sh/@getalby/bitcoin-connect@3.8.0';
import { LightningAddress } from 'https://esm.sh/@getalby/lightning-tools@5.1.2';

// Inisialisasi donationHistory
let donationHistory = [];
try {
    donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];
} catch (error) {
    console.error('Error parsing localStorage donationHistory:', error);
    donationHistory = [];
}

// Fungsi untuk memeriksa apakah elemen DOM tersedia
function checkElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID "${id}" not found`);
        return null;
    }
    return element;
}

// Event listener untuk DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, rendering donation history...');
    const historyBody = checkElement('history-body');
    if (historyBody) {
        renderDonationHistory();
    }
    updateUsdValue();
});

// Fungsi untuk mengatur jumlah donasi
window.setAmount = function(value) {
    console.log('Setting amount to:', value);
    const amountInput = checkElement('amount');
    if (amountInput) {
        amountInput.value = value;
        updateUsdValue();
    }
};

// Fungsi untuk memperbarui nilai USD
window.updateUsdValue = function() {
    console.log('Updating USD value...');
    const amountInput = checkElement('amount');
    const usdValueSpan = document.querySelector('.usd-value');
    if (!amountInput || !usdValueSpan) {
        console.error('Amount input or usd-value span not found');
        return;
    }
    const amount = parseInt(amountInput.value) || 0;
    const usdValue = (amount * 0.0001).toFixed(2);
    usdValueSpan.textContent = `$${usdValue}`;
};

// Event listener untuk input jumlah
const amountInput = checkElement('amount');
if (amountInput) {
    amountInput.addEventListener('input', () => {
        console.log('Amount input changed');
        updateUsdValue();
    });
}

// Fungsi untuk memproses donasi
window.makeDonation = async function() {
    console.log('makeDonation called');
    const messageDiv = checkElement('donation-message');
    const invoiceDiv = checkElement('invoice');
    if (!messageDiv || !invoiceDiv) {
        console.error('Donation message or invoice element not found');
        return;
    }

    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    const amountInput = checkElement('amount');
    const messageInput = checkElement('message');
    if (!amountInput || !messageInput) {
        messageDiv.textContent = 'Formulir tidak lengkap. Silakan coba lagi.';
        messageDiv.classList.add('error');
        return;
    }

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
        if (window.webln) {
            console.log('WebLN detected, attempting to create invoice...');
            try {
                await window.webln.enable();
                const lightningAddress = document.querySelector('meta[name="lightning"]')?.content;
                if (!lightningAddress) {
                    throw new Error('Lightning address not found in meta tag');
                }
                console.log('Lightning Address:', lightningAddress);

                const invoice = await window.webln.makeInvoice({
                    amount: amount,
                    defaultMemo: message
                });
                console.log('Invoice created:', invoice.paymentRequest);

                invoiceDiv.textContent = invoice.paymentRequest;

                console.log('Attempting to send payment via WebLN...');
                await window.webln.sendPayment(invoice.paymentRequest);

                messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
                messageDiv.classList.remove('error');

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
            } catch (weblnError) {
                console.error('WebLN error:', weblnError);
                throw new Error('Gagal menggunakan WebLN: ' + weblnError.message);
            }
        } else {
            console.log('WebLN not available, falling back to Alby...');
            messageDiv.textContent = 'Generating invoice via Alby...';
            try {
                const ln = new LightningAddress("evo@getalby.com");
                await ln.fetch();

                const invoice = await ln.requestInvoice({ satoshi: amount });
                invoiceDiv.textContent = invoice.paymentRequest;
                messageDiv.textContent = 'Waiting for payment via Alby...';

                const provider = await requestProvider();
                await provider.sendPayment(invoice.paymentRequest);

                messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
                messageDiv.classList.remove('error');

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
            } catch (albyError) {
                console.error('Alby error:', albyError);
                throw new Error('Gagal menggunakan Alby: ' + albyError.message);
            }
        }
    } catch (error) {
        console.error('Error processing donation:', error);
        messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif.';
        messageDiv.classList.add('error');
    }
};

// Fungsi untuk merender riwayat donasi
function renderDonationHistory() {
    console.log('Rendering donation history:', donationHistory);
    const historyBody = checkElement('history-body');
    if (!historyBody) {
        console.error('History body not found');
        return;
    }
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
