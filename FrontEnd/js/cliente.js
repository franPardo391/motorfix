window.onload = function () {                                        // Se ejecuta cuando la página ha cargado
    comprobarSesion();
};

function comprobarSesion() {
    var url  = '../../BackEnd/sw/auth_sw.php';
    var data = { action: 'sesion' };                                 // Preguntamos al servidor quién está logueado

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (!response.success || response.data[0].rol != 'Cliente') {   // Sin sesión, o no es Cliente
            window.location.href = 'login.html';                    // Fuera: al login
            return;                                                  // No sigue ejecutando nada más
        }
        var nombre = response.data[0].nombre;                        // El nombre viene de $_SESSION
        document.getElementById('nombreUsuario').innerHTML = nombre; // Barra superior
        document.getElementById('saludoNombre').innerHTML  = nombre; // "Hola, ..."
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function logout() {
    var url  = '../../BackEnd/sw/auth_sw.php';
    var data = { action: 'logout' };                                 // session_destroy() en el servidor

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function () {
        window.location.href = 'login.html';                         // Tras cerrar sesión, al login
    });
}