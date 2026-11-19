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
