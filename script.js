async function makeDonation() {
    console.log('makeDonation called');
    const messageDiv = document.getElementById('donation-message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    const amount = parseInt(document.getElementById('amount').value);
    const message = document.getElementById('message').value || 'Donasi untuk situs web';

    console.log('Amount:', amount, 'Message:', message);

    // Validate amount
    if (amount < 1 || amount > 50000) {
        console.log('Invalid amount');
        messageDiv.textContent = 'Jumlah harus antara 1 dan 50,000 satoshi.';
        messageDiv.classList.add('error');
        return;
    }

    try {
        if (!window.webln) {
            console.log('WebLN not available');
            messageDiv.textContent = 'Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby untuk melanjutkan.';
            messageDiv.classList.add('error');
            return;
        }

        console.log('WebLN detected, attempting to enable...');
        await window.webln.enable();

        const isEnabled = window.webln && window.webln.enabled;
        if (!isEnabled) {
            console.log('WebLN not enabled');
            messageDiv.textContent = 'Dompet Lightning belum siap. Silakan aktifkan dompet Anda (misalnya Alby) dan pastikan sudah terhubung ke jaringan Lightning.';
            messageDiv.classList.add('error');
            return;
        }

        const lightningAddress = document.querySelector('meta[name="lightning"]').content;
        console.log('Lightning Address:', lightningAddress);

        console.log('Attempting to create invoice...');
        const invoice = await window.webln.makeInvoice({
            amount: amount,
            defaultMemo: message
        });
        console.log('Invoice created:', invoice.paymentRequest);

        console.log('Attempting to send payment via WebLN...');
        await window.webln.sendPayment(invoice.paymentRequest);

        // If payment succeeds, add to history
        messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;
        messageDiv.classList.remove('error');

        // Add donation to history
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

        // Ensure donationHistory is an array
        if (!Array.isArray(donationHistory)) {
            console.log('donationHistory is not an array, resetting...');
            donationHistory = [];
        }

        donationHistory.push(donation);
        console.log('Updated donationHistory:', donationHistory);

        // Save to localStorage
        try {
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
            console.log('Donation history saved to localStorage');
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            messageDiv.textContent = 'Donasi berhasil, tetapi gagal menyimpan riwayat: ' + e.message;
            messageDiv.classList.add('error');
            return;
        }

        // Render the updated history
        renderDonationHistory();

    } catch (error) {
        console.error('Error processing donation:', error);
        if (error.message.includes('400') && error.message.includes('Limit exceeded')) {
            messageDiv.textContent = 'Gagal: Batas transaksi terlampaui. Silakan konfigurasi dompet Lightning Anda (misalnya, tambah saldo atau buka channel baru di Alby).';
        } else if (error.message.includes('network')) {
            messageDiv.textContent = 'Gagal: Masalah jaringan Lightning. Pastikan dompet Anda terhubung dengan baik ke jaringan.';
        } else {
            messageDiv.textContent = 'Gagal memproses donasi: ' + error.message + '. Pastikan dompet Lightning aktif.';
        }
        messageDiv.classList.add('error');

        // For debugging: Simulate adding to history even if payment fails
        // Remove this in production
        const donationTime = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'short',
            timeStyle: 'short'
        });
        const donation = {
            amount: amount,
            time: donationTime,
            message: message + ' (Simulated due to payment failure)'
        };
        console.log('Simulating adding donation to history:', donation);
        donationHistory.push(donation);
        localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
        renderDonationHistory();
    }
}
