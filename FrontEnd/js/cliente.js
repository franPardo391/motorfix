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
            window.location.href = 'login.html';                     // Fuera: al login
            return;                                                  // No sigue ejecutando nada más
        }
        var nombre = response.data[0].nombre;                        // El nombre viene de $_SESSION
        document.getElementById('nombreUsuario').innerHTML = nombre; // Barra superior
        document.getElementById('saludoNombre').innerHTML  = nombre; // "Hola, ..."
        cargarVehiculos();                                           // Con la sesión OK, pedimos sus vehículos
        cargarCitas();                                               // Y también sus citas                                             
        cargarFacturas();                                            // Y sus facturas
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

var vehiculos = [];                                                  // Guardamos la lista para usarla al editar

function cargarVehiculos() {
    var url  = '../../BackEnd/sw/vehiculo_sw.php';
    var data = { action: 'get' };                                    // Sin id_cliente: el servidor lo saca de la sesión

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) { 
        var tbody = document.getElementById('tablaVehiculos');
        tbody.innerHTML = '';                                        // Vaciamos la tabla antes de pintar

        if (!response.success) {                                     // Error del servicio
            tbody.innerHTML = '<tr><td colspan="6">' + response.msg + '</td></tr>';
            return;
        }

        vehiculos = response.data;                                   // Array de vehículos del JSON
        if (vehiculos.length == 0) {
            tbody.innerHTML = '<tr><td colspan="6">No tienes vehículos registrados.</td></tr>';
            return;
        }

        for (var i = 0; i < vehiculos.length; i++) {                 // Una fila <tr> por vehículo
            var v = vehiculos[i];
            tbody.innerHTML +=
                '<tr>' +
                    '<td><span class="placa">' + v.matricula + '</span></td>' +
                    '<td>' + v.marca + '</td>' +
                    '<td>' + v.modelo + '</td>' +
                    '<td>' + (v.anio ? v.anio : '-') + '</td>' +            // Si está vacío, un guion
                    '<td>' + (v.kilometraje ? v.kilometraje : '-') + '</td>' +
                    '<td>' +
                        '<button type="button" class="btn-sec" onclick="editarVehiculo(' + v.id_vehiculo + ')">Editar</button>' +
                        '<button type="button" class="btn-borrar" onclick="borrarVehiculo(' + v.id_vehiculo + ')">Borrar</button>' +
                    '</td>' +
                '</tr>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function mostrarFormulario() {                                       // Botón "Añadir vehículo"
    limpiarFormulario();
    document.getElementById('tituloForm').innerHTML = 'Añadir vehículo';
    document.getElementById('formVehiculo').classList.remove('oculto');   // Quita display:none → se ve
}

function ocultarFormulario() {                                       // Botón "Cancelar"
    document.getElementById('formVehiculo').classList.add('oculto');      // Vuelve a esconderlo
}

function editarVehiculo(id) {                                        // Botón "Editar" de cada fila
    var v = null;
    for (var i = 0; i < vehiculos.length; i++) {                     // Buscamos ese coche en la lista ya cargada
        if (vehiculos[i].id_vehiculo == id) {
            v = vehiculos[i];
        }
    }
    if (v == null) return;                                           // No debería pasar, pero por si acaso

    limpiarFormulario();
    document.getElementById('id_vehiculo').value = v.id_vehiculo;    // Con id → al guardar será un update
    document.getElementById('matricula').value   = v.matricula;
    document.getElementById('marca').value       = v.marca;
    document.getElementById('modelo').value      = v.modelo;
    document.getElementById('anio').value        = v.anio;
    document.getElementById('kilometraje').value = v.kilometraje;
    document.getElementById('tituloForm').innerHTML = 'Editar vehículo';
    document.getElementById('formVehiculo').classList.remove('oculto');
}

function limpiarFormulario() {                                       // Deja todos los campos en blanco
    document.getElementById('id_vehiculo').value = '';               // Sin id → al guardar será un insert
    document.getElementById('matricula').value   = '';
    document.getElementById('marca').value       = '';
    document.getElementById('modelo').value      = '';
    document.getElementById('anio').value        = '';
    document.getElementById('kilometraje').value = '';
    document.getElementById('msg').innerHTML     = '';
}
function guardarVehiculo() {                                         // Botón "Guardar"
    var msg = document.getElementById('msg');
    var id  = document.getElementById('id_vehiculo').value;          // Vacío = nuevo, con número = editar

    var datos = {                                                    // Mismas claves que lee vehiculo_sw.php
        matricula:   document.getElementById('matricula').value,
        marca:       document.getElementById('marca').value,
        modelo:      document.getElementById('modelo').value,
        anio:        document.getElementById('anio').value,
        kilometraje: document.getElementById('kilometraje').value
    };

    var action = 'insert';                                           // Por defecto, añadir
    if (id != '') {
        action = 'update';                                           // Si hay id, es una edición
        datos.id_vehiculo = id;                                      // y el servicio necesita saber cuál
    }

    var url  = '../../BackEnd/sw/vehiculo_sw.php';
    var data = { action: action, data: datos };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            ocultarFormulario();                                     // Todo OK: cerramos el formulario
            cargarVehiculos();                                       // y repintamos la tabla con los datos nuevos
        } else {
            msg.className = 'msg error';                             // Error: se queda abierto y lo mostramos
            msg.innerHTML = response.msg;                            // "Ya existe un vehículo con esa matrícula."...
        }
    })
    .catch(function (error) {
        msg.className = 'msg error';
        msg.innerHTML = 'Error de conexión con el servidor.';
        console.error('Error:', error);
    });
}

