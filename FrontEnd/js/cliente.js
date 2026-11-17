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
        cargarVehiculos();                                           // Con la sesión OK, pedimos sus vehículos
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