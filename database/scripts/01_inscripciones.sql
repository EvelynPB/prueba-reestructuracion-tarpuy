-- Sistema de Inscripciones: tablas de delegaciones (fichas), asesores, alumnos y alumnos libres.
-- El servidor de inscripciones ejecuta este script al arrancar (todas las sentencias son idempotentes).
-- Antes de la reestructuración estaba embebido en concurso-tarpuy-main/server.js (constante SCHEMA).

CREATE TABLE IF NOT EXISTS fichas (
  id          SERIAL PRIMARY KEY,
  ie          TEXT NOT NULL,
  director    TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('Estatal','Privado')),
  direccion   TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  correo      TEXT NOT NULL,
  monto       INTEGER NOT NULL,
  operacion   TEXT NOT NULL,
  medio       TEXT NOT NULL CHECK (medio IN ('Yape','Transferencia')),
  pagador     TEXT,
  verificado  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS asesores (
  id        SERIAL PRIMARY KEY,
  ficha_id  INTEGER NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  nivel     TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  telefono  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS alumnos (
  id        SERIAL PRIMARY KEY,
  ficha_id  INTEGER NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  nivel     TEXT NOT NULL,
  grado     TEXT NOT NULL,
  nro       INTEGER NOT NULL,
  dni       TEXT NOT NULL UNIQUE,
  nombre    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS libres (
  id          SERIAL PRIMARY KEY,
  dni         TEXT NOT NULL UNIQUE,
  grado       TEXT NOT NULL,
  nivel       TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  monto       INTEGER NOT NULL,
  operacion   TEXT NOT NULL,
  medio       TEXT NOT NULL CHECK (medio IN ('Yape','Transferencia')),
  pagador     TEXT,
  verificado  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alumnos_ficha ON alumnos(ficha_id);
CREATE INDEX IF NOT EXISTS idx_asesores_ficha ON asesores(ficha_id);
ALTER TABLE libres ADD COLUMN IF NOT EXISTS telefono TEXT;
