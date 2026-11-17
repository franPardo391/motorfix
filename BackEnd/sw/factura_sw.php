<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Factura.php';                         // Modelo de este servicio
require DIR_CLASES . 'Cliente.php';                         // Para saber qué cliente es el usuario

$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get'...
$arrData = isset($data['data'])   ? $data['data']   : array();   // Datos que mande la vista

$success = true;                                            // Respuesta por defecto
$msg     = '';
$datos   = [];

try {
    $rol = $_SESSION['rol'];                                          // Rol guardado en el login
    if ($rol == 'Cliente') {                                          // El cliente solo ve SUS facturas
        $clientes = Cliente::getArray(['id_usuario' => $_SESSION['id_usuario']]);
        if (count($clientes) == 0) {
            throw new Exception('No existe ficha de cliente para este usuario.');
        }
        $id_cliente = $clientes[0]['id_cliente'];                     // Sale de la sesión, no del navegador
    } elseif ($rol == 'Oficina' || $rol == 'Administrador') {        // Ven las facturas de todos
        $id_cliente = isset($arrData['id_cliente']) ? $arrData['id_cliente'] : null;
    } else {
        throw new Exception('No tienes permiso para ver facturas.');  // Mecánico: no factura
    }

    switch ($action) {

        case 'get':                                                   // Listar facturas
            $filtros = [];
            if (!empty($id_cliente)) {                                // Cliente: solo las suyas
                $filtros['id_cliente'] = $id_cliente;
            }
            $datos = Factura::getArray($filtros);                     // Con JOIN: concepto y matrícula
            $msg   = 'Listado de facturas.';
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