function login() {
    var email    = document.getElementById('email').value;          // Lee los inputs por su id
    var password = document.getElementById('password').value;
    var msg      = document.getElementById('msg');                   // Párrafo donde mostrar la respuesta

    var url  = '../../BackEnd/sw/auth_sw.php';                       // Servicio: sube de html/ a FrontEnd/ y de ahí a motorfix/
    var data = { action: 'login', data: { email: email, password: password } };   // Mismo JSON que probaste en la consola

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),                                  // Convierte el objeto a texto JSON
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })                     // Pasa la respuesta a objeto JS
    .then(function (response) {
        msg.innerHTML = response.msg;                                // Muestra el msg que manda el servicio
        if (response.success) {
            msg.className = 'msg ok';                                // Verde
            var rol = response.data[0].rol;                          // El rol que guardó el login
            window.location.href = rol.toLowerCase() + '.html';      // Cliente → cliente.html, Oficina → oficina.html...
        } else {
            msg.className = 'msg error';                             // Rojo
        }
    })
    .catch(function (error) {                                        // Si el servidor no responde o el JSON está roto
        msg.className = 'msg error';
        msg.innerHTML = 'Error de conexión con el servidor.';
        console.error('Error:', error);
    });
}