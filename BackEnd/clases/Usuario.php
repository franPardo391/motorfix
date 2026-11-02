<?php
require_once __DIR__ . '/Conexion.php';   // Carga la clase Conexion, que está en la misma carpeta

class Usuario {
    private $id;
    private $nombre;
    private $email;
    private $password;
    private $rol;

    function __construct($id=null, $nombre=null, $email=null, $password=null, $rol=null) {
        $this->id       = $id;
        $this->nombre   = $nombre;
        $this->email    = $email;
        $this->password = $password;
        $this->rol      = $rol;
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
        if (empty($this->nombre))   throw new Exception("El nombre es obligatorio.", 1);    // Valida campos obligatorios
        if (empty($this->email))    throw new Exception("El email es obligatorio.", 1);
        if (empty($this->password)) throw new Exception("La contraseña es obligatoria.", 1);
        if (empty($this->rol))      throw new Exception("El rol es obligatorio.", 1);

        $this->password = password_hash($this->password, PASSWORD_BCRYPT);   // Cifra la contraseña con BCrypt (60 caracteres)

        $pdo = Conexion::getInstance()->getConexion();                       // Pide el PDO al Singleton

        $sql = "INSERT INTO usuario (nombre, email, password, rol)
                VALUES (:nombre, :email, :password, :rol)";                  // Marcadores :nombre..., nunca concatenar variables
        $stmt = $pdo->prepare($sql);                                         // Prepara la sentencia
        $stmt->execute([
            ':nombre'   => $this->nombre,                                    // Asocia cada marcador con su valor
            ':email'    => $this->email,
            ':password' => $this->password,
            ':rol'      => $this->rol
        ]);

        $this->id = $pdo->lastInsertId();                                    // Guarda en el objeto el id que ha generado MySQL
        return $this->id;                                                    // Lo devuelve (return, nunca echo)
    }

    public function update() {
        if (empty($this->id)) throw new Exception("El id es obligatorio.", 1);   // Sin id no sabemos qué fila modificar

        $pdo = Conexion::getInstance()->getConexion();                          // PDO del Singleton
        $sql = "UPDATE usuario SET nombre = :nombre, email = :email, rol = :rol
                WHERE id = :id";                                                // Solo modifica la fila con ese id
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $this->nombre,
            ':email'  => $this->email,
            ':rol'    => $this->rol,
            ':id'     => $this->id
        ]);
        return $stmt->rowCount() > 0;                                           // true si ha cambiado alguna fila
    }

    public function delete() {
        if (empty($this->id)) throw new Exception("El id es obligatorio.", 1);   // Sin id no borramos nada

        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("DELETE FROM usuario WHERE id = :id");            // Borra solo esa fila
        $stmt->execute([':id' => $this->id]);
        return $stmt->rowCount() > 0;                                           // true si se ha borrado
    }
    
    public static function getArray($filtros = array()) {
        try {
            $pdo = Conexion::getInstance()->getConexion();
            $sql = "SELECT id, nombre, email, rol FROM usuario WHERE 1=1";   // Sin password: nunca la devolvemos
            $valores = [];                                                  // Aquí se van guardando los parámetros

            if (!empty($filtros['id'])) {                                   // Si me piden filtrar por id...
                $sql .= " AND id = :id";                                    // ...añado la condición al SQL
                $valores[':id'] = $filtros['id'];                           // ...y su valor
            }
            if (!empty($filtros['rol'])) {                                  // Igual para el rol
                $sql .= " AND rol = :rol";
                $valores[':rol'] = $filtros['rol'];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);                       // Array de filas: ['id'=>.., 'nombre'=>..]
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 1);                       // Relanza el error al servicio (como en el Tema 2)
        }
    }

    public function login($email, $password) {
        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = :email"); // Busca el usuario por email
        $stmt->execute([':email' => $email]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);                              // Una sola fila, o false si no existe

        if ($fila && password_verify($password, $fila['password'])) {        // Existe y la contraseña coincide con el hash
            $this->id     = $fila['id'];                                     // Rellena el objeto con sus datos
            $this->nombre = $fila['nombre'];
            $this->email  = $fila['email'];
            $this->rol    = $fila['rol'];                                    // El rol lo usaremos luego en la sesión
            return true;
        }
        return false;                                                        // Email o contraseña incorrectos
    }    

    public static function getArray($filtros = array()) {
        try {
            $pdo = Conexion::getInstance()->getConexion();
            $sql = "SELECT id, nombre, email, rol FROM usuario WHERE 1=1";   // Sin password: nunca la devolvemos
            $valores = [];                                                  // Aquí se van guardando los parámetros

            if (!empty($filtros['id'])) {                                   // Si me piden filtrar por id...
                $sql .= " AND id = :id";                                    // ...añado la condición al SQL
                $valores[':id'] = $filtros['id'];                           // ...y su valor
            }
            if (!empty($filtros['rol'])) {                                  // Igual para el rol
                $sql .= " AND rol = :rol";
                $valores[':rol'] = $filtros['rol'];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($valores);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);                       // Array de filas: ['id'=>.., 'nombre'=>..]
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 1);                       // Relanza el error al servicio (como en el Tema 2)
        }
    }

    public function login($email, $password) {
        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = :email"); // Busca el usuario por email
        $stmt->execute([':email' => $email]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);                              // Una sola fila, o false si no existe

        if ($fila && password_verify($password, $fila['password'])) {        // Existe y la contraseña coincide con el hash
            $this->id     = $fila['id'];                                     // Rellena el objeto con sus datos
            $this->nombre = $fila['nombre'];
            $this->email  = $fila['email'];
            $this->rol    = $fila['rol'];                                    // El rol lo usaremos luego en la sesión
            return true;
        }
        return false;                                                        // Email o contraseña incorrectos
    }    
   