// ==================== KONFIGURASI ====================
const API_URL = "https://script.google.com/macros/s/AKfycbwi0L3mUEmsvbNGGFp0ha94XJKzhnAANPGMAhZOG_GewD7NaLFKlvFQg8UMTTNbsQPt/exec";
const ADMIN_PASSWORD = "admin123";

// CORS Proxy
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
            if (document.getElementById('
