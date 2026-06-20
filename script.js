// ==================== KONFIGURASI ====================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxOtN8WAmDCovDX3CyCDTOpBgBek6FwvlYgv2IGtwHw0nmqOeWdPYPNEouZ-khdlMVk/exec";
const PROXY_URL = "https://corsproxy.io/?"; 

// Gabungkan menjadi satu API_URL
const API_URL = PROXY_URL + encodeURIComponent(SCRIPT_URL);
const ADMIN_PASSWORD = "admin123";

let dbGejala = [], dbJurusan = [], dbRule = [], dbFakultas = [];
let currentStep = 0;
let skorJurusan = {};
// =====================================================
// ==================== PASSWORD TOGGLE ====================
function togglePassword() {
    const input = document.getElementById('adminPassword');
    const icon = event.target;
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '🙈';
    } else {
        input.type = 'password';
        icon.innerHTML = '👁️';
    }
}
// ==================== ADMIN  ====================
function openAdminModal() {
    if (document.getElementById('adminPanel').style.display === 'block') {
        return; 
    }
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').type = 'password';
    document.getElementById('adminErrorMsg').style.display = 'none';
    setTimeout(() => document.getElementById('adminPassword').focus(), 100);
}
function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
}
function checkAdminPassword() {
    let password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        closeAdminModal();
        showAdminPanel();
    } else {
        document.getElementById('adminErrorMsg').style.display = 'block';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
        setTimeout(() => document.getElementById('adminErrorMsg').style.display = 'none', 2000);
    }
}
// ==================== SHOW/HIDE ADMIN PANEL ====================
function showAdminPanel() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('mainFooter').style.display = 'none';
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    document.getElementById('nav-admin').classList.add('active-link');
    loadAdminData();
}
function hideAdminPanel() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('mainFooter').style.display = 'block';
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    document.getElementById('nav-home').classList.add('active-link');
    scrollToSection('home');
}
function showMainContent() {
    if (document.getElementById('adminPanel').style.display === 'block') return;
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('mainFooter').style.display = 'block';
}
// ==================== SMOOTH SCROLL ====================
function scrollToSection(section) {
    let element;
    if (section === 'home') {
        element = document.getElementById('home-section');
        if (element) {
            element.classList.remove('slide-down-animation');
            void element.offsetWidth; // Trik reflow untuk me-reset animasi
            element.classList.add('slide-down-animation');
        }
    }
    else if (section === 'consult') element = document.getElementById('consult-section');
    else if (section === 'program-studi') element = document.getElementById('program-studi-section');
    else if (section === 'about') element = document.getElementById('about-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    if (section === 'home') document.getElementById('nav-home').classList.add('active-link');
    if (section === 'consult') document.getElementById('nav-consult').classList.add('active-link');
    if (section === 'program-studi') document.getElementById('nav-program-studi').classList.add('active-link');
    if (section === 'about') document.getElementById('nav-about').classList.add('active-link');
    // Otomatis menutup kembali tirai menu drop-down setelah user memilih salah satu menu di HP
    const navLinks = document.getElementById('navLinksContainer');
    if (navLinks) navLinks.classList.remove('mobile-active');
}
// ====================  DATABASE ====================
async function loadKnowledgeBase() {
    try {
        const timestamp = Date.now();
        const url = API_URL + encodeURIComponent("?action=getKnowledgeBase&_=" + timestamp);
        let res = await fetch(url);
        let data = await res.json();
        
        dbGejala = data.gejala || [];
        dbJurusan = data.jurusan || [];
        dbRule = data.rule || [];
        dbFakultas = data.fakultas || [];
        
        document.getElementById('loading-kb').style.display = 'none';
        document.getElementById('quiz-area-box').style.display = 'block';
        
        renderDaftarJurusanUtama(); 
        
        if (dbGejala.length > 0) { 
            resetQuiz(); 
        } else { 
            document.getElementById('dynamic-question-container').innerHTML = '<p style="color:red;text-align:center;">⚠️ Belum ada data. Tambah di Admin Panel.</p>'; 
        }
    } catch(err) { 
        console.error("Gagal memuat basis pengetahuan:", err); 
        document.getElementById('loading-kb').innerHTML = '<p style="color:red;text-align:center;">❌ Gagal koneksi ke cloud database.</p>'; 
    }
}
function renderCurrentQuestion() {
    if (dbGejala.length === 0 || currentStep >= dbGejala.length) return;
    let item = dbGejala[currentStep];
    document.getElementById('progress-indicator').innerText = `Pertanyaan ${currentStep+1} dari ${dbGejala.length}`;
    document.getElementById('bar-fill').style.width = `${((currentStep+1)/dbGejala.length)*100}%`;
    let container = document.getElementById('dynamic-question-container');
    container.innerHTML = `<div class="question-card active"><h3>${currentStep+1}. ${escapeHtml(item.indikator)}</h3><div class="options-vertical"><button class="choice-btn" onclick="answerQuestion('${escapeHtml(item.kd_gejala)}', 3)"><span>✅ Ya</span><span>➔</span></button><button class="choice-btn" onclick="answerQuestion('${escapeHtml(item.kd_gejala)}', 0)"><span>❌ Tidak</span><span>➔</span></button></div></div>`;
}
function answerQuestion(kdGejala, isSelected) {
    if (isSelected) {
        // Cari semua aturan yang berkaitan dengan gejala ini
        let matchedRules = dbRule.filter(r => r.kd_gejala === kdGejala);
        
        matchedRules.forEach(rule => {
            // Pastikan rule.kd_fakultas tersedia dan tambahkan skor ke objek skorFakultas
            if (rule.kd_fakultas) {
                skorFakultas[rule.kd_fakultas] = (skorFakultas[rule.kd_fakultas] || 0) + 1;
            }
        });
    }
    
    currentStep++;
    if (currentStep < dbGejala.length) {
        renderCurrentQuestion();
    } else {
        showResults();
    }
}
function showResults() {
    // 1. Validasi
    const totalSkor = Object.values(skorFakultas).reduce((a, b) => a + b, 0);
    if (totalSkor === 0) {
        alert("⚠️ Mohon pilih gejala terlebih dahulu.");
        resetQuiz(); return;
    }

    document.getElementById('quiz-area-box').style.display = 'none';
    document.getElementById('loading-view').style.display = 'block';

    setTimeout(() => {
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('result-box').style.display = 'block';

        // 2. Map skorFakultas ke array agar bisa diurutkan
        let rankingFakultas = Object.keys(skorFakultas).map(kd => ({
            kd_fakultas: kd,
            skor: skorFakultas[kd]
        })).sort((a, b) => b.skor - a.skor); // Urutkan dari skor tertinggi

        // 3. Ambil 3 Teratas
        let top3 = rankingFakultas.slice(0, 3);

        let container = document.getElementById('result-list-container');
        container.innerHTML = '';

        top3.forEach((item, idx) => {
            let fak = dbFakultas.find(f => String(f.kd_fakultas).trim() === String(item.kd_fakultas).trim());
            let namaFak = fak ? fak.nama_fakultas : "Fakultas Tidak Ditemukan";

            container.innerHTML += `
                <div class="result-item">
                    <div class="rank-number">#${idx + 1}</div>
                    <div class="res-title">🎓 ${namaFak}</div>
                    <p>Skor Kecocokan: ${item.skor}</p>
                </div>`;
        });
    }, 1200);
}
function resetQuiz() {
    currentStep = 0;
    skorFakultas = {};
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('quiz-area-box').style.display = 'block';
    renderCurrentQuestion();
}
function restartQuizWithScroll() {
    resetQuiz();
    const consultSection = document.getElementById('consult-section');
    if (consultSection) { consultSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}
function updateActiveLinkOnScroll() {
    if (document.getElementById('adminPanel').style.display === 'block') return;
    const sections = [
        { id: 'home-section', navId: 'nav-home' },
        { id: 'consult-section', navId: 'nav-consult' },
        { id: 'program-studi-section', navId: 'nav-program-studi' },
        { id: 'about-section', navId: 'nav-about' }
    ];
    let current = '';
    const pos = window.scrollY + 150;
    for (let s of sections) {
        const el = document.getElementById(s.id);
        if (el && pos >= el.offsetTop && pos < el.offsetTop + el.offsetHeight) { current = s.id; break; }
    }
    sections.forEach(s => {
        const link = document.getElementById(s.navId);
        if (link) current === s.id ? link.classList.add('active-link') : link.classList.remove('active-link');
    });
}
async function loadAdminData() {
    try {
        console.log("Mencoba memuat data admin...");
        const res = await fetch(API_URL); 
        if (!res.ok) throw new Error("Gagal mengambil data, status: " + res.status);
        const data = await res.json();
        dbGejala = data.gejala || [];
        dbJurusan = data.jurusan || [];
        dbRule = data.rule || [];
        dbFakultas = data.fakultas || [];
        console.log("Data Admin berhasil dimuat:", data);
        renderAdminTables(); 
        populateAdminSelects();
    } catch (err) {
        console.error("Gagal load data:", err);
        alert("Gagal memuat data admin. Cek Console (F12) untuk detail.");
    }
}
function renderAdminTables() {
    const tg = document.getElementById('table-gejala');
    const tj = document.getElementById('table-jurusan');
    const tr = document.getElementById('table-rule'); 
    if (tg) {
        tg.innerHTML = dbGejala.map(g => `
            <tr>
                <td style="font-weight: bold;">${g.kd_gejala}</td>
                <td>${g.indikator}</td>
                <td style="text-align: center;">
                    <button class="btn-hapus" onclick="deleteAdminItem('gejala','${g.kd_gejala}')">🗑 Hapus</button>
                </td>
            </tr>
        `).join('');
    }
    if (tj) {
        tj.innerHTML = dbJurusan.map(j => `
            <tr>
                <td>${j.kd_jurusan}</td>
                <td>${j.nama_jurusan}</td>
                <td>${j.deskripsi || '-'}</td>
                <td style="text-align: center;">
                    <button class="btn-hapus" onclick="deleteAdminItem('jurusan','${j.kd_jurusan}')">🗑 Hapus</button>
                </td>
            </tr>
        `).join('');
    }
   if (tr) {
        tr.innerHTML = dbRule.map(r => {
            // Kita cari nama fakultas berdasarkan kd_fakultas yang tersimpan di rule
            let fak = dbFakultas.find(item => 
                String(item.kd_fakultas).trim().toLowerCase() === String(r.kd_fakultas).trim().toLowerCase()
            );
            
            let namaFak = fak ? fak.nama_fakultas : `<span style="color:red;">Fakultas Tidak Ditemukan (${r.kd_fakultas})</span>`;
            
            return `<tr>
                <td>${r.kd_gejala}</td>
                <td>${namaFak}</td>
                <td style="text-align: center;">
                    <button class="btn-hapus" onclick="deleteAdminItem('rule','${r.kd_gejala}|${r.kd_fakultas}')">🗑 Hapus</button>
                </td>
            </tr>`;
        }).join('');
    }
function populateAdminSelects() {
    const sg = document.getElementById('rule-gejala');
    const sf = document.getElementById('rule-fakultas'); 
    if (!sg || !sf) return;
    sg.innerHTML = '<option value="">-- Pilih Gejala --</option>';
    sf.innerHTML = '<option value="">-- Pilih Fakultas --</option>';
    dbGejala.forEach(g => sg.innerHTML += `<option value="${escapeHtml(g.kd_gejala)}">${escapeHtml(g.kd_gejala)} - ${escapeHtml(g.indikator.substring(0, 50))}...</option>`);
    dbFakultas.forEach(f => sf.innerHTML += `<option value="${escapeHtml(f.kd_fakultas)}">${escapeHtml(f.kd_fakultas)} - ${escapeHtml(f.nama_fakultas)}</option>`);
}
async function sendPostRequest(payload) {
    try {
        const res = await fetch(API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
        });
        const result = await res.json();
        if (result.status === 'success') {
            console.log("Data berhasil diproses!");
            setTimeout(async () => {
                await loadAdminData();
                alert("Data berhasil diupdate!");
            }, 2000);
            return true;
        } else {
            alert("❌ Gagal: " + result.message);
            return false;
        }
    } catch (err) {
        console.error("Error:", err);
        return false;
    }
}
async function addGejala() {
    let kode = document.getElementById('g-kode').value.trim();
    let teks = document.getElementById('g-teks').value.trim();
    if (!kode || !teks) return alert("Lengkapi data!");
    const btn = event.target;
    const txt = btn.innerHTML;
    btn.innerHTML = '⏳...'; btn.disabled = true;
    if (await sendPostRequest({ action: 'addGejala', kd_gejala: kode, indikator: teks })) {
        document.getElementById('g-kode').value = ''; document.getElementById('g-teks').value = '';
        await loadAdminData(); await loadKnowledgeBase();
    }
    btn.innerHTML = txt; btn.disabled = false;
}
async function addJurusan() {
    let kode = document.getElementById('j-kode').value.trim();
    let nama = document.getElementById('j-nama').value.trim();
    let desc = document.getElementById('j-desc').value.trim();
    if (!kode || !nama || !desc) return alert("Lengkapi data!");
    const btn = event.target;
    const txt = btn.innerHTML;
    btn.innerHTML = '⏳...'; btn.disabled = true;
    if (await sendPostRequest({ action: 'addJurusan', kd_jurusan: kode, nama_jurusan: nama, deskripsi: desc })) {
        document.getElementById('j-kode').value = ''; document.getElementById('j-nama').value = ''; document.getElementById('j-desc').value = '';
        await loadAdminData(); await loadKnowledgeBase();
    }
    btn.innerHTML = txt; btn.disabled = false;
}
async function addRule() {
    let gejala = document.getElementById('rule-gejala').value;
    let fakultas = document.getElementById('rule-fakultas').value; 
    if (!gejala || !fakultas) return alert("Pilih gejala dan fakultas!");
    const btn = event.target;
    const txt = btn.innerHTML;
    btn.innerHTML = '⏳...'; btn.disabled = true;
    if (await sendPostRequest({ action: 'addRule', kd_gejala: gejala, kd_fakultas: fakultas })) {
        await loadAdminData();
        await loadKnowledgeBase();
    }
    btn.innerHTML = txt; btn.disabled = false;
}
async function deleteAdminItem(type, id) {
    if (!confirm(`Hapus data ${type}?`)) return;
    let payload = {};
    if (type === 'gejala') payload = { action: 'deleteGejala', kd_gejala: id };
    else if (type === 'jurusan') payload = { action: 'deleteJurusan', kd_jurusan: id };
    else if (type === 'rule') { 
        let [g, f] = id.split('|'); 
        payload = { action: 'deleteRule', kd_gejala: g, kd_fakultas: f }; }
    const btn = event.target;
    const txt = btn.innerHTML;
    btn.innerHTML = '⏳...'; btn.disabled = true;
    if (await sendPostRequest(payload)) { await loadAdminData(); await loadKnowledgeBase(); }
    btn.innerHTML = txt; btn.disabled = false;
}
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (tab === 'gejala') { document.getElementById('tab-gejala').classList.add('active'); document.querySelector('.tab-btn:first-child').classList.add('active-tab'); }
    else if (tab === 'jurusan') { document.getElementById('tab-jurusan').classList.add('active'); document.querySelector('.tab-btn:nth-child(2)').classList.add('active-tab'); }
    else if (tab === 'rule') { document.getElementById('tab-rule').classList.add('active'); document.querySelector('.tab-btn:nth-child(3)').classList.add('active-tab'); }
}
window.addEventListener('scroll', () => {
    const h = document.getElementById('main-header');
    if (h && window.scrollY > 60) h.classList.add('scrolled');
    else if (h) h.classList.remove('scrolled');
    updateActiveLinkOnScroll();
});
document.addEventListener('click', e => { if (e.target && e.target.id === 'resetQuizBtn') resetQuiz(); });
const observer = new IntersectionObserver(e => e.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }), { threshold: 0.05 });
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    const navHome = document.getElementById('nav-home');
    if (navHome) navHome.classList.add('active-link');
    loadKnowledgeBase();
});
function renderDaftarJurusanUtama() {
    const container = document.getElementById('jurusan-card-container');
    if (!container) return;
    if (!dbFakultas || dbFakultas.length === 0 || !dbJurusan || dbJurusan.length === 0) {
        container.innerHTML = '<p style="color:#64748B; text-align:center;">⏳ Memuat data dari database cloud...</p>';
        return;
    }
    let html = '';
    dbFakultas.forEach(f => {
        let jurusanDiFakultas = dbJurusan.filter(j => String(j.kd_fakultas).trim() === String(f.kd_fakultas).trim());
        if (jurusanDiFakultas.length > 0) {
            html += `
                <div class="fakultas-group" style="margin-bottom: 40px;">
                    <h3 style="color: var(--primary); font-size: 1.5rem; margin-bottom: 20px; border-bottom: 2px solid var(--secondary); padding-bottom: 10px;">
                        ${f.nama_fakultas}
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        ${jurusanDiFakultas.map(j => `
                            <div class="jurusan-info-card">
                                <span class="jurusan-info-badge">${escapeHtml(String(j.kd_jurusan))}</span>
                                <div class="jurusan-info-title">📖 ${escapeHtml(String(j.nama_jurusan))}</div>
                                <p class="jurusan-info-desc">${escapeHtml(String(j.deskripsi))}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    container.innerHTML = html;
}
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinksContainer');
    if (navLinks) {
        navLinks.classList.toggle('mobile-active');
    }
}
