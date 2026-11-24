<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Usuario.php';                         // Modelo que vamos a usar
require DIR_CLASES . 'Cliente.php';                         // Para saber si un usuario tiene ficha de cliente

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
        case 'update':                                                // Admin: cambiar el rol de un usuario
            if ($rol != 'Administrador') {                            // Oficina solo puede listar mecánicos
                throw new Exception('Solo el administrador puede cambiar roles.');
            }
            $id_usuario = isset($arrData['id_usuario']) ? $arrData['id_usuario'] : null;
            $nuevo_rol  = isset($arrData['rol'])        ? $arrData['rol']        : '';

            if (empty($id_usuario)) {
                throw new Exception('Usuario no encontrado.');
            }
            if ($id_usuario == $_SESSION['id_usuario']) {             // Para no quedarse sin acceso
                throw new Exception('No puedes cambiar tu propio rol.');
            }
            if (!in_array($nuevo_rol, ['Administrador', 'Oficina', 'Mecanico', 'Cliente'])) {
                throw new Exception('Rol no válido.');                // Solo los 4 del ENUM
            }
            $encontrados = Usuario::getArray(['id_usuario' => $id_usuario]);
            if (count($encontrados) == 0) {
                throw new Exception('Usuario no encontrado.');
            }
            if ($nuevo_rol == 'Cliente' && count(Cliente::getArray(['id_usuario' => $id_usuario])) == 0) {
                throw new Exception('Este usuario no tiene ficha de cliente.');   // Entraría y no vería nada
            }

            $u = $encontrados[0];
            $usuario = new Usuario($u['id_usuario'], $u['nombre'], $u['email'], null, $nuevo_rol);  // Nombre y email: de la BD
            $usuario->update();                                       // update() no toca la contraseña
            $datos = [['id_usuario' => $id_usuario]];
            $msg   = 'Rol actualizado correctamente.';
            break;
        case 'insert':                                                // Admin: nuevo usuario del taller
            if ($rol != 'Administrador') {
                throw new Exception('Solo el administrador puede crear usuarios.');
            }
            $nombre    = isset($arrData['nombre'])   ? trim($arrData['nombre']) : '';
            $email     = isset($arrData['email'])    ? trim($arrData['email'])  : '';
            $password  = isset($arrData['password']) ? $arrData['password']    : '';
            $nuevo_rol = isset($arrData['rol'])      ? $arrData['rol']          : '';

            if (!in_array($nuevo_rol, ['Administrador', 'Oficina', 'Mecanico'])) {   // Cliente no: necesita ficha
                throw new Exception('Elige un rol: Administrador, Oficina o Mecánico.');
            }
            $usuario = new Usuario(null, $nombre, $email, $password, $nuevo_rol);
            $id = $usuario->insert();                                 // Valida, cifra con BCrypt y guarda
            $datos = [['id_usuario' => $id]];
            $msg   = 'Usuario creado correctamente.';
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
