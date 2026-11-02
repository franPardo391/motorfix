<?php
require_once __DIR__ . '/Conexion.php';

class Vehiculo {
    private $id_vehiculo;                 // Un atributo por columna de la tabla vehiculo
    private $matricula;
    private $marca;
    private $modelo;
    private $anio;
    private $kilometraje;
    private $id_cliente;                  // FK: dueño del vehículo (obligatorio)

    function __construct($id_vehiculo=null, $matricula=null, $marca=null, $modelo=null,
                         $anio=null, $kilometraje=null, $id_cliente=null) {
        $this->id_vehiculo = $id_vehiculo;
        $this->matricula   = $matricula;
        $this->marca       = $marca;
        $this->modelo      = $modelo;
        $this->anio        = $anio;
        $this->kilometraje = $kilometraje;
        $this->id_cliente  = $id_cliente;
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
        if (empty($this->matricula))  throw new Exception("La matrícula es obligatoria.", 1);
        if (empty($this->marca))      throw new Exception("La marca es obligatoria.", 1);
        if (empty($this->modelo))     throw new Exception("El modelo es obligatorio.", 1);
        if (empty($this->id_cliente)) throw new Exception("El vehículo debe tener un cliente.", 1);   // 1:N: siempre tiene dueño

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "INSERT INTO vehiculo (matricula, marca, modelo, anio, kilometraje, id_cliente)
                VALUES (:matricula, :marca, :modelo, :anio, :kilometraje, :id_cliente)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':matricula'   => $this->matricula,
            ':marca'       => $this->marca,
            ':modelo'      => $this->modelo,
            ':anio'        => $this->anio ?: null,                 // Opcionales: vacío → NULL
            ':kilometraje' => $this->kilometraje ?: null,
            ':id_cliente'  => $this->id_cliente
        ]);

        $this->id_vehiculo = $pdo->lastInsertId();
        return $this->id_vehiculo;
    }

        public function update() {
        if (empty($this->id_vehiculo)) throw new Exception("El id del vehículo es obligatorio.", 1);

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "UPDATE vehiculo SET matricula = :matricula, marca = :marca, modelo = :modelo,
                       anio = :anio, kilometraje = :kilometraje, id_cliente = :id_cliente
                WHERE id_vehiculo = :id";                                    // Solo este vehículo
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':matricula'   => $this->matricula,
            ':marca'       => $this->marca,
            ':modelo'      => $this->modelo,
            ':anio'        => $this->anio ?: null,
            ':kilometraje' => $this->kilometraje ?: null,
            ':id_cliente'  => $this->id_cliente,
            ':id'          => $this->id_vehiculo
        ]);
        return $stmt->rowCount() > 0;
    }

    public function delete() {
        if (empty($this->id_vehiculo)) throw new Exception("El id del vehículo es obligatorio.", 1);

        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("DELETE FROM vehiculo WHERE id_vehiculo = :id");
        $stmt->execute([':id' => $this->id_vehiculo]);
        return $stmt->rowCount() > 0;
    }

    public static function getArray($filtros = array()) {
        try {
            $pdo = Conexion::getInstance()->getConexion();
            $sql = "SELECT * FROM vehiculo WHERE 1=1";
            $valores = [];

            if (!empty($filtros['id_vehiculo'])) {                         // Un vehículo concreto
                $sql .= " AND id_vehiculo = :id_vehiculo";
                $valores[':id_vehiculo'] = $filtros['id_vehiculo'];
            }
            if (!empty($filtros['id_cliente'])) {                          // Los coches de un cliente (relación 1:N)
                $sql .= " AND id_cliente = :id_cliente";
                $valores[':id_cliente'] = $filtros['id_cliente'];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 1);
        }
    }

}   // Cierra la clasex