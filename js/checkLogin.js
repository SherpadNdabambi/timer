/**
 * @returns {boolean} true if user is logged in, otherwise redirects to login page
 */
function checkLogin() {
    if (localStorage.user) return true;
    location.href = 'login.html';
}