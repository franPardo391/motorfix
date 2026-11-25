<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Cita.php';                            // Modelo principal de este servicio
require DIR_CLASES . 'Vehiculo.php';                        // Para comprobar que el coche es del cliente
require DIR_CLASES . 'Cliente.php';                         // Para saber qué cliente es el usuario
require DIR_CLASES . 'Usuario.php';                         // Para comprobar que el id_mecanico es un mecánico
require DIR_CLASES . 'Factura.php';                         // Para no tocar citas ya facturadas

$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get', 'insert' o 'update'
$arrData = isset($data['data'])   ? $data['data']   : array();   // Campos del formulario

$success = true;                                            // Respuesta por defecto
$msg     = '';
$datos   = [];

try {
    $rol = $_SESSION['rol'];                                          // Rol guardado en el login
    if ($rol == 'Cliente') {                                          // El cliente solo ve SUS citas
        $clientes = Cliente::getArray(['id_usuario' => $_SESSION['id_usuario']]);
        if (count($clientes) == 0) {
            throw new Exception('No existe ficha de cliente para este usuario.');
        }
        $id_cliente = $clientes[0]['id_cliente'];                     // Sale de la sesión, no del navegador
    } elseif ($rol == 'Oficina' || $rol == 'Administrador') {        // Ven las citas de todos
        $id_cliente = isset($arrData['id_cliente']) ? $arrData['id_cliente'] : null;
    } elseif ($rol == 'Mecanico') {                                   // Ve solo las citas asignadas a él
        $id_cliente = null;                                           // No filtra por cliente, sino por mecánico
    } else {
        throw new Exception('No tienes permiso para gestionar citas.');
    }

    switch ($action) {

        case 'get':                                                   // Listar citas
            $filtros = [];
            if (!empty($id_cliente)) {                                // Cliente: solo las suyas
                $filtros['id_cliente'] = $id_cliente;
            }
            if (!empty($arrData['estado'])) {                         // Select "Todos los estados" de Oficina
                $filtros['estado'] = $arrData['estado'];              // Cita::getArray ya tiene este filtro
            }
            if ($rol == 'Mecanico') {                                 // Su hoja de trabajo
                $filtros['id_mecanico'] = $_SESSION['id_usuario'];    // Sale de la sesión, no del navegador
            }
            if (!empty($arrData['sin_factura'])) {                    // Pestaña Facturación de Oficina
                $filtros['sin_factura'] = true;
            }

            $datos = Cita::getArray($filtros);                        // Con JOIN: matrícula, coche, km, cliente y si tiene factura
            $msg   = 'Listado de citas.';
            break;

        case 'insert':                                                // Pedir cita
            if ($rol == 'Mecanico') {                                 // Las citas las pide el cliente
                throw new Exception('No tienes permiso para pedir citas.');
            }
            $id_vehiculo = isset($arrData['id_vehiculo']) ? $arrData['id_vehiculo'] : null;
            $fecha       = isset($arrData['fecha'])       ? str_replace('T', ' ', $arrData['fecha']) : '';  // "2026-11-20T10:00" → "2026-11-20 10:00"
            $descripcion = isset($arrData['descripcion']) ? trim($arrData['descripcion']) : '';

            if (empty($id_vehiculo)) {
                throw new Exception('Elige el vehículo para la cita.');
            }
            $filtros = ['id_vehiculo' => $id_vehiculo];               // Comprobamos que el coche existe...
            if (!empty($id_cliente)) {
                $filtros['id_cliente'] = $id_cliente;                 // ...y si es Cliente, que sea SUYO
            }
            if (count(Vehiculo::getArray($filtros)) == 0) {
                throw new Exception('Vehículo no encontrado.');
            }
            if (empty($descripcion)) {
                throw new Exception('Describe el motivo de la cita.');
            }
            if (empty($fecha) || strtotime($fecha) <= time()) {       // Sin fecha o fecha ya pasada
            throw new Exception('Elige una fecha y hora a partir de ahora.');
            }

            $cita = new Cita(null, $fecha, $descripcion, null, null, null, null, $id_vehiculo, null);  // Sin estado ni mecánico
            $id = $cita->insert();                                    // El modelo la crea como 'Pendiente'
            $datos = [['id_cita' => $id]];
            $msg   = 'Cita solicitada correctamente. El taller la revisará.';
            break;
        case 'update':                                                // Oficina: asignar mecánico · Mecánico: estado, horas y piezas
            if ($rol == 'Cliente') {                                  // El cliente no puede tocar citas
                throw new Exception('No tienes permiso para modificar citas.');
            }
            $id_cita     = isset($arrData['id_cita'])     ? $arrData['id_cita']     : null;
            $id_mecanico = isset($arrData['id_mecanico']) ? $arrData['id_mecanico'] : null;

            if (empty($id_cita)) {                                    // Sin id, getArray devolvería TODAS
                throw new Exception('Cita no encontrada.');
            }
            $encontradas = Cita::getArray(['id_cita' => $id_cita]);   // Comprobamos que existe
            if (count($encontradas) == 0) {
                throw new Exception('Cita no encontrada.');
            }
            $actual = $encontradas[0];                                // La cita tal como está en la BD

            if ($rol == 'Mecanico') {                                 // Mecánico: estado, horas, piezas e importe
                if ($actual['id_mecanico'] != $_SESSION['id_usuario']) {
                    throw new Exception('Cita no encontrada.');       // No es suya: como si no existiera
                }
                if (count(Factura::getArray(['id_cita' => $id_cita])) > 0) {
                    throw new Exception('Esta cita ya está facturada y no se puede modificar.');
                }
                $estado  = isset($arrData['estado']) ? $arrData['estado'] : '';
                $horas   = !empty($arrData['horas']) ? $arrData['horas'] : 0;                        // Vacío → 0
                $importe = !empty($arrData['importe_repuesto']) ? $arrData['importe_repuesto'] : 0;  // Vacío → 0
                $piezas  = isset($arrData['piezas']) ? trim($arrData['piezas']) : '';

                if ($estado != 'Asignada' && $estado != 'En reparacion' && $estado != 'Finalizada') {
                    throw new Exception('Estado no válido.');         // Pendiente no: eso es cosa de Oficina
                }
                if (!is_numeric($horas) || $horas < 0) {
                    throw new Exception('Las horas deben ser un número igual o mayor que 0.');
                }
                if (!is_numeric($importe) || $importe < 0) {
                    throw new Exception('El importe de repuestos debe ser un número igual o mayor que 0.');
                }

                $cita = new Cita($actual['id_cita'], $actual['fecha'], $actual['descripcion'], $estado,
                                 $horas, $piezas, $importe,
                                 $actual['id_vehiculo'], $actual['id_mecanico']);   // Fecha, vehículo y mecánico: de la BD
                $cita->update();
                $datos = [['id_cita' => $id_cita]];
                $msg   = 'Cambios guardados.';
                break;                                                // Sale del switch: no sigue con lo de Oficina
            }

            if ($actual['estado'] != 'Pendiente' && $actual['estado'] != 'Asignada') {
                throw new Exception('Solo se puede asignar mecánico a citas pendientes o asignadas.');
            }
            if (empty($id_mecanico) || count(Usuario::getArray(['id_usuario' => $id_mecanico, 'rol' => 'Mecanico'])) == 0) {
                throw new Exception('Elige un mecánico.');            // Vacío o no es un mecánico de verdad
            }

            $cita = new Cita($actual['id_cita'], $actual['fecha'], $actual['descripcion'], 'Asignada',
                             $actual['horas'], $actual['piezas'], $actual['importe_repuesto'],
                             $actual['id_vehiculo'], $id_mecanico);   // Todo de la BD menos estado y mecánico
            $cita->update();
            $datos = [['id_cita' => $id_cita]];
            $msg   = 'Mecánico asignado correctamente.';
            break;

        default:                                                      // Acción que no existe
            $success = false;
            $msg     = 'Acción no soportada.';
    }
} catch (PDOException $e) {                                           // Error de MySQL que no hemos previsto
    $success = false;
    $msg     = 'Error en la base de datos. Inténtalo de nuevo.';      // Nunca el texto técnico de MySQL
} catch (Exception $e) {                                              // Cualquier throw acaba aquí
    $success = false;
    $msg     = $e->getMessage();
}

echo json_encode(array(                                               // Único echo: el JSON final
    'success' => $success,
    'msg'     => $msg,
    'data'    => $datos
));
exit();