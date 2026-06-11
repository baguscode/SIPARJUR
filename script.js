// ==================== KONFIGURASI ====================
const API_URL = "https://script.google.com/macros/s/AKfycbzdNez5JNiwXLVwK1O0hAeVyXcy0fAoGq1C6djUuj3qze2-QiHMoMKVrl8tQxwI6wGa/exec";
const ADMIN_PASSWORD = "admin123";

// CORS Proxy (gratis, untuk bypass CORS)

const CORS_PROXY = "https://corsproxy.io/?";
let dbGejala = [], dbJurusan = [], dbRule = [];
let currentStep = 0;
let skorJurusan = {};
let isLoaded = false;

// ==================== PASSWORD TOGGLE ====================
function togglePassword() {
    const passwordInput = document.getElementById('adminPassword');
    const eyeIcon = document.querySelector('.eye-icon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = '👁️';
    }
}

// ==================== ADMIN MODAL ====================
function openAdminModal() {
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').type = 'password';
    document.querySelector('.eye-icon').innerHTML = '👁️';
    document.getElementById('adminErrorMsg').style.display = 'none';
    setTimeout(() => {
        document.getElementById('adminPassword').focus();
    }, 100);
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminErrorMsg').style.display = 'none';
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
        setTimeout(() => {
            if (document.getElementById('adminErrorMsg').style.display === 'block') {
                document.getElementById('adminErrorMsg').style.display = 'none';
            }
        }, 2000);
    }
}

// ==================== SHOW/HIDE ADMIN PANEL ====================
function showAdminPanel() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('mainFooter').style.display = 'none';
    document.getElementById('adminFloatingBtn').style.display = 'none';
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    
    loadAdminData();
}

function scrollAdminToTop() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAdminPanel() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('mainFooter').style.display = 'block';
    document.getElementById('adminFloatingBtn').style.display = 'flex';
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    document.getElementById('nav-home').classList.add('active-link');
    scrollToSection('home');
}

function showMainContent() {
    if (document.getElementById('adminPanel').style.display === 'block') return;
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('mainFooter').style.display = 'block';
    document.getElementById('adminFloatingBtn').style.display = 'flex';
}

// ==================== SMOOTH SCROLL ====================
function scrollToSection(section) {
    let element;
    if (section === 'home') element = document.getElementById('home-section');
    else if (section === 'consult') element = document.getElementById('consult-section');
    else if (section === 'about') element = document.getElementById('about-section');
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active-link'));
    if (section === 'home') document.getElementById('nav-home').classList.add('active-link');
    if (section === 'consult') document.getElementById('nav-consult').classList.add('active-link');
    if (section === 'about') document.getElementById('nav-about').classList.add('active-link');
}

// ==================== LOAD DATABASE MAIN (GET Request - via Proxy) ====================
async function loadKnowledgeBase() {
    try {
        // Untuk GET request, kita pakai proxy juga
        const proxyUrl = CORS_PROXY + API_URL + "?action=getKnowledgeBase";
        let res = await fetch(proxyUrl);
        let data = await res.json();
        dbGejala = data.gejala || [];
        dbJurusan = data.jurusan || [];
        dbRule = data.rule || [];
        isLoaded = true;

        document.getElementById('loading-kb').style.display = 'none';
        document.getElementById('quiz-area-box').style.display = 'block';
        
        if(dbGejala.length > 0) {
            resetQuiz();
        } else {
            document.getElementById('dynamic-question-container').innerHTML = '<p style="color: red; text-align:center;">⚠️ Belum ada data gejala di database. Silakan tambahkan melalui Admin Panel.</p>';
        }
    } catch(err) {
        console.error(err);
        document.getElementById('loading-kb').innerHTML = '<p style="color: red; text-align:center;">❌ Gagal konek database. Periksa URL Apps Script dan pastikan sudah di-deploy.</p>';
    }
}

