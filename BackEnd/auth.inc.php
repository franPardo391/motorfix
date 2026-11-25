<?php
session_start();                                            // Recupera la sesión que creó el login

if (!isset($_SESSION['id_usuario'])) {                      // Si no hay id guardado, no está identificado
    session_destroy();                                      // Limpia por si quedara algo
    echo json_encode(array(                                 // Devuelve el JSON de error con el formato de siempre
        'success' => false,
        'msg'     => 'No tienes permisos para acceder a esta seccion.',
        'data'    => []
    ));
    exit();                                                 // Corta: el servicio que lo incluye no se ejecuta
}
// Si hay sesión, no hace nada y el servicio continúa