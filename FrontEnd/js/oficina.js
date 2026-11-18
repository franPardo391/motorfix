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
        cargarClientes();                                            // Con la sesión OK, pedimos los clientes
   
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

var clientes = [];                                                   // Guardamos la lista para usarla al editar

function cargarClientes() {
    var url  = '../../BackEnd/sw/cliente_sw.php';
    var data = { action: 'get', data: { dni: document.getElementById('buscarDni').value } };  // Vacío = todos

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var tbody = document.getElementById('tablaClientes');
        tbody.innerHTML = '';                                        // Vaciamos la tabla antes de pintar

        if (!response.success) {                                     // Error del servicio
            tbody.innerHTML = '<tr><td colspan="5">' + response.msg + '</td></tr>';
            return;
        }
        clientes = response.data;
        if (clientes.length == 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay clientes.</td></tr>';
            return;
        }
        for (var i = 0; i < clientes.length; i++) {
            var c = clientes[i];
            var cuenta = c.id_usuario ? 'Sí' : 'No';                 // NULL = cliente sin cuenta web
            tbody.innerHTML += '<tr>' +
                '<td>' + c.dni + '</td>' +
                '<td>' + c.nombre + '</td>' +
                '<td>' + c.telefono + '</td>' +
                '<td>' + cuenta + '</td>' +
                '<td>' +
                    '<button type="button" class="btn-sec" onclick="editarCliente(' + c.id_cliente + ')">Editar</button>' +
                    '<button type="button" class="btn-borrar" onclick="borrarCliente(' + c.id_cliente + ')">Borrar</button>' +
                '</td>' +
            '</tr>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}