function renderCurrentQuestion() {
    if(dbGejala.length === 0 || currentStep >= dbGejala.length) return;
    let item = dbGejala[currentStep];
    document.getElementById('progress-indicator').innerText = `Pertanyaan ${currentStep+1} dari ${dbGejala.length}`;
    document.getElementById('bar-fill').style.width = `${((currentStep+1)/dbGejala.length)*100}%`;
    
    let container = document.getElementById('dynamic-question-container');
    container.innerHTML = `
        <div class="question-card active" id="current-question-card">
            <h3>${currentStep+1}. ${escapeHtml(item.indikator)}</h3>
            <div class="options-vertical">
                <button class="choice-btn" onclick="answerQuestion('${escapeHtml(item.kd_gejala)}', 3)"><span>✅ Ya, saya sangat menyukai bidang tersebut</span> <span>➔</span></button>
                <button class="choice-btn" onclick="answerQuestion('${escapeHtml(item.kd_gejala)}', 0)"><span>❌ Tidak, saya kurang berminat</span> <span>➔</span></button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        let card = document.getElementById('current-question-card');
        if(card) {
            card.classList.add('question-highlight');
            setTimeout(() => card.classList.remove('question-highlight'), 1600);
        }
    }, 100);
}

function answerQuestion(kdGejala, points) {
    if(points > 0) {
        let matchedRules = dbRule.filter(r => r.kd_gejala === kdGejala);
        matchedRules.forEach(rule => {
            if(!skorJurusan[rule.kd_jurusan]) skorJurusan[rule.kd_jurusan] = 0;
            skorJurusan[rule.kd_jurusan] += parseInt(rule.bobot) || 0;
        });
    }
    currentStep++;
    if(currentStep < dbGejala.length) {
        renderCurrentQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('quiz-area-box').style.display = 'none';
    document.getElementById('loading-view').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('result-box').style.display = 'block';
        
        let hasil = dbJurusan.map(j => ({
            nama: j.nama_jurusan,
            deskripsi: j.deskripsi,
            skor: skorJurusan[j.kd_jurusan] || 0,
            kode: j.kd_jurusan
        })).sort((a,b) => b.skor - a.skor).slice(0,3);
        
        let container = document.getElementById('result-list-container');
        container.innerHTML = '';
        
        let totalSkor = hasil.reduce((sum, h) => sum + h.skor, 0);
        if(totalSkor === 0) {
            container.innerHTML = '<div class="result-item"><div class="res-title">📭 Hasil Kurang Valid</div><div class="res-desc">Anda memilih opsi negatif pada seluruh indikator minat. Silakan ulangi tes dengan lebih serius.</div></div>';
        } else {
            hasil.forEach((h, idx) => {
                container.innerHTML += `
                    <div class="result-item">
                        <div class="rank-number">#${idx+1}</div>
                        <div class="res-title">🏆 Peringkat ${idx+1}: ${escapeHtml(h.nama)}</div>
                        <div class="res-desc">${escapeHtml(h.deskripsi)}</div>
                        <div style="margin-top: 8px; font-size:0.8rem; color:var(--secondary);">🎯 Skor kecocokan: ${h.skor} poin</div>
                    </div>
                `;
            });
        }
        
        document.getElementById('result-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1200);
}

function resetQuiz() {
    currentStep = 0;
    skorJurusan = {};
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('quiz-area-box').style.display = 'block';
    renderCurrentQuestion();
    
    setTimeout(() => {
        let questionCard = document.getElementById('current-question-card');
        if(questionCard) {
            questionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            questionCard.classList.add('question-highlight');
            setTimeout(() => questionCard.classList.remove('question-highlight'), 1600);
        }
    }, 200);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== SCROLL SPY ====================
function updateActiveLinkOnScroll() {
    if (document.getElementById('adminPanel').style.display === 'block') return;
    
    const sections = [
        { id: 'home-section', navId: 'nav-home' },
        { id: 'consult-section', navId: 'nav-consult' },
        { id: 'about-section', navId: 'nav-about' }
    ];
    
    let currentSection = '';
    const scrollPosition = window.scrollY + 150;
    
    for (let section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
            const offsetTop = element.offsetTop;
            const offsetBottom = offsetTop + element.offsetHeight;
            if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
                currentSection = section.id;
                break;
            }
        }
    }
    
    sections.forEach(section => {
        const navLink = document.getElementById(section.navId);
        if (navLink) {
            if (currentSection === section.id) {
                navLink.classList.add('active-link');
            } else {
                navLink.classList.remove('active-link');
            }
        }
    });
}

// ==================== ADMIN FUNCTIONS (CRUD dengan CORS PROXY) ====================

async function loadAdminData() {
    document.getElementById('table-gejala').innerHTML = '<tr><td colspan="3" class="loading-row">⏳ Memuat......</td></tr>';
    document.getElementById('table-jurusan').innerHTML = '<tr><td colspan="4" class="loading-row">⏳ Memuat......</td></tr>';
    document.getElementById('table-rule').innerHTML = '<tr><td colspan="4" class="loading-row">⏳ Memuat......</td></tr>';
    
    try {
        const proxyUrl = CORS_PROXY + API_URL + "?action=getKnowledgeBase";
        let res = await fetch(proxyUrl);
        let data = await res.json();
        dbGejala = data.gejala || [];
        dbJurusan = data.jurusan || [];
        dbRule = data.rule || [];
        
        renderAdminTables();
        populateAdminSelects();
        scrollAdminToTop();
    } catch(e) {
        console.error("Load error:", e);
        document.getElementById('table-gejala').innerHTML = `<tr><td colspan="3" style="color:red;">❌ Error: ${e.message}</td></tr>`;
    }
}

function renderAdminTables() {
    // Tabel Gejala
    let tGejala = document.getElementById('table-gejala');
    if (dbGejala.length === 0) {
        tGejala.innerHTML = '<tr><td colspan="3" style="text-align:center;">📭 Belum ada data gejala</td></tr>';
    } else {
        tGejala.innerHTML = dbGejala.map(g => `
            <tr>
                <td><strong>${escapeHtml(g.kd_gejala)}</strong></td>
                <td>${escapeHtml(g.indikator)}</td>
                <td><button class="btn-delete" onclick="deleteAdminItem('gejala','${escapeHtml(g.kd_gejala)}')">🗑 Hapus</button></td>
            </tr>
        `).join('');
    }
    
    // Tabel Jurusan
    let tJurusan = document.getElementById('table-jurusan');
    if (dbJurusan.length === 0) {
        tJurusan.innerHTML = '<tr><td colspan="4" style="text-align:center;">📭 Belum ada data jurusan</td></tr>';
    } else {
        tJurusan.innerHTML = dbJurusan.map(j => `
            <tr>
                <td><strong>${escapeHtml(j.kd_jurusan)}</strong></td>
                <td>${escapeHtml(j.nama_jurusan)}</td>
                <td>${escapeHtml(j.deskripsi)}</td>
                <td><button class="btn-delete" onclick="deleteAdminItem('jurusan','${escapeHtml(j.kd_jurusan)}')">🗑 Hapus</button></td>
            </tr>
        `).join('');
    }
    
    // Tabel Rule
    let tRule = document.getElementById('table-rule');
    if (dbRule.length === 0) {
        tRule.innerHTML = '<tr><td colspan="4" style="text-align:center;">📭 Belum ada data rule</td></tr>';
    } else {
        tRule.innerHTML = dbRule.map((r) => `
            <tr>
                <td>${escapeHtml(r.kd_gejala)}</td>
                <td>${escapeHtml(r.kd_jurusan)}</td>
                <td><span class="badge-bobot">${r.bobot}</span></td>
                <td><button class="btn-delete" onclick="deleteAdminItem('rule','${escapeHtml(r.kd_gejala)}|${escapeHtml(r.kd_jurusan)}')">🗑 Hapus</button></td>
            </tr>
        `).join('');
    }
}

function populateAdminSelects() {
    let selGejala = document.getElementById('rule-gejala');
    let selJurusan = document.getElementById('rule-jurusan');
    
    if (!selGejala || !selJurusan) return;
    
    selGejala.innerHTML = '<option value="">-- Pilih Gejala --</option>';
    selJurusan.innerHTML = '<option value="">-- Pilih Jurusan --</option>';
    
    dbGejala.forEach(g => {
        selGejala.innerHTML += `<option value="${escapeHtml(g.kd_gejala)}">${escapeHtml(g.kd_gejala)} - ${escapeHtml(g.indikator.substring(0, 50))}...</option>`;
    });
    
    dbJurusan.forEach(j => {
        selJurusan.innerHTML += `<option value="${escapeHtml(j.kd_jurusan)}">${escapeHtml(j.kd_jurusan)} - ${escapeHtml(j.nama_jurusan)}</option>`;
    });
}

// ==================== CRUD dengan CORS PROXY ====================

async function sendPostRequest(payload) {
    try {
        // Kirim POST via proxy
        const proxyUrl = CORS_PROXY + API_URL;
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log("Response:", result);
        
        if (result.status === 'success') {
            alert("✅ Berhasil!");
            return true;
        } else {
            alert("❌ Gagal: " + (result.message || "Unknown error"));
            return false;
        }
    } catch(err) {
        console.error("Request failed:", err);
        alert("❌ Gagal mengirim perintah: " + err.message);
        return false;
    }
}

async function addGejala() {
    let kode = document.getElementById('g-kode').value.trim();
    let teks = document.getElementById('g-teks').value.trim();
    if (!kode || !teks) return alert("Lengkapi kode dan pertanyaan!");
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Menyimpan...';
    btn.disabled = true;
    
    const success = await sendPostRequest({
        action: 'addGejala',
        kd_gejala: kode,
        indikator: teks
    });
    
    if (success) {
        document.getElementById('g-kode').value = '';
        document.getElementById('g-teks').value = '';
        await loadAdminData();
        await loadKnowledgeBase();
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function addJurusan() {
    let kode = document.getElementById('j-kode').value.trim();
    let nama = document.getElementById('j-nama').value.trim();
    let desc = document.getElementById('j-desc').value.trim();
    if (!kode || !nama || !desc) return alert("Lengkapi semua data!");
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Menyimpan...';
    btn.disabled = true;
    
    const success = await sendPostRequest({
        action: 'addJurusan',
        kd_jurusan: kode,
        nama_jurusan: nama,
        deskripsi: desc
    });
    
    if (success) {
        document.getElementById('j-kode').value = '';
        document.getElementById('j-nama').value = '';
        document.getElementById('j-desc').value = '';
        await loadAdminData();
        await loadKnowledgeBase();
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function addRule() {
    let gejala = document.getElementById('rule-gejala').value;
    let jurusan = document.getElementById('rule-jurusan').value;
    let bobot = document.getElementById('rule-bobot').value;
    
    if (!gejala || !jurusan) return alert("Pilih gejala dan jurusan!");
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Menyimpan...';
    btn.disabled = true;
    
    const success = await sendPostRequest({
        action: 'addRule',
        kd_gejala: gejala,
        kd_jurusan: jurusan,
        bobot: bobot
    });
    
    if (success) {
        await loadAdminData();
        await loadKnowledgeBase();
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function deleteAdminItem(type, id) {
    if (!confirm(`Hapus data ${type} ini?`)) return;
    
    let payload = {};
    if (type === 'gejala') {
        payload = { action: 'deleteGejala', kd_gejala: id };
    } else if (type === 'jurusan') {
        payload = { action: 'deleteJurusan', kd_jurusan: id };
    } else if (type === 'rule') {
        let [gejala, jurusan] = id.split('|');
        payload = { action: 'deleteRule', kd_gejala: gejala, kd_jurusan: jurusan };
    }
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Menghapus...';
    btn.disabled = true;
    
    const success = await sendPostRequest(payload);
    
    if (success) {
        await loadAdminData();
        await loadKnowledgeBase();
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'gejala') {
        document.getElementById('tab-gejala').classList.add('active');
        document.querySelector('.tab-btn:first-child').classList.add('active-tab');
    } else if (tab === 'jurusan') {
        document.getElementById('tab-jurusan').classList.add('active');
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active-tab');
    } else if (tab === 'rule') {
        document.getElementById('tab-rule').classList.add('active');
        document.querySelector('.tab-btn:nth-child(3)').classList.add('active-tab');
    }
}

// ==================== EVENT LISTENER & INIT ====================
window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (window.scrollY > 60) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    updateActiveLinkOnScroll();
});

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'resetQuizBtn') {
        resetQuiz();
    }
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('active'); });
}, { threshold: 0.05 });

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    document.getElementById('nav-home').classList.add('active-link');
    loadKnowledgeBase();
});
