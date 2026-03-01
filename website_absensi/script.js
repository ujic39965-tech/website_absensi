// ================= SPLASH SCREEN LOGIC =================
// Menghilangkan splash screen setelah 2 detik halaman dimuat
window.addEventListener('load', () => {
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        splashScreen.classList.add('hidden');
        
        // Hapus elemen dari memori setelah animasi selesai agar tidak menumpuk
        setTimeout(() => {
            splashScreen.remove();
        }, 800);
    }, 2000); // 2000 ms = 2 detik
});
// =======================================================


// Data Absensi dari LocalStorage
let dataAbsensi = JSON.parse(localStorage.getItem('dataAbsensiMagang')) || [];

// Fungsi Render Tabel
function renderTabel() {
    const tbody = document.getElementById('logData');
    tbody.innerHTML = '';
    
    if(dataAbsensi.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: #94a3b8; font-weight: 500;">Belum ada data absensi hari ini.</td></tr>`;
        return;
    }

    [...dataAbsensi].reverse().forEach(item => {
        const statusClass = item.status === 'Check In' ? 'status-in' : 'status-out';
        tbody.innerHTML += `
            <tr>
                <td>${item.tanggal}</td>
                <td><strong style="color: #1e293b;">${item.nama}</strong></td>
                <td>${item.divisi}</td>
                <td><i class="fa-regular fa-clock" style="color: #94a3b8; margin-right: 6px;"></i> ${item.waktu}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            </tr>`;
    });
}

// Fungsi Inti Pencatatan
function prosesAbsen(nama, divisi, status) {
    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    dataAbsensi.push({ id: Date.now(), tanggal, nama, divisi, waktu, status });
    localStorage.setItem('dataAbsensiMagang', JSON.stringify(dataAbsensi));
    
    // Reset form input manual setelah sukses
    document.getElementById('absensiForm').reset();
    
    renderTabel();
    
    Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `${nama} (${divisi}) berhasil ${status}`,
        timer: 2500,
        showConfirmButton: false,
        background: '#ffffff',
        borderRadius: '16px'
    });
}

// Handler Input Manual
document.getElementById('btnMasuk').addEventListener('click', () => {
    const n = document.getElementById('nama').value.trim();
    const d = document.getElementById('divisi').value;
    if(n && d) {
        prosesAbsen(n, d, 'Check In');
    } else {
        Swal.fire({
            icon: 'warning', 
            title: 'Oops...', 
            text: 'Nama dan Divisi harus diisi!',
            borderRadius: '16px'
        });
    }
});

document.getElementById('btnKeluar').addEventListener('click', () => {
    const n = document.getElementById('nama').value.trim();
    const d = document.getElementById('divisi').value;
    if(n && d) {
        prosesAbsen(n, d, 'Check Out');
    } else {
        Swal.fire({
            icon: 'warning', 
            title: 'Oops...', 
            text: 'Nama dan Divisi harus diisi!',
            borderRadius: '16px'
        });
    }
});

// ==========================================
// KONFIGURASI SCANNER QR CODE
// ==========================================
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", 
    { fps: 10, qrbox: {width: 250, height: 250} }, 
    false
);

let lastScanData = "";
let lastScanTime = 0;

function onScanSuccess(decodedText, decodedResult) {
    const currentTime = Date.now();
    if (decodedText === lastScanData && (currentTime - lastScanTime) < 3000) {
        return; 
    }

    lastScanData = decodedText;
    lastScanTime = currentTime;

    const dataSplit = decodedText.split(',');
    
    if (dataSplit.length >= 2) {
        const namaQR = dataSplit[0].trim();
        const divisiQR = dataSplit[1].trim();

        Swal.fire({
            title: `Halo, ${namaQR}!`,
            text: `Divisi: ${divisiQR}. Silakan pilih aksi:`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#004b87', 
            cancelButtonColor: '#dc2626',
            confirmButtonText: '<i class="fa-solid fa-right-to-bracket"></i> Check In',
            cancelButtonText: '<i class="fa-solid fa-right-from-bracket"></i> Check Out',
            borderRadius: '16px'
        }).then((result) => {
            if (result.isConfirmed) {
                prosesAbsen(namaQR, divisiQR, 'Check In');
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                prosesAbsen(namaQR, divisiQR, 'Check Out');
            }
        });
    } else {
        Swal.fire({
            icon: 'error', 
            title: 'Error', 
            text: 'Format QR Code salah. Gunakan format "Nama,Divisi"',
            borderRadius: '16px'
        });
    }
}

function onScanFailure(error) {
    // Abaikan error
}

html5QrcodeScanner.render(onScanSuccess, onScanFailure);

// Ekspor Excel
document.getElementById('btnExport').addEventListener('click', function() {
    if(dataAbsensi.length === 0) {
        Swal.fire({
            icon: 'info', 
            title: 'Kosong', 
            text: 'Belum ada data untuk diekspor',
            borderRadius: '16px'
        });
        return;
    }
    const tabel = document.getElementById('tabelAbsensi');
    const workbook = XLSX.utils.table_to_book(tabel, { sheet: "Rekap Magang" });
    XLSX.writeFile(workbook, `Rekap_Absensi_Magang_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

// Jalankan render awal saat web dibuka
renderTabel();