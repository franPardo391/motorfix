<?php
session_start();                                           // Inicia la sesión o recupera la que ya existe
header('Content-Type: application/json; charset=utf-8');  // Avisa al navegador de que la respuesta es JSON

require __DIR__ . '/../conf.php';                          // Carga conf.php (datos de la BD y DIR_CLASES)
require DIR_CLASES . 'Usuario.php';                        // Carga el modelo Usuario (lo usan login y registro)
require DIR_CLASES . 'Cliente.php';                        // Carga el modelo Cliente (lo usa el registro)

$data    = json_decode(file_get_contents('php://input'), true);  // Lee el JSON que manda fetch() y lo convierte en array
$action  = isset($data['action']) ? $data['action'] : null;      // Qué nos piden: 'login', 'registro' o 'logout'
$arrData = isset($data['data'])   ? $data['data']   : array();   // Los campos del formulario (email, password...)


$success = true;                                   // Valores por defecto de la respuesta
$msg     = '';
$datos   = [];

try {
    switch ($action) {

        case 'login':
            $email    = isset($arrData['email'])    ? trim($arrData['email']) : '';   // Email del formulario (sin espacios)
            $password = isset($arrData['password']) ? $arrData['password']    : '';   // Contraseña tal cual la escribió

            if (empty($email) || empty($password)) {
                throw new Exception('Email y contraseña son obligatorios.');          // Salta directo al catch
            }

            $usuario = new Usuario();                                                  // Objeto vacío
            if (!$usuario->login($email, $password)) {                                 // Tu método: busca por email y usa password_verify
                throw new Exception('Email o contraseña incorrectos.');                // No decimos cuál de los dos falla
            }

            $_SESSION['id_usuario'] = $usuario->id_usuario;                            // Guarda quién es: esto marca "logueado" (Tema 2)
            $_SESSION['rol']        = $usuario->rol;                                   // Su rol, para controlar permisos
            $_SESSION['nombre']     = $usuario->nombre;                                // Para saludarle en el panel

            $msg   = 'Bienvenido, ' . $usuario->nombre . '.';
            $datos = [[                                                                // data = array de resultados (Tema 2)
                'id_usuario' => $usuario->id_usuario,
                'nombre'     => $usuario->nombre,
                'rol'        => $usuario->rol                                          // La vista lo usará para ir a su panel
            ]];
            break;
        case 'registro':
            $nombre    = isset($arrData['nombre'])    ? trim($arrData['nombre'])          : '';  // Campos del formulario
            $email     = isset($arrData['email'])     ? trim($arrData['email'])           : '';
            $password  = isset($arrData['password'])  ? $arrData['password']              : '';
            $dni       = isset($arrData['dni'])       ? strtoupper(trim($arrData['dni'])) : '';  // DNI en mayúsculas
            $telefono  = isset($arrData['telefono'])  ? trim($arrData['telefono'])        : '';
            $direccion = isset($arrData['direccion']) ? trim($arrData['direccion'])       : '';

            if (strlen($dni) != 9) {
                throw new Exception('El DNI debe tener 9 caracteres.');                 // La columna dni es VARCHAR(9)
            }
            if (count(Cliente::getArray(['dni' => $dni])) > 0) {
                throw new Exception('Ese DNI ya está registrado.');                     // Comprobamos ANTES de crear nada
            }

            $usuario    = new Usuario(null, $nombre, $email, $password, 'Cliente');    // Rol forzado: nunca viene del navegador
            $id_usuario = $usuario->insert();                                           // Valida, cifra con BCrypt y devuelve el id

            $cliente = new Cliente(null, $dni, $nombre, $telefono, $direccion, $id_usuario); // Ficha de cliente unida a su usuario
            $cliente->insert();

            $msg = 'Registro completado. Ya puedes iniciar sesión.';
            break;
             
        case 'logout':
            session_destroy();                       // Borra todo lo guardado en $_SESSION (Tema 2)
            $msg = 'Sesión cerrada.';
            break;                        

        default:                                   // Si $action no coincide con ningún case
            $success = false;
            $msg     = 'Acción no soportada.';
    }
} catch (Exception $e) {                           // Si salta un throw dentro del try, viene aquí
    $success = false;
    $msg     = $e->getMessage();                   // Guardamos el mensaje del error para la vista
}

echo json_encode(array(                            // ÚNICO echo del archivo: el JSON final
    'success' => $success,
    'msg'     => $msg,
    'data'    => $datos
));
exit();                                            // Termina aquí