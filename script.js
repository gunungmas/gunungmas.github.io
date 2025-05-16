// Fungsi untuk donasi
async function makeDonation() {
    const messageDiv = document.getElementById('donation-message');
    messageDiv.textContent = ''; // Bersihkan pesan sebelumnya
    messageDiv.classList.remove('error'); // Hapus kelas error jika ada

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
        } else {
            // Tampilkan pesan error jika ekstensi tidak ada
            messageDiv.textContent = "Ekstensi Lightning (seperti Alby) tidak terdeteksi. Silakan instal ekstensi Alby atau dompet Lightning lainnya.";
            messageDiv.classList.add('error');
        }
    } catch (error) {
        console.error("Error saat memproses donasi:", error);
        // Tampilkan pesan error di halaman
        messageDiv.textContent = "Gagal memproses donasi. Pastikan dompet Lightning Anda aktif.";
        messageDiv.classList.add('error');
    }
}
