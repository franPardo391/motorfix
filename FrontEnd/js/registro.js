function registro() {
    var msg = document.getElementById('msg');                        // Párrafo donde mostrar la respuesta

    var datos = {                                                    // Los 6 campos, con las mismas claves que espera auth_sw
        nombre:    document.getElementById('nombre').value,
        dni:       document.getElementById('dni').value,
        telefono:  document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        email:     document.getElementById('email').value,
        password:  document.getElementById('password').value
    };

    var url  = '../../BackEnd/sw/auth_sw.php';                       // Mismo servicio que el login
    var data = { action: 'registro', data: datos };                  // Solo cambia la acción

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        msg.innerHTML = response.msg;                                // "Registro completado" o el error
        if (response.success) {
            msg.className = 'msg ok';                                // Verde
            setTimeout(function () {                                 // Espera 2 segundos para que lea el mensaje
                window.location.href = 'login.html';                 // y lo lleva al login
            }, 2000);
        } else {
            msg.className = 'msg error';                             // Rojo: DNI repetido, campos vacíos...
        }
    })
    .catch(function (error) {
        msg.className = 'msg error';
        msg.innerHTML = 'Error de conexión con el servidor.';
        console.error('Error:', error);
    });
}