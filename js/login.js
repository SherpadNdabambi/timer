//get DOM elements
const email = $('#email'),
      loginMessage = $('#loginMessage'),
      password = $('#password');

async function login(){
    if(email.val() === 'test' && password.val() === '123'){
        localStorage.user = JSON.stringify(
            {
                id: 'test',
                username: 'Test User'
            });
        location.href = 'index.html';
    }
    else {
        await $.post('php/login.php',
            {
                email: email.val(),
                password: password.val()
            },
            (result) => {
                try {
                    localStorage.user = JSON.stringify(JSON.parse(result));
                    location.href = 'index.html';
                }
                catch(error) {
                    loginMessage.empty();
                    loginMessage.append(`Failed to login: ${result}`);
                }
            }
        );
    }
}

setFooterYear();