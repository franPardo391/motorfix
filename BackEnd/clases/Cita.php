<?php
require_once __DIR__ . '/Conexion.php';      // Para usar Conexion::getInstance() (igual que en Vehiculo.php)

class Cita {
    private $id_cita;
    private $fecha;
    private $descripcion;
    private $estado;
    private $horas;
    private $piezas;
    private $importe_repuesto;
    private $id_vehiculo;         // FK: vehículo de la cita
    private $id_mecanico;         // FK: usuario mecánico asignado (null hasta que Oficina lo asigne)

    function __construct($id_cita=null, $fecha=null, $descripcion=null, $estado=null, $horas=null, $piezas=null, $importe_repuesto=null, $id_vehiculo=null, $id_mecanico=null) {
        $this->id_cita          = $id_cita;
        $this->fecha            = $fecha;
        $this->descripcion      = $descripcion;
        $this->estado           = $estado;
        $this->horas            = $horas;
        $this->piezas           = $piezas;
        $this->importe_repuesto = $importe_repuesto;
        $this->id_vehiculo      = $id_vehiculo;
        $this->id_mecanico      = $id_mecanico;
    }

    public function __get($property) {
        if (property_exists($this, $property)) {   // Solo atributos que existan en la clase
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
        if (empty($this->fecha))       throw new Exception("La fecha de la cita es obligatoria.", 1);   // Campos mínimos
        if (empty($this->id_vehiculo)) throw new Exception("La cita debe tener un vehículo.", 1);        // NOT NULL en la BD

        $pdo = Conexion::getInstance()->getConexion();                       // PDO del Singleton

        $sql = "INSERT INTO cita (fecha, descripcion, estado, id_vehiculo)
                VALUES (:fecha, :descripcion, 'Pendiente', :id_vehiculo)";   // Nace Pendiente y sin mecánico
        $stmt = $pdo->prepare($sql);                                          // Sentencia preparada
        $stmt->execute([
            ':fecha'       => $this->fecha,
            ':descripcion' => $this->descripcion,
            ':id_vehiculo' => $this->id_vehiculo
        ]);

        $this->id_cita = $pdo->lastInsertId();                                // Id generado por MySQL
        $this->estado  = 'Pendiente';                                         // Deja el objeto igual que la fila
        return $this->id_cita;
    }    
    public function update() {
        if (empty($this->id_cita)) throw new Exception("El id de la cita es obligatorio.", 1);   // Sin id no hay WHERE

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "UPDATE cita SET fecha = :fecha, descripcion = :descripcion, estado = :estado,
                       horas = :horas, piezas = :piezas, importe_repuesto = :importe_repuesto,
                       id_mecanico = :id_mecanico
                WHERE id_cita = :id";                                        // El vehículo no se cambia: la cita es de su coche
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fecha'            => $this->fecha,
            ':descripcion'      => $this->descripcion,
            ':estado'           => $this->estado,
            ':horas'            => $this->horas ?: 0,                        // Si viene vacío, 0
            ':piezas'           => $this->piezas,
            ':importe_repuesto' => $this->importe_repuesto ?: 0,
            ':id_mecanico'      => $this->id_mecanico ?: null,               // Vacío → NULL (sin asignar)
            ':id'               => $this->id_cita
        ]);
        return $stmt->rowCount() > 0;                                        // true si ha cambiado alguna fila
    }

    public function delete() {
        if (empty($this->id_cita)) throw new Exception("El id de la cita es obligatorio.", 1);

        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("DELETE FROM cita WHERE id_cita = :id");       // Borra solo esta cita
        $stmt->execute([':id' => $this->id_cita]);
        return $stmt->rowCount() > 0;
    }

    public static function getArray($filtros = array()) {
        try {
            $pdo = Conexion::getInstance()->getConexion();

            $sql = "SELECT c.*, v.matricula, v.marca, v.modelo, v.kilometraje, v.id_cliente,
                           cl.nombre AS cliente
                    FROM cita c
                    JOIN vehiculo v ON c.id_vehiculo = v.id_vehiculo
                    JOIN cliente cl ON v.id_cliente = cl.id_cliente
                    WHERE 1=1";                                      // JOIN: la vista ya tiene matrícula, km y nombre del cliente
                               // JOIN: así la vista ya tiene la matrícula
            $valores = [];

            if (!empty($filtros['id_cita'])) {                       // Una cita concreta
                $sql .= " AND c.id_cita = :id_cita";
                $valores[':id_cita'] = $filtros['id_cita'];
            }
            if (!empty($filtros['id_vehiculo'])) {                   // Las citas de un coche
                $sql .= " AND c.id_vehiculo = :id_vehiculo";
                $valores[':id_vehiculo'] = $filtros['id_vehiculo'];
            }
            if (!empty($filtros['id_cliente'])) {                    // Todas las citas de un cliente (panel Cliente)
                $sql .= " AND v.id_cliente = :id_cliente";
                $valores[':id_cliente'] = $filtros['id_cliente'];
            }
            if (!empty($filtros['id_mecanico'])) {                   // La hoja de trabajo de un mecánico
                $sql .= " AND c.id_mecanico = :id_mecanico";
                $valores[':id_mecanico'] = $filtros['id_mecanico'];
            }
            if (!empty($filtros['estado'])) {                        // Pendientes, En reparacion...
                $sql .= " AND c.estado = :estado";
                $valores[':estado'] = $filtros['estado'];
            }

            $sql .= " ORDER BY c.fecha DESC";                        // Las más recientes primero

            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 1);                // Relanza al servicio web
        }
    }    
}