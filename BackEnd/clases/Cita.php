<?php
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

    // Aquí van __get y __set, iguales que en Usuario
}