function borrarVehiculo(id) {                                        // Botón "Borrar" de cada fila
    if (!confirm('¿Seguro que quieres borrar este vehículo?')) {     // Ventana de confirmación del navegador
        return;                                                      // Si pulsa Cancelar, no hacemos nada
    }

    var url  = '../../BackEnd/sw/vehiculo_sw.php';
    var data = { action: 'delete', data: { id_vehiculo: id } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            cargarVehiculos();                                       // Repintamos: la fila desaparece
        } else {
            alert(response.msg);                                     // Por ejemplo, si tiene citas asociadas
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}
var ESTADOS = ['Pendiente', 'Asignada', 'En reparacion', 'Finalizada'];    // Igual que el ENUM de la BD
var TEXTOS  = ['Pendiente', 'Asignada', 'En reparación', 'Finalizada'];    // Lo que se ve en pantalla (con tilde)

function cargarCitas() {
    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'get' };                                    // El servidor filtra por el cliente de la sesión

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var lista = document.getElementById('listaReparaciones');
        lista.innerHTML = '';                                        // Vaciamos antes de pintar

        if (!response.success) {
            lista.innerHTML = '<p>' + response.msg + '</p>';
            return;
        }
        if (response.data.length == 0) {
            lista.innerHTML = '<p>No tienes citas todavía.</p>';
            return;
        }

        for (var i = 0; i < response.data.length; i++) {             // Una tarjeta por cita
            var c = response.data[i];
            lista.innerHTML +=
                '<div class="tarjeta">' +
                    '<div class="info">' +
                        '<span class="placa">' + c.matricula + '</span>' +                // Viene del JOIN con vehiculo
                        '<div>' +
                            '<strong>' + c.marca + ' ' + c.modelo + '</strong>' +
                            '<div class="detalle">' + c.descripcion + '</div>' +
                            '<div class="detalle">Cita el ' + formatearFecha(c.fecha) + '</div>' +
                        '</div>' +
                    '</div>' +
                    pintarEstados(c.estado) +                                             // Barra Pendiente → Finalizada
                '</div>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function pintarEstados(estado) {                                     // Devuelve el HTML de la barra de estado
    var pos  = ESTADOS.indexOf(estado);                              // En qué paso está: 0, 1, 2 o 3
    var html = '<div class="estados">';
    for (var i = 0; i < ESTADOS.length; i++) {
        var clase = 'paso';
        if (i < pos)  clase += ' hecho';                             // Pasos anteriores: azul
        if (i == pos) clase += ' actual';                            // Paso actual: amarillo
        html += '<span class="' + clase + '">' + TEXTOS[i] + '</span>';
    }
    return html + '</div>';
}

function formatearFecha(fecha) {                                     // "2026-11-25 10:00:00" → "25/11/2026 10:00"
    var partes = fecha.split(' ');                                   // ["2026-11-25", "10:00:00"]
    var dia    = partes[0].split('-');                               // ["2026", "11", "25"]
    return dia[2] + '/' + dia[1] + '/' + dia[0] + ' ' + partes[1].substring(0, 5);
}
function mostrarFormCita() {                                         // Botón "Pedir cita"
    var select = document.getElementById('citaVehiculo');
    select.innerHTML = '';                                           // Vaciamos las opciones
    for (var i = 0; i < vehiculos.length; i++) {                     // Un <option> por cada coche suyo
        var v = vehiculos[i];
        select.innerHTML += '<option value="' + v.id_vehiculo + '">' +
                            v.matricula + ' - ' + v.marca + ' ' + v.modelo + '</option>';
    }

    document.getElementById('citaFecha').value       = '';
    document.getElementById('citaDescripcion').value = '';
    var msg = document.getElementById('msgCita');
    msg.innerHTML = '';
    if (vehiculos.length == 0) {                                     // Sin coches no puede pedir cita
        msg.className = 'msg error';
        msg.innerHTML = 'Primero añade un vehículo.';
    }
    document.getElementById('formCita').classList.remove('oculto');
}

function ocultarFormCita() {                                         // Botón "Cancelar"
    document.getElementById('formCita').classList.add('oculto');
}

function guardarCita() {                                             // Botón "Enviar solicitud"
    var msg = document.getElementById('msgCita');
    var datos = {                                                    // Mismas claves que lee cita_sw.php
        id_vehiculo: document.getElementById('citaVehiculo').value,
        fecha:       document.getElementById('citaFecha').value,     // "2026-11-25T10:00"
        descripcion: document.getElementById('citaDescripcion').value
    };

    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'insert', data: datos };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            ocultarFormCita();                                       // Cerramos el formulario
            cargarCitas();                                           // y aparece la tarjeta nueva en "Pendiente"
        } else {
            msg.className = 'msg error';                             // Se queda abierto con el error
            msg.innerHTML = response.msg;
        }
    })
    .catch(function (error) {
        msg.className = 'msg error';
        msg.innerHTML = 'Error de conexión con el servidor.';
        console.error('Error:', error);
    });
}

