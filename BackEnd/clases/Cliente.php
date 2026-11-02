<?php
require_once __DIR__ . '/Conexion.php';   // Carga la clase Conexion

class Cliente {
    private $id_cliente;                  // Un atributo por cada columna de la tabla cliente
    private $dni;
    private $nombre;
    private $telefono;
    private $direccion;
    private $id_usuario;                  // FK a usuario (puede ser null)

    function __construct($id_cliente=null, $dni=null, $nombre=null, $telefono=null, $direccion=null, $id_usuario=null) {
        $this->id_cliente = $id_cliente;
        $this->dni        = $dni;
        $this->nombre     = $nombre;
        $this->telefono   = $telefono;
        $this->direccion  = $direccion;
        $this->id_usuario = $id_usuario;
    }

    public function __get($property) {
        if (property_exists($this, $property)) {
            return $this->$property;
        }
    }

    public function __set($property, $value) {
        if (property_exists($this, $property)) {
            $this->$property = $value;
        }
        return $this;
    }

    public function insert() {
        if (empty($this->dni))    throw new Exception("El DNI es obligatorio.", 1);      // Campos obligatorios
        if (empty($this->nombre)) throw new Exception("El nombre es obligatorio.", 1);

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "INSERT INTO cliente (dni, nombre, telefono, direccion, id_usuario)
                VALUES (:dni, :nombre, :telefono, :direccion, :id_usuario)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':dni'        => $this->dni,
            ':nombre'     => $this->nombre,
            ':telefono'   => $this->telefono,
            ':direccion'  => $this->direccion,
            ':id_usuario' => $this->id_usuario ?: null                           // Si viene vacío, guarda NULL
        ]);

        $this->id_cliente = $pdo->lastInsertId();                                // Id generado por MySQL
        return $this->id_cliente;
    }

    public function update() {
        if (empty($this->id_cliente)) throw new Exception("El id del cliente es obligatorio.", 1);   // Sin id no hay WHERE

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "UPDATE cliente SET dni = :dni, nombre = :nombre, telefono = :telefono,
                       direccion = :direccion, id_usuario = :id_usuario
                WHERE id_cliente = :id";                                        // Solo la fila de este cliente
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':dni'        => $this->dni,
            ':nombre'     => $this->nombre,
            ':telefono'   => $this->telefono,
            ':direccion'  => $this->direccion,
            ':id_usuario' => $this->id_usuario ?: null,
            ':id'         => $this->id_cliente
        ]);
        return $stmt->rowCount() > 0;                                           // true si ha cambiado algo
    }

    public function delete() {
        if (empty($this->id_cliente)) throw new Exception("El id del cliente es obligatorio.", 1);

        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("DELETE FROM cliente WHERE id_cliente = :id");    // Borra solo este cliente
        $stmt->execute([':id' => $this->id_cliente]);
        return $stmt->rowCount() > 0;
    }

    public static function getArray($filtros = array()) {
        try {
            $pdo = Conexion::getInstance()->getConexion();
            $sql = "SELECT * FROM cliente WHERE 1=1";               // Aquí no hay datos sensibles: traemos todo
            $valores = [];

            if (!empty($filtros['id_cliente'])) {                  // Un cliente concreto
                $sql .= " AND id_cliente = :id_cliente";
                $valores[':id_cliente'] = $filtros['id_cliente'];
            }
            if (!empty($filtros['id_usuario'])) {                  // El cliente del usuario logueado
                $sql .= " AND id_usuario = :id_usuario";
                $valores[':id_usuario'] = $filtros['id_usuario'];
            }
            if (!empty($filtros['dni'])) {                         // Buscar por DNI (lo usará Oficina)
                $sql .= " AND dni = :dni";
                $valores[':dni'] = $filtros['dni'];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);              // Array de filas
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 1);              // Relanza al servicio web
        }
    }    

}   // Cierra la clase