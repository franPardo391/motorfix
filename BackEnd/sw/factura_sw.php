<?php
header('Content-Type: application/json; charset=utf-8');   // La respuesta siempre es JSON
require __DIR__ . '/../auth.inc.php';                       // Sin sesión: JSON de error y exit()
require __DIR__ . '/../conf.php';                           // Datos de la BD y DIR_CLASES
require DIR_CLASES . 'Factura.php';                         // Modelo de este servicio
require DIR_CLASES . 'Cliente.php';                         // Para saber qué cliente es el usuario
require DIR_CLASES . 'Cita.php';                            // Para leer las horas y repuestos de la cita

$data    = json_decode(file_get_contents('php://input'), true);  // JSON de fetch() convertido en array
$action  = isset($data['action']) ? $data['action'] : null;      // 'get', 'preparar' o 'insert'
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
        case 'preparar':                                              // Calcula la factura SIN guardarla
        case 'insert':                                                // Calcula y la guarda (emitir)
            if ($rol == 'Cliente') {
                throw new Exception('No tienes permiso para emitir facturas.');
            }
            $id_cita = isset($arrData['id_cita']) ? $arrData['id_cita'] : null;
            if (empty($id_cita)) {
                throw new Exception('Cita no encontrada.');
            }
            $encontradas = Cita::getArray(['id_cita' => $id_cita]);
            if (count($encontradas) == 0) {
                throw new Exception('Cita no encontrada.');
            }
            $cita = $encontradas[0];
            if ($cita['estado'] != 'Finalizada') {
                throw new Exception('Solo se pueden facturar reparaciones finalizadas.');
            }
            if (!empty($cita['id_factura'])) {                        // Viene del LEFT JOIN del F1
                throw new Exception('Esta cita ya tiene factura.');
            }

            $mano_obra = round($cita['horas'] * PRECIO_HORA, 2);     // Horas × 40 €
            $factura   = new Factura(null, date('Y-m-d'), $mano_obra, $cita['importe_repuesto'], $id_cita);
            if ($action == 'insert') {
                $factura->insert();                                   // insert() ya llama a calcularTotales()
                $msg = 'Factura emitida correctamente.';
            } else {
                $factura->calcularTotales();                          // Solo calcula, no toca la BD
                $msg = 'Factura preparada.';
            }
            $datos = [[
                'id_factura'     => $factura->id_factura,             // null si solo se ha preparado
                'fecha'          => $factura->fecha,
                'horas'          => $cita['horas'],
                'precio_hora'    => PRECIO_HORA,
                'mano_obra'      => $factura->mano_obra,
                'repuestos'      => $factura->repuestos,
                'base_imponible' => $factura->base_imponible,
                'iva'            => $factura->iva,
                'total'          => $factura->total
            ]];
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