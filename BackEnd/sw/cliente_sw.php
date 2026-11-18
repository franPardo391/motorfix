<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Cliente.php';                         // Modelo que vamos a usar
require DIR_CLASES . 'Vehiculo.php';                        // Para saber si el cliente tiene vehículos


$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get', 'insert', 'update', 'delete'
$arrData = isset($data['data'])   ? $data['data']   : array();   // Campos del formulario

$success = true;                                            // Respuesta por defecto
$msg     = '';
$datos   = [];

try {
    $rol = $_SESSION['rol'];                                          // Rol guardado en el login
    if ($rol != 'Oficina' && $rol != 'Administrador') {               // Solo ellos gestionan clientes
        throw new Exception('No tienes permiso para gestionar clientes.');
    }

    switch ($action) {

        case 'get':                                                   // Listar clientes
            $filtros = [];                                            // Sin filtros = todos
            if (!empty($arrData['dni'])) {                            // Buscador "Buscar por DNI"
                $filtros['dni'] = strtoupper(trim($arrData['dni']));  // En la BD está en mayúsculas
            }
            $datos = Cliente::getArray($filtros);                     // Método estático del modelo
            $msg   = 'Listado de clientes.';
            break;
        case 'insert':                                                // Nuevo cliente (lo da de alta Oficina)
            $dni       = isset($arrData['dni'])       ? strtoupper(trim($arrData['dni'])) : '';  // DNI en mayúsculas
            $nombre    = isset($arrData['nombre'])    ? trim($arrData['nombre'])    : '';
            $telefono  = isset($arrData['telefono'])  ? trim($arrData['telefono'])  : '';
            $direccion = isset($arrData['direccion']) ? trim($arrData['direccion']) : '';

            if (strlen($dni) != 9) {
                throw new Exception('El DNI debe tener 9 caracteres.');       // La columna dni es VARCHAR(9)
            }
            if (count(Cliente::getArray(['dni' => $dni])) > 0) {
                throw new Exception('Ya existe un cliente con ese DNI.');     // Evita el error 23000 de MySQL
            }

            $cliente = new Cliente(null, $dni, $nombre, $telefono, $direccion, null);  // Sin cuenta web: id_usuario NULL
            $id = $cliente->insert();                                 // El modelo valida y devuelve el id nuevo
            $datos = [['id_cliente' => $id]];
            $msg   = 'Cliente añadido correctamente.';
            break;
        case 'update':                                                // Editar un cliente
            $id_cliente = isset($arrData['id_cliente']) ? $arrData['id_cliente'] : null;
            if (empty($id_cliente)) {
                throw new Exception('Falta el cliente a modificar.');
            }
            $encontrados = Cliente::getArray(['id_cliente' => $id_cliente]);   // ¿Existe?
            if (count($encontrados) == 0) {
                throw new Exception('Cliente no encontrado.');
            }

            $dni = isset($arrData['dni']) ? strtoupper(trim($arrData['dni'])) : '';
            if (strlen($dni) != 9) {
                throw new Exception('El DNI debe tener 9 caracteres.');
            }
            $mismoDni = Cliente::getArray(['dni' => $dni]);           // ¿Otro cliente tiene ya ese DNI?
            if (count($mismoDni) > 0 && $mismoDni[0]['id_cliente'] != $id_cliente) {
                throw new Exception('Ya existe otro cliente con ese DNI.');
            }

            $cliente = new Cliente(
                $id_cliente,
                $dni,
                isset($arrData['nombre'])    ? trim($arrData['nombre'])    : '',
                isset($arrData['telefono'])  ? trim($arrData['telefono'])  : '',
                isset($arrData['direccion']) ? trim($arrData['direccion']) : '',
                $encontrados[0]['id_usuario']                         // La cuenta web no cambia: la de la BD
            );
            $cliente->update();
            $msg = 'Cliente modificado correctamente.';
            break;
        case 'delete':                                                // Borrar un cliente
            $id_cliente = isset($arrData['id_cliente']) ? $arrData['id_cliente'] : null;
            if (empty($id_cliente)) {
                throw new Exception('Falta el cliente a borrar.');
            }
            $encontrados = Cliente::getArray(['id_cliente' => $id_cliente]);   // ¿Existe?
            if (count($encontrados) == 0) {
                throw new Exception('Cliente no encontrado.');
            }
            if (!empty($encontrados[0]['id_usuario'])) {              // Tiene cuenta web
                throw new Exception('Este cliente tiene cuenta web; no se puede borrar desde Oficina.');
            }
            if (count(Vehiculo::getArray(['id_cliente' => $id_cliente])) > 0) {
                throw new Exception('El cliente tiene vehículos. Bórralos antes.');  // Evita el error 23000
            }

            $cliente = new Cliente($id_cliente);                      // Para borrar basta con el id
            $cliente->delete();
            $msg = 'Cliente borrado correctamente.';
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
