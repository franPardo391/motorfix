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
        cargarSelectClientes();                                      // Selects de clientes + tabla de vehículos
        cargarMecanicos();  
        cargarFacturar();                                            // Citas finalizadas sin factura
                                         // Mecánicos y, después, la tabla de citas

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
                    '<button type="button" class="btn-sec" onclick="verVehiculosCliente(' + c.id_cliente + ')">Vehículos</button>' + 
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

function mostrarFormCliente() {                                      // Botón "Nuevo cliente"
    limpiarFormCliente();
    document.getElementById('tituloFormCliente').innerHTML = 'Nuevo cliente';
    document.getElementById('formCliente').classList.remove('oculto');    // Quita display:none → se ve
}

function ocultarFormCliente() {                                      // Botón "Cancelar"
    document.getElementById('formCliente').classList.add('oculto');
}

function limpiarFormCliente() {                                      // Deja todos los campos en blanco
    document.getElementById('id_cliente').value = '';                // Sin id → al guardar será un insert
    document.getElementById('dni').value        = '';
    document.getElementById('nombre').value     = '';
    document.getElementById('telefono').value   = '';
    document.getElementById('direccion').value  = '';
    document.getElementById('msgCliente').innerHTML = '';
}

function editarCliente(id) {                                         // Botón "Editar" de cada fila
    var c = null;
    for (var i = 0; i < clientes.length; i++) {                      // Lo buscamos en la lista ya cargada
        if (clientes[i].id_cliente == id) {
            c = clientes[i];
        }
    }
    if (c == null) return;

    limpiarFormCliente();
    document.getElementById('id_cliente').value = c.id_cliente;      // Con id → al guardar será un update
    document.getElementById('dni').value        = c.dni;
    document.getElementById('nombre').value     = c.nombre;
    document.getElementById('telefono').value   = c.telefono;
    document.getElementById('direccion').value  = c.direccion;
    document.getElementById('tituloFormCliente').innerHTML = 'Editar cliente';
    document.getElementById('formCliente').classList.remove('oculto');
}

function guardarCliente() {                                          // Botón "Guardar"
    var msg = document.getElementById('msgCliente');
    var id  = document.getElementById('id_cliente').value;           // Vacío = nuevo, con número = editar

    var datos = {                                                    // Mismas claves que lee cliente_sw.php
        dni:       document.getElementById('dni').value,
        nombre:    document.getElementById('nombre').value,
        telefono:  document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value
    };

    var action = 'insert';
    if (id != '') {
        action = 'update';
        datos.id_cliente = id;                                       // El servicio necesita saber cuál
    }

    var url  = '../../BackEnd/sw/cliente_sw.php';
    var data = { action: action, data: datos };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            ocultarFormCliente();                                    // Todo OK: cerramos el formulario
            cargarClientes();                                        // y repintamos la tabla
            cargarSelectClientes();                                  // Los selects de Vehículos también cambian    
        } else {
            msg.className = 'msg error';                             // "Ya existe un cliente con ese DNI."...
            msg.innerHTML = response.msg;
        }
    })
    .catch(function (error) {
        msg.className = 'msg error';
        msg.innerHTML = 'Error de conexión con el servidor.';
        console.error('Error:', error);
    });
}

