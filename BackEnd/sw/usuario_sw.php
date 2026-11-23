<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Usuario.php';                         // Modelo que vamos a usar

$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get'...
$arrData = isset($data['data'])   ? $data['data']   : array();   // Filtros o campos del formulario

$success = true;                                            // Respuesta por defecto
$msg     = '';
$datos   = [];

try {
    $rol = $_SESSION['rol'];                                          // Rol guardado en el login
    if ($rol != 'Oficina' && $rol != 'Administrador') {               // Cliente y Mecánico no ven usuarios
        throw new Exception('No tienes permiso para ver usuarios.');
    }

    switch ($action) {

        case 'get':                                                   // Listar usuarios
            $filtros = [];
            if ($rol == 'Oficina') {                                  // Oficina SOLO puede ver mecánicos
                $filtros['rol'] = 'Mecanico';                         // Lo fija el servidor, no el navegador
            } elseif (!empty($arrData['rol'])) {                      // Administrador: filtro opcional
                $filtros['rol'] = $arrData['rol'];
            }
            $datos = Usuario::getArray($filtros);                     // Nunca devuelve el password
            $msg   = 'Listado de usuarios.';
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
