// ==================== KONFIGURASI ====================
const API_URL = "https://script.google.com/macros/s/AKfycbwi0L3mUEmsvbNGGFp0ha94XJKzhnAANPGMAhZOG_GewD7NaLFKlvFQg8UMTTNbsQPt/exec";
const ADMIN_PASSWORD = "admin123";
const CORS_PROXY = "https://corsproxy.io/";

let dbGejala = [], dbJurusan = [], dbRule = [];
let currentStep = 0;
let skorJurusan = {};

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
    if (section === 'home') element = document.getElementById('home-section');
    else if (section === 'consult') element = document.getElementById('consult-section');
    else if (section === 'about') element = document.getElementById('about-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    if (section === 'home') document.getElementById('nav-home').classList.add('active-link');
    if (section === 'consult') document.getElementById('nav-consult').classList.add('active-link');
    if (section === 'about') document.getElementById('nav-about').classList.add('active-link');
    if (section === 'program-studi') document.getElementById('nav-program-studi').classList.add('active-link');
    if (section === 'about') document.getElementById('nav-about').classList.add('active-link');
}

// ====================  DATABASE ====================
async function loadKnowledgeBase() {
    try {
        const timestamp = Date.now();
        const proxyUrl = CORS_PROXY + API_URL + "?action=getKnowledgeBase&_=" + timestamp;
        let res = await fetch(proxyUrl);
        let data = await res.json();
        
        dbGejala = data.gejala || [];
        dbJurusan = data.jurusan || [];
        dbRule = data.rule || [];
        
        document.getElementById('loading-kb').style.display = 'none';
        document.getElementById('quiz-area-box').style.display = 'block';
        
        // Memanggil fungsi untuk merender daftar jurusan di halaman depan
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
}
function renderCurrentQuestion() {
    if (dbGejala.length === 0 || currentStep >= dbGejala.length) return;
    let item = dbGejala[currentStep];
    document.getElementById('progress-indicator').innerText = `Pertanyaan ${currentStep+1} dari ${dbGejala.length}`;
    document.getElementById('bar-fill').style.width = `${((currentStep+1)/dbGejala.length)*100}%`;
    let container = document.getElementById('dynamic-question-container');
    container.innerHTML = `<div class="question-card active"><h3>${currentStep+1}. ${escapeHtml(item.indikator)}</h3><div class="options-vertical"><button class="choice-btn" onclick="answerQuestion('${escapeHtml(item.kd_gejala)}', 3)"><span>✅ Ya</span><span>➔</span></button><button class="choice-btn" onclick="answerQuestion('${escapeHtml(item.kd_gejala)}', 0)"><span>❌ Tidak</span><span>➔</span></button></div></div>`;
}

function answerQuestion(kdGejala, points) {
    if (points > 0) {
        let matchedRules = dbRule.filter(r => r.kd_gejala === kdGejala);
        matchedRules.forEach(rule => {
            if (!skorJurusan[rule.kd_jurusan]) skorJurusan[rule.kd_jurusan] = 0;
            skorJurusan[rule.kd_jurusan] += parseInt(rule.bobot) || 0;
        });
    }
    currentStep++;
    if (currentStep < dbGejala.length) { renderCurrentQuestion(); }
    else { showResults(); }
}

function showResults() {
    document.getElementById('quiz-area-box').style.display = 'none';
    document.getElementById('loading-view').style.display = 'block';
    setTimeout(() => {
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('result-box').style.display = 'block';
        let hasil = dbJurusan.map(j => ({ nama: j.nama_jurusan, deskripsi: j.deskripsi, skor: skorJurusan[j.kd_jurusan] || 0 })).sort((a, b) => b.skor - a.skor).slice(0, 3);
        let container = document.getElementById('result-list-container');
        container.innerHTML = '';
        let totalSkor = hasil.reduce((sum, h) => sum + h.skor, 0);
        if (totalSkor === 0) { container.innerHTML = '<div class="result-item"><div class="res-title">📭 Hasil Kurang Valid</div><div class="res-desc">Silakan ulangi tes.</div></div>'; }
        else { hasil.forEach((h, idx) => { container.innerHTML += `<div class="result-item"><div class="rank-number">#${idx+1}</div><div class="res-title">🏆 ${escapeHtml(h.nama)}</div><div class="res-desc">${escapeHtml(h.deskripsi)}</div><div style="margin-top:8px;font-size:0.8rem;color:var(--secondary);">🎯 Skor: ${h.skor} poin</div></div>`; }); }
        document.getElementById('result-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1200);
}

function resetQuiz() {
    currentStep = 0;
    skorJurusan = {};
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('quiz-area-box').style.display = 'block';
    renderCurrentQuestion();
}

// Fungsi terpisah untuk tombol "Ulangi Tes"
function restartQuizWithScroll() {
    resetQuiz();
    const consultSection = document.getElementById('consult-section');
    if (consultSection) { consultSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ==================== SCROLL SPY ====================
function updateActiveLinkOnScroll() {
    if (document.getElementById('adminPanel').style.display === 'block') return;
    const sections = [
        { id: 'home-section', navId: 'nav-home' },
        { id: 'consult-section', navId: 'nav-consult' },
        { id: 'about-section', navId: 'nav-about' }
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
// ==================== ADMIN FUNCTIONS ====================
async function loadAdminData() {
    document.getElementById('table-gejala').innerHTML = '<tr><td colspan="2">⏳ Memuat...</td></tr>';
    document.getElementById('table-jurusan').innerHTML = '<tr><td colspan="2">⏳ Memuat...</td></tr>';
    document.getElementById('table-rule').innerHTML = '<tr><td colspan="2">⏳ Memuat...</td></tr>';
    try {
        const timestamp = Date.now();
        const proxyUrl = CORS_PROXY + API_URL + "?action=getKnowledgeBase&_=" + timestamp;
        let res = await fetch(proxyUrl);
        let data = await res.json();
        dbGejala = data.gejala || [];
        dbJurusan = data.jurusan || [];
        dbRule = data.rule || [];
        renderAdminTables();
        populateAdminSelects();
        renderDaftarJurusanUtama(); 
        
        document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { 
        console.error(e); 
        document.getElementById('table-gejala').innerHTML = `<tr><td colspan="3">❌ Error</td></tr>`; 
    }
        document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { console.error(e); document.getElementById('table-gejala').innerHTML = `<td><td colspan="3">❌ Error</td></tr>`; }
}

function renderAdminTables() {
    const tg = document.getElementById('table-gejala');
    if (tg) tg.innerHTML = dbGejala.length ? dbGejala.map(g => `<tr><td><strong>${escapeHtml(g.kd_gejala)}</strong></td><td>${escapeHtml(g.indikator)}</td><td><button class="btn-delete" onclick="deleteAdminItem('gejala','${escapeHtml(g.kd_gejala)}')">🗑 Hapus</button></td></tr>`).join('') : '<tr><td colspan="3">📭 Belum ada data</td></tr>';
    const tj = document.getElementById('table-jurusan');
    if (tj) tj.innerHTML = dbJurusan.length ? dbJurusan.map(j => `<tr><td><strong>${escapeHtml(j.kd_jurusan)}</strong></td><td>${escapeHtml(j.nama_jurusan)}</td><td>${escapeHtml(j.deskripsi)}</td><td><button class="btn-delete" onclick="deleteAdminItem('jurusan','${escapeHtml(j.kd_jurusan)}')">🗑 Hapus</button></td></tr>`).join('') : '<tr><td colspan="4">📭 Belum ada data</td></tr>';
    const tr = document.getElementById('table-rule');
    if (tr) tr.innerHTML = dbRule.length ? dbRule.map(r => `<tr><td>${escapeHtml(r.kd_gejala)}</td><td>${escapeHtml(r.kd_jurusan)}</td><td><span class="badge-bobot">${r.bobot}</span></td><td><button class="btn-delete" onclick="deleteAdminItem('rule','${escapeHtml(r.kd_gejala)}|${escapeHtml(r.kd_jurusan)}')">🗑 Hapus</button></td></tr>`).join('') : '<tr><td colspan="4">📭 Belum ada data</td></tr>';
}

function populateAdminSelects() {
    const sg = document.getElementById('rule-gejala');
    const sj = document.getElementById('rule-jurusan');
    if (!sg || !sj) return;
    sg.innerHTML = '<option value="">-- Pilih Gejala --</option>';
    sj.innerHTML = '<option value="">-- Pilih Jurusan --</option>';
    dbGejala.forEach(g => sg.innerHTML += `<option value="${escapeHtml(g.kd_gejala)}">${escapeHtml(g.kd_gejala)} - ${escapeHtml(g.indikator.substring(0, 50))}...</option>`);
    dbJurusan.forEach(j => sj.innerHTML += `<option value="${escapeHtml(j.kd_jurusan)}">${escapeHtml(j.kd_jurusan)} - ${escapeHtml(j.nama_jurusan)}</option>`);
}

async function sendPostRequest(payload) {
    try {
        const res = await fetch(CORS_PROXY + API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await res.json();
        if (result.status === 'success') { alert("✅ Berhasil!"); await new Promise(r => setTimeout(r, 1000)); return true; }
        else { alert("❌ Gagal"); return false; }
    } catch (err) { console.error(err); alert("❌ Error"); return false; }
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
    let jurusan = document.getElementById('rule-jurusan').value;
    let bobot = document.getElementById('rule-bobot').value;
    if (!gejala || !jurusan) return alert("Pilih gejala dan jurusan!");
    const btn = event.target;
    const txt = btn.innerHTML;
    btn.innerHTML = '⏳...'; btn.disabled = true;
    if (await sendPostRequest({ action: 'addRule', kd_gejala: gejala, kd_jurusan: jurusan, bobot: bobot })) {
        await loadAdminData(); await loadKnowledgeBase();
    }
    btn.innerHTML = txt; btn.disabled = false;
}

async function deleteAdminItem(type, id) {
    if (!confirm(`Hapus data ${type}?`)) return;
    let payload = {};
    if (type === 'gejala') payload = { action: 'deleteGejala', kd_gejala: id };
    else if (type === 'jurusan') payload = { action: 'deleteJurusan', kd_jurusan: id };
    else if (type === 'rule') { let [g, j] = id.split('|'); payload = { action: 'deleteRule', kd_gejala: g, kd_jurusan: j }; }
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

// ==================== EVENT LISTENER ====================
window.addEventListener('scroll', () => {
    const h = document.getElementById('main-header');
    if (window.scrollY > 60) h.classList.add('scrolled');
    else h.classList.remove('scrolled');
    updateActiveLinkOnScroll();
});
document.addEventListener('click', e => { if (e.target && e.target.id === 'resetQuizBtn') resetQuiz(); });
const observer = new IntersectionObserver(e => e.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }), { threshold: 0.05 });
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    document.getElementById('nav-home').classList.add('active-link');
    loadKnowledgeBase();
});
// ---  FUNGSI render ---
function renderDaftarJurusanUtama() {
    const container = document.getElementById('jurusan-card-container');
    if (!container) return;
    
    if (!dbJurusan || dbJurusan.length === 0) {
        container.innerHTML = '<p style="color:#64748B; text-align:center; grid-column: 1/-1;">⏳ Memuat daftar jurusan dari database cloud...</p>';
        return;
    }
    
    container.innerHTML = dbJurusan.map(j => {
        // Pengaman pembacaan nama kolom spreadsheet (bisa huruf besar/kecil)
        const kode = j.kd_jurusan || j.Kd_Jurusan || j.id || "KODE";
        const nama = j.nama_jurusan || j.Nama_Jurusan || j.nama || j.Nama || "Nama Jurusan";
        const deskripsi = j.deskripsi || j.Deskripsi || j.ket || j.Keterangan || "Tidak ada deskripsi.";
        
        return `
            <div class="jurusan-info-card">
                <span class="jurusan-info-badge">${escapeHtml(String(kode))}</span>
                <div class="jurusan-info-title">📖 ${escapeHtml(String(nama))}</div>
                <p class="jurusan-info-desc">${escapeHtml(String(deskripsi))}</p>
            </div>
        `;
    }).join('');
}
