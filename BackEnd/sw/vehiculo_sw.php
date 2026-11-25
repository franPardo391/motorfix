<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Vehiculo.php';                        // Modelo que vamos a usar
require DIR_CLASES . 'Cliente.php';                         // Para saber qué cliente es el usuario

$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get', 'insert', 'update' o 'delete'
$arrData = isset($data['data'])   ? $data['data']   : array();   // Campos del formulario

$success = true;                                            // Respuesta por defecto
$msg     = '';
$datos   = [];

try {
    $rol = $_SESSION['rol'];                                          // Rol guardado en el login
    if ($rol == 'Cliente') {                                          // El cliente solo ve SUS vehículos
        $clientes = Cliente::getArray(['id_usuario' => $_SESSION['id_usuario']]);
        if (count($clientes) == 0) {
            throw new Exception('No existe ficha de cliente para este usuario.');
        }
        $id_cliente = $clientes[0]['id_cliente'];                     // Sale de la sesión, no del navegador
    } elseif ($rol == 'Oficina' || $rol == 'Administrador') {        // Gestionan vehículos de cualquiera
        $id_cliente = isset($arrData['id_cliente']) ? $arrData['id_cliente'] : null;
    } else {
        throw new Exception('No tienes permiso para gestionar vehículos.');  // Mecánico: no entra aquí
    }

    switch ($action) {

        case 'get':                                                   // Listar vehículos
            $filtros = [];                                            // Sin filtros = todos
            if (!empty($id_cliente)) {                                // Cliente: siempre el suyo. Oficina: si lo pide
                $filtros['id_cliente'] = $id_cliente;
            }
            $datos = Vehiculo::getArray($filtros);                    // Tu método estático del modelo
            $msg   = 'Listado de vehículos.';
            break;
        case 'insert':                                                // Añadir un vehículo
            if (empty($id_cliente)) {                                 // Oficina tiene que indicar de quién es
                throw new Exception('Falta el cliente del vehículo.');
            }
            $matricula   = isset($arrData['matricula'])   ? strtoupper(trim($arrData['matricula'])) : '';  // En mayúsculas
            $marca       = isset($arrData['marca'])       ? trim($arrData['marca'])       : '';
            $modelo      = isset($arrData['modelo'])      ? trim($arrData['modelo'])      : '';
            $anio        = isset($arrData['anio'])        ? $arrData['anio']              : null;
            $kilometraje = isset($arrData['kilometraje']) ? $arrData['kilometraje']       : null;

            $vehiculo = new Vehiculo(null, $matricula, $marca, $modelo, $anio, $kilometraje, $id_cliente); // Dueño: el de la sesión
            $id = $vehiculo->insert();                                // El modelo valida y devuelve el id nuevo
            $datos = [['id_vehiculo' => $id]];
            $msg   = 'Vehículo añadido correctamente.';
            break;
        case 'update':                                                // Editar un vehículo
            $id_vehiculo = isset($arrData['id_vehiculo']) ? $arrData['id_vehiculo'] : null;
            if (empty($id_vehiculo)) {
                throw new Exception('Falta el vehículo a modificar.');
            }
            $filtros = ['id_vehiculo' => $id_vehiculo];               // Buscamos ese vehículo...
            if (!empty($id_cliente)) {
                $filtros['id_cliente'] = $id_cliente;                 // ...y si es Cliente, que sea SUYO
            }
            $encontrados = Vehiculo::getArray($filtros);
            if (count($encontrados) == 0) {
                throw new Exception('Vehículo no encontrado.');       // No existe o es de otro cliente
            }

            $vehiculo = new Vehiculo(
                $id_vehiculo,
                isset($arrData['matricula'])   ? strtoupper(trim($arrData['matricula'])) : '',
                isset($arrData['marca'])       ? trim($arrData['marca'])  : '',
                isset($arrData['modelo'])      ? trim($arrData['modelo']) : '',
                isset($arrData['anio'])        ? $arrData['anio']         : null,
                isset($arrData['kilometraje']) ? $arrData['kilometraje']  : null,
                $encontrados[0]['id_cliente']                         // El dueño no cambia: el de la BD
            );
            $vehiculo->update();
            $msg = 'Vehículo modificado correctamente.';
            break;
        case 'delete':                                                // Borrar un vehículo
            $id_vehiculo = isset($arrData['id_vehiculo']) ? $arrData['id_vehiculo'] : null;
            if (empty($id_vehiculo)) {
                throw new Exception('Falta el vehículo a borrar.');
            }
            $filtros = ['id_vehiculo' => $id_vehiculo];               // Misma comprobación que en update
            if (!empty($id_cliente)) {
                $filtros['id_cliente'] = $id_cliente;
            }
            if (count(Vehiculo::getArray($filtros)) == 0) {
                throw new Exception('Vehículo no encontrado.');
            }

            $vehiculo = new Vehiculo($id_vehiculo);                   // Para borrar basta con el id
            $vehiculo->delete();
            $msg = 'Vehículo borrado correctamente.';
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