-- MotorFix: script de creación de la base de datos
CREATE DATABASE IF NOT EXISTS motorfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;  -- Crea la BD si no existe
USE motorfix;                                                                              -- Trabajamos dentro de ella

-- Se borran en orden inverso por las claves foráneas (primero las "hijas")
DROP TABLE IF EXISTS factura;
DROP TABLE IF EXISTS cita;
DROP TABLE IF EXISTS vehiculo;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS usuario;

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,                                  -- MySQL genera el id solo
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,                                    -- No puede haber dos emails iguales (login)
    PASSWORD   CHAR(60)     NOT NULL,                                           -- Hash BCrypt: siempre 60 caracteres
    rol        ENUM('Administrador','Oficina','Mecanico','Cliente') NOT NULL    -- Solo admite los 4 roles
) ENGINE=INNODB;

CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    dni        VARCHAR(9)   NOT NULL UNIQUE,
    nombre     VARCHAR(100) NOT NULL,
    telefono   VARCHAR(15),
    direccion  VARCHAR(200),
    id_usuario INT NULL UNIQUE,                                                 -- Opcional y 1:1: un usuario = un cliente
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL  -- Si se borra el usuario, el cliente queda
) ENGINE=INNODB;

CREATE TABLE vehiculo (
    id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    matricula   VARCHAR(10)  NOT NULL UNIQUE,
    marca       VARCHAR(50)  NOT NULL,
    modelo      VARCHAR(50)  NOT NULL,
    anio        INT,
    kilometraje INT,
    id_cliente  INT NOT NULL,                                                   -- Relación 1:N: un cliente, muchos vehículos
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
) ENGINE=INNODB;

CREATE TABLE cita (
    id_cita          INT AUTO_INCREMENT PRIMARY KEY,
    fecha            DATETIME NOT NULL,
    descripcion      TEXT,
    estado           ENUM('Pendiente','Asignada','En reparacion','Finalizada') NOT NULL DEFAULT 'Pendiente',
    horas            DECIMAL(5,2)  DEFAULT 0,                                    -- Horas imputadas por el mecánico
    piezas           TEXT,                                                       -- Materiales usados
    importe_repuesto DECIMAL(10,2) DEFAULT 0,
    id_vehiculo      INT NOT NULL,
    id_mecanico      INT NULL,                                                   -- NULL hasta que Oficina la asigna
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo),
    FOREIGN KEY (id_mecanico) REFERENCES usuario(id_usuario)
) ENGINE=INNODB;

CREATE TABLE factura (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    fecha      DATE NOT NULL,
    mano_obra  DECIMAL(10,2) NOT NULL,
    repuestos  DECIMAL(10,2) NOT NULL,
    base_imponible DECIMAL(10,2) NOT NULL,                                       -- mano_obra + repuestos
    iva        DECIMAL(10,2) NOT NULL,                                           -- 21 % de la base imponible
    total      DECIMAL(10,2) NOT NULL,                                           -- base imponible + iva
    id_cita    INT NOT NULL UNIQUE,                                              -- UNIQUE = una factura por cita (1:1)
    FOREIGN KEY (id_cita) REFERENCES cita(id_cita)
) ENGINE=INNODB;