var facturas = [];                                                   // Guardamos la lista para el "Ver factura"

function cargarFacturas() {
    var url  = '../../BackEnd/sw/factura_sw.php';
    var data = { action: 'get' };                                    // El servidor filtra por el cliente de la sesión

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var tbody = document.getElementById('tablaFacturas');
        tbody.innerHTML = '';

        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="6">' + response.msg + '</td></tr>';
            return;
        }
        facturas = response.data;
        if (facturas.length == 0) {
            tbody.innerHTML = '<tr><td colspan="6">No tienes facturas todavía.</td></tr>';
            return;
        }

        for (var i = 0; i < facturas.length; i++) {                  // Una fila por factura
            var f = facturas[i];
            tbody.innerHTML +=
                '<tr>' +
                    '<td>F-' + f.id_factura + '</td>' +
                    '<td>' + formatearFechaCorta(f.fecha) + '</td>' +
                    '<td><span class="placa">' + f.matricula + '</span></td>' +     // Del JOIN con vehiculo
                    '<td>' + f.descripcion + '</td>' +                               // Concepto = motivo de la cita
                    '<td class="total">' + euros(f.total) + '</td>' +
                    '<td><button type="button" class="btn-sec" onclick="verFactura(' + f.id_factura + ')">Ver factura</button></td>' +
                '</tr>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function verFactura(id) {                                            // Botón "Ver factura"
    var f = null;
    for (var i = 0; i < facturas.length; i++) {                      // La buscamos en la lista ya cargada
        if (facturas[i].id_factura == id) {
            f = facturas[i];
        }
    }
    if (f == null) return;

    var panel = document.getElementById('detalleFactura');
    panel.innerHTML =
        '<h3>Factura F-' + f.id_factura + ' · ' + formatearFechaCorta(f.fecha) + '</h3>' +
        '<div class="linea"><span>Mano de obra</span><span>'   + euros(f.mano_obra)      + '</span></div>' +
        '<div class="linea"><span>Repuestos</span><span>'      + euros(f.repuestos)      + '</span></div>' +
        '<div class="linea"><span>Base imponible</span><span>' + euros(f.base_imponible) + '</span></div>' +
        '<div class="linea"><span>IVA (21 %)</span><span>'     + euros(f.iva)            + '</span></div>' +
        '<div class="linea final"><span>Total</span><span>'    + euros(f.total)          + '</span></div>' +
        '<div class="acciones"><button type="button" class="btn-sec" onclick="cerrarFactura()">Cerrar</button></div>';
    panel.classList.remove('oculto');
}

function cerrarFactura() {
    document.getElementById('detalleFactura').classList.add('oculto');
}

function euros(cantidad) {                                           // 91.36 → "91,36 €"
    return Number(cantidad).toFixed(2).replace('.', ',') + ' €';
}

function formatearFechaCorta(fecha) {                                // "2026-11-03" → "03/11/2026"
    var dia = fecha.split('-');
    return dia[2] + '/' + dia[1] + '/' + dia[0];
}