window.onload = function () {
    comprobarSesion();                                               // Lo primero: ¿quién está logueado?
};

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
        if (!response.success || response.data[0].rol != 'Mecanico') {  // Sin sesión, o no es Mecánico
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('nombreUsuario').innerHTML = response.data[0].nombre;
        cargarCitas();                                               // Con la sesión OK, su hoja de trabajo
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

var citas   = [];                                                    // Para ver el detalle sin otro fetch
var ESTADOS = ['Pendiente', 'Asignada', 'En reparacion', 'Finalizada'];   // Como en la BD
var TEXTOS  = ['Pendiente', 'Asignada', 'En reparación', 'Finalizada'];   // Como se ven
var CLASES  = ['pendiente', 'asignada', 'reparacion', 'finalizada'];      // Color del cuadradito

function cargarCitas() {
    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'get' };                                    // Sin id: el servidor filtra por SU id_mecanico

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var lista = document.getElementById('listaCitas');
        lista.innerHTML = '';

        if (!response.success) {
            lista.innerHTML = '<p class="msg error">' + response.msg + '</p>';
            return;
        }
        citas = response.data;
        if (citas.length == 0) {
            lista.innerHTML = '<p>No tienes reparaciones asignadas.</p>';
            return;
        }
        for (var i = 0; i < citas.length; i++) {
            var c   = citas[i];
            var pos = ESTADOS.indexOf(c.estado);
            lista.innerHTML +=
                '<div class="tarjeta" id="tarjeta' + c.id_cita + '" onclick="verCita(' + c.id_cita + ')">' +
                    '<div class="info">' +
                        '<span class="placa">' + c.matricula + '</span>' +
                        '<div>' +
                            '<strong>' + c.marca + ' ' + c.modelo + '</strong>' +
                            '<p class="detalle">' + c.descripcion + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<span><span class="cuadro ' + CLASES[pos] + '"></span>' + TEXTOS[pos] + '</span>' +
                '</div>';
        }
        var elegida = document.getElementById('id_cita').value;      // Tras guardar: volver a marcar la que estaba abierta
        if (elegida != '' && document.getElementById('tarjeta' + elegida)) {
            document.getElementById('tarjeta' + elegida).classList.add('elegida');
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function verCita(id) {                                               // Al pulsar una tarjeta
    var c = null;
    for (var i = 0; i < citas.length; i++) {                         // Buscamos la cita en la lista guardada
        document.getElementById('tarjeta' + citas[i].id_cita).classList.remove('elegida');
        if (citas[i].id_cita == id) c = citas[i];
    }
    document.getElementById('tarjeta' + id).classList.add('elegida');      // Borde azul en la elegida

    document.getElementById('id_cita').value            = c.id_cita;
    document.getElementById('detPlaca').innerHTML       = c.matricula;
    document.getElementById('detCoche').innerHTML       = c.marca + ' ' + c.modelo;
    document.getElementById('detCliente').innerHTML     = 'Cliente: ' + c.cliente + ' · Kilómetros: ' + (c.kilometraje ? c.kilometraje : '-');
    document.getElementById('detDescripcion').innerHTML = c.descripcion;
    document.getElementById('horas').value              = c.horas;
    document.getElementById('importe_repuesto').value   = c.importe_repuesto;
    document.getElementById('piezas').value             = c.piezas ? c.piezas : '';   // NULL → vacío
    elegirEstado(ESTADOS.indexOf(c.estado));                         // Pinta los 3 botones según su estado

    document.getElementById('msg').innerHTML = '';                   // Sin mensajes de la cita anterior
    document.getElementById('detalleCita').classList.remove('oculto');
}

function elegirEstado(pos) {                                         // 1 = Asignada, 2 = En reparación, 3 = Finalizada
    document.getElementById('estado').value = ESTADOS[pos];          // Lo que se mandará al guardar
    for (var i = 1; i <= 3; i++) {
        var clase = 'paso';
        if (i < pos)  clase += ' hecho';                             // Anteriores: azul
        if (i == pos) clase += ' actual';                            // Elegido: amarillo
        document.getElementById('estado' + i).className = clase;
    }
}