function borrarCliente(id) {                                         // Botón "Borrar" de cada fila
    if (!confirm('¿Seguro que quieres borrar este cliente?')) {
        return;                                                      // Si pulsa Cancelar, no hacemos nada
    }

    var url  = '../../BackEnd/sw/cliente_sw.php';
    var data = { action: 'delete', data: { id_cliente: id } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            cargarClientes();                                        // La fila desaparece
            cargarSelectClientes();                                  // Los selects de Vehículos también cambian            
        } else {
            alert(response.msg);                                     // "Este cliente tiene cuenta web..."
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

var todosClientes = [];                                              // Lista completa (la de la tabla puede estar filtrada por DNI)

function cargarSelectClientes() {
    var url  = '../../BackEnd/sw/cliente_sw.php';
    var data = { action: 'get' };                                    // Sin dni: todos

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (!response.success) return;
        todosClientes = response.data;

        var filtro = document.getElementById('filtroCliente');
        var select = document.getElementById('vehiculoCliente');
        filtro.innerHTML = '<option value="">Todos los clientes</option>';   // Valor vacío = sin filtro
        select.innerHTML = '';
        for (var i = 0; i < todosClientes.length; i++) {
            var c = todosClientes[i];
            var opcion = '<option value="' + c.id_cliente + '">' + c.nombre + ' (' + c.dni + ')</option>';
            filtro.innerHTML += opcion;                              // El mismo option en los dos selects
            select.innerHTML += opcion;
        }
        cargarVehiculos();                                           // Con los nombres ya cargados, pintamos la tabla
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function nombreCliente(id) {                                         // id_cliente → nombre, para la columna Cliente
    for (var i = 0; i < todosClientes.length; i++) {
        if (todosClientes[i].id_cliente == id) {
            return todosClientes[i].nombre;
        }
    }
    return '-';
}

var vehiculos = [];                                                  // Guardamos la lista para usarla al editar

function cargarVehiculos() {
    var url  = '../../BackEnd/sw/vehiculo_sw.php';
    var data = { action: 'get', data: { id_cliente: document.getElementById('filtroCliente').value } };  // Vacío = todos

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var tbody = document.getElementById('tablaVehiculos');
        tbody.innerHTML = '';

        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="6">' + response.msg + '</td></tr>';
            return;
        }
        vehiculos = response.data;
        if (vehiculos.length == 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay vehículos.</td></tr>';
            return;
        }
        for (var i = 0; i < vehiculos.length; i++) {
            var v = vehiculos[i];
            tbody.innerHTML += '<tr>' +
                '<td><span class="placa">' + v.matricula + '</span></td>' +
                '<td>' + v.marca + '</td>' +
                '<td>' + v.modelo + '</td>' +
                '<td>' + nombreCliente(v.id_cliente) + '</td>' +
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

function verVehiculosCliente(id) {                                   // Botón "Vehículos" de la tabla de clientes
    document.getElementById('filtroCliente').value = id;             // Elegimos ese cliente en el filtro
    mostrarSeccion('Vehiculos');                                     // Cambiamos de pestaña
    cargarVehiculos();                                               // y pintamos solo sus coches
}

function mostrarFormVehiculo() {                                     // Botón "Nuevo vehículo"
    limpiarFormVehiculo();
    var filtro = document.getElementById('filtroCliente').value;
    if (filtro != '') {
        document.getElementById('vehiculoCliente').value = filtro;   // Si hay un cliente filtrado, lo dejamos elegido
    }
    document.getElementById('tituloFormVehiculo').innerHTML = 'Nuevo vehículo';
    document.getElementById('formVehiculo').classList.remove('oculto');
}

function ocultarFormVehiculo() {                                     // Botón "Cancelar"
    document.getElementById('formVehiculo').classList.add('oculto');
}

function limpiarFormVehiculo() {
    document.getElementById('id_vehiculo').value = '';               // Sin id → insert
    document.getElementById('matricula').value   = '';
    document.getElementById('marca').value       = '';
    document.getElementById('modelo').value      = '';
    document.getElementById('anio').value        = '';
    document.getElementById('kilometraje').value = '';
    document.getElementById('vehiculoCliente').disabled = false;     // Al crear sí se elige el dueño
    document.getElementById('msgVehiculo').innerHTML = '';
}

function editarVehiculo(id) {                                        // Botón "Editar" de cada fila
    var v = null;
    for (var i = 0; i < vehiculos.length; i++) {
        if (vehiculos[i].id_vehiculo == id) {
            v = vehiculos[i];
        }
    }
    if (v == null) return;

    limpiarFormVehiculo();
    document.getElementById('id_vehiculo').value     = v.id_vehiculo;     // Con id → update
    document.getElementById('vehiculoCliente').value = v.id_cliente;
    document.getElementById('vehiculoCliente').disabled = true;           // El dueño no se cambia al editar
    document.getElementById('matricula').value   = v.matricula;
    document.getElementById('marca').value       = v.marca;
    document.getElementById('modelo').value      = v.modelo;
    document.getElementById('anio').value        = v.anio;
    document.getElementById('kilometraje').value = v.kilometraje;
    document.getElementById('tituloFormVehiculo').innerHTML = 'Editar vehículo';
    document.getElementById('formVehiculo').classList.remove('oculto');
}

function guardarVehiculo() {                                         // Botón "Guardar"
    var msg = document.getElementById('msgVehiculo');
    var id  = document.getElementById('id_vehiculo').value;

    var datos = {                                                    // Mismas claves que lee vehiculo_sw.php
        matricula:   document.getElementById('matricula').value,
        marca:       document.getElementById('marca').value,
        modelo:      document.getElementById('modelo').value,
        anio:        document.getElementById('anio').value,
        kilometraje: document.getElementById('kilometraje').value
    };

    var action = 'insert';
    if (id == '') {
        datos.id_cliente = document.getElementById('vehiculoCliente').value;   // Insert: Oficina dice de quién es
    } else {
        action = 'update';
        datos.id_vehiculo = id;                                      // Update: el dueño lo saca el servidor de la BD
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
            ocultarFormVehiculo();
            cargarVehiculos();
        } else {
            msg.className = 'msg error';                             // "Ya existe un vehículo con esa matrícula."...
            msg.innerHTML = response.msg;
        }
    })
    .catch(function (error) {
        msg.className = 'msg error';
        msg.innerHTML = 'Error de conexión con el servidor.';
        console.error('Error:', error);
    });
}

function borrarVehiculo(id) {                                        // Botón "Borrar" de cada fila
    if (!confirm('¿Seguro que quieres borrar este vehículo?')) {
        return;
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
            cargarVehiculos();
        } else {
            alert(response.msg);
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}
// ===== CITAS =====
var mecanicos = [];                                                  // Para el <select> de cada fila
var citas     = [];
var ESTADOS = ['Pendiente', 'Asignada', 'En reparacion', 'Finalizada'];   // Como en la BD
var TEXTOS  = ['Pendiente', 'Asignada', 'En reparación', 'Finalizada'];   // Como se ven en pantalla
var CLASES  = ['pendiente', 'asignada', 'reparacion', 'finalizada'];      // Clase CSS del cuadradito

function cargarMecanicos() {
    var url  = '../../BackEnd/sw/usuario_sw.php';
    var data = { action: 'get' };                                    // El servidor ya filtra rol = 'Mecanico'

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            mecanicos = response.data;
        }
        cargarCitas();                                               // Ahora sí: los selects ya tienen opciones
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function cargarCitas() {
    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'get', data: { estado: document.getElementById('filtroEstado').value } };  // Vacío = todas

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var tbody = document.getElementById('tablaCitas');
        tbody.innerHTML = '';

        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="7">' + response.msg + '</td></tr>';
            return;
        }
        citas = response.data;
        if (citas.length == 0) {
            tbody.innerHTML = '<tr><td colspan="7">No hay citas.</td></tr>';
            return;
        }
        for (var i = 0; i < citas.length; i++) {
            var c   = citas[i];
            var pos = ESTADOS.indexOf(c.estado);                     // Posición del estado: 0, 1, 2 o 3
            var mecanico = nombreMecanico(c.id_mecanico);            // En reparación/Finalizada: solo el nombre
            var boton    = '';
            if (c.estado == 'Pendiente') {                           // Sin mecánico: select + "Asignar"
                mecanico = selectMecanicos(c.id_cita, c.id_mecanico);
                boton    = '<button type="button" class="btn-prim" onclick="asignarMecanico(' + c.id_cita + ')">Asignar</button>';
            } else if (c.estado == 'Asignada') {                     // Ya tiene: select con el suyo + "Cambiar"
                mecanico = selectMecanicos(c.id_cita, c.id_mecanico);
                boton    = '<button type="button" class="btn-sec" onclick="asignarMecanico(' + c.id_cita + ')">Cambiar</button>';
            }
            tbody.innerHTML += '<tr>' +
                '<td>' + formatearFecha(c.fecha) + '</td>' +
                '<td><span class="placa">' + c.matricula + '</span></td>' +
                '<td>' + c.cliente + '</td>' +
                '<td>' + c.descripcion + '</td>' +
                '<td><span class="cuadro ' + CLASES[pos] + '"></span>' + TEXTOS[pos] + '</td>' +
                '<td>' + mecanico + '</td>' +
                '<td>' + boton + '</td>' +
            '</tr>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function selectMecanicos(id_cita, id_mecanico) {                     // <select id="mecanico2"> con todos los mecánicos
    var html = '<select id="mecanico' + id_cita + '">' +
               '<option value="">Elegir mecánico</option>';
    for (var i = 0; i < mecanicos.length; i++) {
        var m = mecanicos[i];
        var marcado = (m.id_usuario == id_mecanico) ? ' selected' : '';   // El que ya tiene, elegido
        html += '<option value="' + m.id_usuario + '"' + marcado + '>' + m.nombre + '</option>';
    }
    return html + '</select>';
}

function nombreMecanico(id) {                                        // id_mecanico → nombre
    for (var i = 0; i < mecanicos.length; i++) {
        if (mecanicos[i].id_usuario == id) return mecanicos[i].nombre;
    }
    return '-';                                                      // NULL: sin mecánico
}

function formatearFecha(fecha) {                                     // "2026-11-25 10:00:00" → "25/11/2026 10:00"
    var partes = fecha.split(' ');
    var dia    = partes[0].split('-');
    return dia[2] + '/' + dia[1] + '/' + dia[0] + ' ' + partes[1].substring(0, 5);
}
function asignarMecanico(id) {                                       // Botón "Asignar" o "Cambiar" de la fila
    var msg = document.getElementById('msgCita');
    var id_mecanico = document.getElementById('mecanico' + id).value;   // El select de ESA fila

    if (id_mecanico == '') {                                         // Comodidad: el servidor también lo valida
        msg.className = 'msg error';
        msg.innerHTML = 'Elige un mecánico.';
        return;
    }

    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'update', data: { id_cita: id, id_mecanico: id_mecanico } };   // Solo los dos ids

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        if (response.success) {
            msg.className = 'msg ok';
            cargarCitas();                                           // Repintamos: pasa a Asignada con "Cambiar"
        } else {
            msg.className = 'msg error';
        }
        msg.innerHTML = response.msg;                                // El mensaje lo pone el servidor
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

// ===== FACTURACIÓN =====
var porFacturar = [];

function cargarFacturar() {
    var url  = '../../BackEnd/sw/cita_sw.php';
    var data = { action: 'get', data: { estado: 'Finalizada', sin_factura: true } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var lista = document.getElementById('listaFacturar');
        lista.innerHTML = '';
        if (!response.success) {
            lista.innerHTML = '<p class="msg error">' + response.msg + '</p>';
            return;
        }
        porFacturar = response.data;
        if (porFacturar.length == 0) {
            lista.innerHTML = '<p>No hay reparaciones pendientes de facturar.</p>';
            return;
        }
        for (var i = 0; i < porFacturar.length; i++) {
            var c = porFacturar[i];
            lista.innerHTML +=
                '<div class="tarjeta" id="facturar' + c.id_cita + '">' +
                    '<div class="info">' +
                        '<span class="placa">' + c.matricula + '</span>' +
                        '<div>' +
                            '<strong>' + c.cliente + '</strong>' +
                            '<p class="detalle">' + c.descripcion + ', ' + c.horas + ' h</p>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="btn-sec" onclick="prepararFactura(' + c.id_cita + ')">Preparar factura</button>' +
                '</div>';
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function prepararFactura(id) {                                       // Pide al servidor los importes (no se guarda nada)
    var c = null;
    for (var i = 0; i < porFacturar.length; i++) {
        document.getElementById('facturar' + porFacturar[i].id_cita).classList.remove('elegida');
        if (porFacturar[i].id_cita == id) c = porFacturar[i];
    }
    document.getElementById('facturar' + id).classList.add('elegida');

    var url  = '../../BackEnd/sw/factura_sw.php';
    var data = { action: 'preparar', data: { id_cita: id } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var msg = document.getElementById('msgFactura');
        if (!response.success) {
            msg.className = 'msg error';
            msg.innerHTML = response.msg;
            return;
        }
        msg.innerHTML = '';
        var f = response.data[0];                                    // Importes calculados por Factura::calcularTotales()
        var panel = document.getElementById('panelFactura');
        panel.innerHTML =
            '<h3>Nueva factura</h3>' +
            '<p><span class="placa">' + c.matricula + '</span></p>' +
            '<p class="detalle">Cliente: ' + c.cliente + ' · Fecha: ' + formatearFechaCorta(f.fecha) + '</p>' +
            '<div class="linea"><span>Mano de obra (' + f.horas + ' h a ' + f.precio_hora + ' €/h)</span><span>' + euros(f.mano_obra) + '</span></div>' +
            '<div class="linea"><span>Repuestos</span><span>'  + euros(f.repuestos)      + '</span></div>' +
            '<div class="linea"><span>Subtotal</span><span>'   + euros(f.base_imponible) + '</span></div>' +
            '<div class="linea"><span>IVA (21 %)</span><span>' + euros(f.iva)            + '</span></div>' +
            '<div class="linea final"><span>Total</span><span>' + euros(f.total)         + '</span></div>' +
            '<button type="button" class="btn-prim btn-ancho" onclick="emitirFactura(' + id + ')">Emitir factura</button>';
        panel.classList.remove('oculto');
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function emitirFactura(id) {                                         // Ahora sí: se guarda en la BD
    if (!confirm('¿Emitir la factura? Después no se podrá modificar la reparación.')) return;

    var url  = '../../BackEnd/sw/factura_sw.php';
    var data = { action: 'insert', data: { id_cita: id } };

    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function (res) { return res.json(); })
    .then(function (response) {
        var msg = document.getElementById('msgFactura');
        if (response.success) {
            msg.className = 'msg ok';
            msg.innerHTML = response.msg + ' (F-' + response.data[0].id_factura + ')';
            document.getElementById('panelFactura').classList.add('oculto');
            cargarFacturar();                                        // La cita desaparece de la lista
        } else {
            msg.className = 'msg error';
            msg.innerHTML = response.msg;
        }
    })
    .catch(function (error) {
        console.error('Error:', error);
    });
}

function euros(cantidad) {                                           // 91.36 → "91,36 €" (igual que en cliente.js)
    return Number(cantidad).toFixed(2).replace('.', ',') + ' €';
}

function formatearFechaCorta(fecha) {                                // "2026-11-23" → "23/11/2026"
    var dia = fecha.split('-');
    return dia[2] + '/' + dia[1] + '/' + dia[0];
}
