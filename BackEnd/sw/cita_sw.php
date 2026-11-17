<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Cita.php';                            // Modelo principal de este servicio
require DIR_CLASES . 'Vehiculo.php';                        // Para comprobar que el coche es del cliente
require DIR_CLASES . 'Cliente.php';                         // Para saber qué cliente es el usuario

$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get', 'insert'...
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
    } else {
        throw new Exception('No tienes permiso para gestionar citas.');      // Mecánico: lo añadiremos en S5
    }
    switch ($action) {

        case 'get':                                                   // Listar citas
            $filtros = [];
            if (!empty($id_cliente)) {                                // Cliente: solo las suyas
                $filtros['id_cliente'] = $id_cliente;
            }
            $datos = Cita::getArray($filtros);                        // Con JOIN: trae matrícula, marca y modelo
            $msg   = 'Listado de citas.';
            break;

        case 'insert':                                                // Pedir cita
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

            $cita = new Cita(null, $fecha, $descripcion, null, null, null, null, $id_vehiculo, null);  // Sin estado ni mecánico
            $id = $cita->insert();                                    // El modelo la crea como 'Pendiente'
            $datos = [['id_cita' => $id]];
            $msg   = 'Cita solicitada correctamente. El taller la revisará.';
            break;

        default:                                                      // Acción que no existe
            $success = false;
            $msg     = 'Acción no soportada.';
    }
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