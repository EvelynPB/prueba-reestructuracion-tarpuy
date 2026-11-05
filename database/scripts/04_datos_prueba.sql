-- =====================================================================
-- 04 · Datos de prueba (SOLO para desarrollo local; nunca en producción)
-- Nombres, DNI y teléfonos son ficticios. Se puede ejecutar varias veces:
-- solo inserta si la base no tiene fichas todavía.
-- =====================================================================
DO $$
DECLARE f1 int; f2 int; f3 int;
BEGIN
  IF EXISTS (SELECT 1 FROM fichas) THEN
    RAISE NOTICE 'La base ya tiene datos: no se insertan datos de prueba.';
    RETURN;
  END IF;

  INSERT INTO fichas (ie, director, tipo, direccion, telefono, correo, monto, operacion, medio, pagador, verificado)
  VALUES ('I.E. Ficticia Los Pinos', 'Director de Prueba Uno', 'Estatal', 'Av. Ejemplo 100, Ate', '014445555',
          'pinos@ejemplo.pe', 65, '10000001', 'Yape', 'Tesorería Los Pinos', TRUE)
  RETURNING id INTO f1;
  INSERT INTO fichas (ie, director, tipo, direccion, telefono, correo, monto, operacion, medio, pagador, verificado)
  VALUES ('Colegio Ficticio Santa Prueba', 'Directora de Prueba Dos', 'Privado', 'Jr. Muestra 200, Santa Anita',
          '987000111', 'santaprueba@ejemplo.pe', 52, '20000002, 20000003', 'Transferencia', 'APAFA Santa Prueba', TRUE)
  RETURNING id INTO f2;
  INSERT INTO fichas (ie, director, tipo, direccion, telefono, correo, monto, operacion, medio, pagador, verificado)
  VALUES ('I.E.P. Demo Horizonte', 'Director de Prueba Tres', 'Privado', 'Calle Demo 300, La Molina',
          '987000222', 'horizonte@ejemplo.pe', 39, '30000004', 'Yape', 'Promotoría Horizonte', FALSE)
  RETURNING id INTO f3;

  INSERT INTO asesores (ficha_id, nivel, nombre, telefono) VALUES
    (f1, 'Inicial', 'Asesora Inicial Pinos', '987100001'),
    (f1, 'Primaria', 'Asesor Primaria Pinos', '987100002'),
    (f1, 'Secundaria', 'Asesora Secundaria Pinos', '987100003'),
    (f2, 'Primaria', 'Asesor Primaria Santa Prueba', '987100004'),
    (f2, 'Secundaria', 'Asesora Secundaria Santa Prueba', '987100005'),
    (f3, 'Primaria', 'Asesor Primaria Horizonte', '987100006');

  INSERT INTO alumnos (ficha_id, nivel, grado, nro, dni, nombre) VALUES
    (f1, 'Inicial',    'Inicial · 5 años',  1, '90000001', 'Alumno Prueba, Ana'),
    (f1, 'Primaria',   '3° de Primaria',    1, '90000002', 'Alumno Prueba, Bruno'),
    (f1, 'Primaria',   '3° de Primaria',    2, '90000003', 'Alumno Prueba, Carla'),
    (f1, 'Secundaria', '2° de Secundaria',  1, '90000004', 'Alumno Prueba, Diego'),
    (f1, 'Secundaria', '2° de Secundaria',  2, '90000005', 'Alumno Prueba, Elena'),
    (f2, 'Primaria',   '3° de Primaria',    1, '90000006', 'Alumno Prueba, Fabio'),
    (f2, 'Primaria',   '5° de Primaria',    1, '90000007', 'Alumno Prueba, Gabriela'),
    (f2, 'Secundaria', '2° de Secundaria',  1, '90000008', 'Alumno Prueba, Hugo'),
    (f2, 'Secundaria', '4° de Secundaria',  1, '90000009', 'Alumno Prueba, Irene'),
    (f3, 'Primaria',   '3° de Primaria',    1, '90000010', 'Alumno Prueba, Jorge'),
    (f3, 'Primaria',   '3° de Primaria',    2, '90000011', 'Alumno Prueba, Karen'),
    (f3, 'Primaria',   '5° de Primaria',    1, '90000012', 'Alumno Prueba, Luis');

  INSERT INTO libres (dni, grado, nivel, nombre, telefono, monto, operacion, medio, pagador, verificado) VALUES
    ('90000101', '3° de Primaria',   'Primaria',   'Libre Prueba, Mariana', '987200001', 15, '40000001', 'Yape', 'Apoderado Uno', TRUE),
    ('90000102', '2° de Secundaria', 'Secundaria', 'Libre Prueba, Nicolás', '987200002', 15, '40000002', 'Transferencia', 'Apoderado Dos', TRUE);

  -- Puntajes (algunos alumnos quedan sin puntaje para probar «No rindió»)
  INSERT INTO resultados (alumno_id, puntaje, hora_entrega)
  SELECT a.id, v.puntaje, v.hora::time
  FROM (VALUES ('90000001', 180, '10:15:00'), ('90000002', 120, '10:40:10'), ('90000003', 120, '10:32:45'),
               ('90000004', 95, '11:05:00'),  ('90000006', 135, '10:50:30'), ('90000007', 110, '10:20:00'),
               ('90000008', 140, '10:58:00'), ('90000009', 88, '11:10:00'),  ('90000010', 60, '11:00:00'),
               ('90000012', 101, '10:45:00')) AS v(dni, puntaje, hora)
  JOIN alumnos a ON a.dni = v.dni;
  INSERT INTO resultados (libre_id, puntaje, hora_entrega)
  SELECT l.id, 128, '10:37:00' FROM libres l WHERE l.dni = '90000101';

  UPDATE config_resultados SET publicado = TRUE WHERE id = 1;
END $$;
