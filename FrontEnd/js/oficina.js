window.onload = function () {
    comprobarSesion();                                               // Lo primero: ¿quién está logueado?
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
        if (!response.success || response.data[0].rol != 'Oficina') {   // Sin sesión, o no es Oficina
            window.location.href = 'login.html';                     // Fuera: al login
            return;
        }
        document.getElementById('nombreUsuario').innerHTML = response.data[0].nombre;  // Nombre de $_SESSION
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

var SECCIONES = ['Citas', 'Clientes', 'Vehiculos', 'Facturacion'];  // Final de los id: seccionX y pestanaX

function mostrarSeccion(nombre) {
    for (var i = 0; i < SECCIONES.length; i++) {                     // Primero lo ocultamos todo
        document.getElementById('seccion' + SECCIONES[i]).classList.add('oculto');
        document.getElementById('pestana' + SECCIONES[i]).classList.remove('activa');
    }
    document.getElementById('seccion' + nombre).classList.remove('oculto');   // Y mostramos solo la elegida
    document.getElementById('pestana' + nombre).classList.add('activa');      // Subrayado amarillo
}
