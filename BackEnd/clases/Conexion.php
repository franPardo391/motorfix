<?php
class Conexion
{
    // Instancia única de la clase
    private static $instancia = null;

    // Aquí se guarda la conexión PDO
    private $pdo;

    // Constructor privado: nadie puede hacer new Conexion() desde fuera
    private function __construct()
    {
        $this->pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS
        );
        // Que PDO lance excepciones cuando falle una consulta
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    // Crea la conexión solo la primera vez; las demás devuelve la misma
    public static function getInstance()
    {
        if (self::$instancia === null) {
            self::$instancia = new Conexion();
        }
        return self::$instancia;
    }

    // Devuelve el PDO para hacer consultas
    public function getConexion()
    {
        return $this->pdo;
    }
}