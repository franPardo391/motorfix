window.onload = function () {
    comprobarSesion();
};

var idSesion = null;                                                 // Mi id: en mi fila no se puede cambiar el rol

function comprobarSesion() {
    var url  = '../../BackEnd/sw/auth_sw.php';
    var data = { action: 'sesion' };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (!response.success || response.data[0].rol != 'Administrador') {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('nombreUsuario').innerHTML = response.data[0].nombre;
        idSesion = response.data[0].id_usuario;
        cargarUsuarios();
        cargarMetricas();                                            // Números del taller
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function logout() {
    var url  = '../../BackEnd/sw/auth_sw.php';
    var data = { action: 'logout' };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function () {
        window.location.href = 'login.html';
    });
}

// ===== USUARIOS =====
var ROLES       = ['Administrador', 'Oficina', 'Mecanico', 'Cliente'];   // Como en la BD
var TEXTOS_ROL  = ['Administrador', 'Oficina', 'Mecánico', 'Cliente'];   // Como se ven

function cargarUsuarios() {
    var url  = '../../BackEnd/sw/usuario_sw.php';
    var data = { action: 'get' };                                    // Sin filtro: todos

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var tbody = document.getElementById('tablaUsuarios');
        tbody.innerHTML = '';
        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="4">' + response.msg + '</td></tr>';
            return;
        }
        for (var i = 0; i < response.data.length; i++) {
            var u = response.data[i];
            var celdaRol, boton;
            if (u.id_usuario == idSesion) {                          // Mi fila: solo texto
                celdaRol = TEXTOS_ROL[ROLES.indexOf(u.rol)] + ' (tú)';
                boton    = '';
            } else {
                celdaRol = selectRol(u.id_usuario, u.rol);
                boton    = '<button type="button" class="btn-sec" onclick="guardarRol(' + u.id_usuario + ')">Guardar</button>' +
                           '<button type="button" class="btn-borrar" onclick="borrarUsuario(' + u.id_usuario + ')">Borrar</button>';
            }
            tbody.innerHTML += '<tr>' +
                '<td>' + u.nombre + '</td>' +
                '<td>' + u.email + '</td>' +
                '<td>' + celdaRol + '</td>' +
                '<td>' + boton + '</td>' +
            '</tr>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function selectRol(id, rol) {                                        // <select id="rol6"> con su rol elegido
    var html = '<select id="rol' + id + '">';
    for (var i = 0; i < ROLES.length; i++) {
        var marcado = (ROLES[i] == rol) ? ' selected' : '';
        html += '<option value="' + ROLES[i] + '"' + marcado + '>' + TEXTOS_ROL[i] + '</option>';
    }
    return html + '</select>';
}

function guardarRol(id) {                                            // Botón "Guardar" de cada fila
    var msg  = document.getElementById('msgUsuario');
    var url  = '../../BackEnd/sw/usuario_sw.php';
    var data = { action: 'update', data: { id_usuario: id, rol: document.getElementById('rol' + id).value } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        msg.className = response.success ? 'msg ok' : 'msg error';
        msg.innerHTML = response.msg;
        cargarUsuarios();                                            // Si falla, el select vuelve al rol real
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function mostrarFormUsuario() {                                      // Botón "Nuevo usuario"
    document.getElementById('nombre').value   = '';
    document.getElementById('email').value    = '';
    document.getElementById('password').value = '';
    document.getElementById('rol').value      = 'Mecanico';
    document.getElementById('formUsuario').classList.remove('oculto');
}

function ocultarFormUsuario() {                                      // Botón "Cancelar"
    document.getElementById('formUsuario').classList.add('oculto');
}

function guardarUsuario() {                                          // Botón "Guardar" del formulario
    var msg  = document.getElementById('msgUsuario');
    var url  = '../../BackEnd/sw/usuario_sw.php';
    var data = {
        action: 'insert',
        data: {
            nombre:   document.getElementById('nombre').value,
            email:    document.getElementById('email').value,
            password: document.getElementById('password').value,
            rol:      document.getElementById('rol').value
        }
    };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            msg.className = 'msg ok';
            ocultarFormUsuario();
            cargarUsuarios();                                        // El nuevo aparece en la tabla
        } else {
            msg.className = 'msg error';
        }
        msg.innerHTML = response.msg;
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

// ===== MÉTRICAS =====
function cargarMetricas() {
    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'get' };                                    // Admin: todas las citas

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (!response.success) return;
        var pendiente = 0, asignada = 0, reparacion = 0, finalizada = 0;
        for (var i = 0; i < response.data.length; i++) {             // Contamos cuántas hay de cada estado
            var estado = response.data[i].estado;
            if (estado == 'Pendiente')     pendiente++;
            if (estado == 'Asignada')      asignada++;
            if (estado == 'En reparacion') reparacion++;
            if (estado == 'Finalizada')    finalizada++;
        }
        document.getElementById('numPendiente').innerHTML  = pendiente;
        document.getElementById('numAsignada').innerHTML   = asignada;
        document.getElementById('numReparacion').innerHTML = reparacion;
        document.getElementById('numFinalizada').innerHTML = finalizada;
    })
    .catch(function (error) {
        console.error('Error:', error);
    });

    fetch('../../BackEnd/sw/factura_sw.php', {                      // Segunda petición: las facturas
        method: 'POST',
        body: JSON.stringify({ action: 'get' }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (!response.success) return;
        var facturado = 0;
        for (var i = 0; i < response.data.length; i++) {
            facturado += Number(response.data[i].total);             // El total de cada factura ya viene de la BD
        }
        document.getElementById('numFacturas').innerHTML  = response.data.length;
        document.getElementById('numFacturado').innerHTML = euros(facturado);
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function euros(cantidad) {                                           // 1234.5 → "1.234,50 €"
    var partes = Number(cantidad).toFixed(2).split('.');             // ["1234", "50"]
    var entero = partes[0];
    var miles  = '';
    while (entero.length > 3) {                                      // De 3 en 3 cifras, desde la derecha
        miles  = '.' + entero.slice(-3) + miles;                     // Últimas 3 cifras con su punto delante
        entero = entero.slice(0, -3);                                // Quitamos esas 3 cifras
    }
    return entero + miles + ',' + partes[1] + ' €';
}

function borrarUsuario(id) {                                         // Botón "Borrar" de cada fila
    if (!confirm('¿Seguro que quieres borrar este usuario?')) return;

    var msg  = document.getElementById('msgUsuario');
    var url  = '../../BackEnd/sw/usuario_sw.php';
    var data = { action: 'delete', data: { id_usuario: id } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        msg.className = response.success ? 'msg ok' : 'msg error';
        msg.innerHTML = response.msg;
        if (response.success) cargarUsuarios();                      // Desaparece de la tabla
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}
