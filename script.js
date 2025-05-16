// Load donation history from localStorage or initialize empty array
let donationHistory = JSON.parse(localStorage.getItem('donationHistory')) || [];

// Render donation history on page load
document.addEventListener('DOMContentLoaded', () => {
    renderDonationHistory();
});

// Fungsi untuk donasi
async function makeDonation() {
    const messageDiv = document.getElementById('donation-message');
    messageDiv.textContent = '';
    messageDiv.classList.remove('error');

    try {
        if (window.webln) {
            await window.webln.enable();
            const lightningAddress = document.querySelector('meta[name="lightning"]').content;
            const amount = parseInt(document.getElementById('amount').value);
            const invoice = await window.webln.makeInvoice({
                amount: amount,
                defaultMemo: "Donasi untuk situs web"
            });
            await window.webln.sendPayment(invoice.paymentRequest);

            // Tampilkan pesan konfirmasi di halaman
            messageDiv.textContent = `Terima kasih atas donasi sebesar ${amount} satoshi!`;

            // Simpan donasi ke riwayat
            const donationTime = new Date().toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta', 
                dateStyle: 'short', 
                timeStyle: 'short' 
            }); // Format: "17/05/25, 02:53"
            const donation = {
                amount: amount,
                time: donationTime
            };
            donationHistory.push(donation);
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));

            // Perbarui tabel riwayat
            renderDonationHistory();
        } else {
            messageDiv.textContent = "Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby atau dompet Lightning lainnya.";
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error("Error saat memproses donasi:", error);
        messageDiv.textContent = "Gagal memproses donasi. Pastikan dompet Lightning Anda aktif.";
        messageDiv.classList.add('error');
    }
}

// Fungsi untuk menampilkan riwayat donasi di tabel
function renderDonationHistory() {
    const historyBody = document.getElementById('history-body');
    historyBody.innerHTML = ''; // Bersihkan tabel sebelumnya

    donationHistory.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${donation.amount}</td>
            <td>${donation.time}</td>
        `;
        historyBody.appendChild(row);
    });
}
