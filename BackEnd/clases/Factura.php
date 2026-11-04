<?php
require_once __DIR__ . '/Conexion.php';

class Factura {
    private $id_factura;                  // Un atributo por columna de la tabla factura
    private $fecha;
    private $mano_obra;
    private $repuestos;
    private $base_imponible;                    // Estos tres NO los rellena nadie desde fuera:
    private $iva;                         // los calcula el propio modelo
    private $total;
    private $id_cita;                     // FK: la cita que se factura (UNIQUE)

    function __construct($id_factura=null, $fecha=null, $mano_obra=0, $repuestos=0, $id_cita=null) {
        $this->id_factura = $id_factura;
        $this->fecha      = $fecha;
        $this->mano_obra  = $mano_obra;
        $this->repuestos  = $repuestos;
        $this->id_cita    = $id_cita;     // base imponible, iva y total no se pasan: se calculan
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

    public function calcularTotales() {
        $this->base_imponible = $this->mano_obra + $this->repuestos;
        $this->iva      = round($this->base_imponible * 0.21,2);
        $this->total    = $this->base_imponible + $this->iva;
    }

    public function insert() {
        if (empty($this->id_cita)) throw new Exception("La factura debe tener una cita.", 1);           // Sin cita no hay factura
        if (!is_numeric($this->mano_obra) || $this->mano_obra < 0) throw new Exception("La mano de obra no es válida.", 1);
        if (!is_numeric($this->repuestos) || $this->repuestos < 0) throw new Exception("El importe de repuestos no es válido.", 1);

        if (empty($this->fecha)) $this->fecha = date('Y-m-d');      // Si no llega fecha, se usa la de hoy
        $this->calcularTotales();                                    // Siempre recalcula antes de guardar

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "INSERT INTO factura (fecha, mano_obra, repuestos, base_imponible, iva, total, id_cita)
                VALUES (:fecha, :mano_obra, :repuestos, :base_imponible, :iva, :total, :id_cita)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fecha'     => $this->fecha,
            ':mano_obra' => $this->mano_obra,
            ':repuestos' => $this->repuestos,
            ':base_imponible'  => $this->base_imponible,                         // Valores calculados por el modelo
            ':iva'       => $this->iva,
            ':total'     => $this->total,
            ':id_cita'   => $this->id_cita
        ]);

        $this->id_factura = $pdo->lastInsertId();                    // Id generado por MySQL
        return $this->id_factura;   
    }
    public function update() {
        if (empty($this->id_factura)) throw new Exception("El id de la factura es obligatorio.", 1);
        if (!is_numeric($this->mano_obra) || $this->mano_obra < 0) throw new Exception("La mano de obra no es válida.", 1);
        if (!is_numeric($this->repuestos) || $this->repuestos < 0) throw new Exception("El importe de repuestos no es válido.", 1);

        $this->calcularTotales();                                    // Si cambian los importes, se recalcula todo

        $pdo = Conexion::getInstance()->getConexion();
        $sql = "UPDATE factura SET fecha = :fecha, mano_obra = :mano_obra, repuestos = :repuestos,
                       base_imponible = :base_imponible, iva = :iva, total = :total
                WHERE id_factura = :id";                             // La cita no se cambia: una factura es de su cita
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fecha'     => $this->fecha,
            ':mano_obra' => $this->mano_obra,
            ':repuestos' => $this->repuestos,
            ':base_imponible'  => $this->base_imponible,
            ':iva'       => $this->iva,
            ':total'     => $this->total,
            ':id'        => $this->id_factura
        ]);
        return $stmt->rowCount() > 0;
    }

    public function delete() {
        if (empty($this->id_factura)) throw new Exception("El id de la factura es obligatorio.", 1);

        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("DELETE FROM factura WHERE id_factura = :id");
        $stmt->execute([':id' => $this->id_factura]);
        return $stmt->rowCount() > 0;
    }

    public static function getArray($filtros = array()) {
        try {
            $pdo = Conexion::getInstance()->getConexion();
            $sql = "SELECT * FROM factura WHERE 1=1";
            $valores = [];

            if (!empty($filtros['id_factura'])) {                    // Una factura concreta
                $sql .= " AND id_factura = :id_factura";
                $valores[':id_factura'] = $filtros['id_factura'];
            }
            if (!empty($filtros['id_cita'])) {                       // La factura de una cita
                $sql .= " AND id_cita = :id_cita";
                $valores[':id_cita'] = $filtros['id_cita'];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 1);
        }
    }   




}   // Cierra la clase