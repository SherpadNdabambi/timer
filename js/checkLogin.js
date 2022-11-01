function checkLogin() {
    if (localStorage.user) return true;
    location.href = 'login.html';
}