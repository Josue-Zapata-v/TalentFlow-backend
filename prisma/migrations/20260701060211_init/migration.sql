-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'RECLUTADOR', 'POSTULANTE');

-- CreateEnum
CREATE TYPE "ModalidadVacante" AS ENUM ('REMOTO', 'PRESENCIAL', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "EstadoVacante" AS ENUM ('ABIERTA', 'CERRADA', 'BORRADOR');

-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('POSTULADO', 'EN_REVISION', 'ENTREVISTA', 'OFERTA', 'RECHAZADO', 'CONTRATADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacantes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "modalidad" "ModalidadVacante" NOT NULL,
    "salarioRango" TEXT,
    "categoria" TEXT,
    "estado" "EstadoVacante" NOT NULL DEFAULT 'BORRADOR',
    "reclutadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postulaciones" (
    "id" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "postulanteId" TEXT NOT NULL,
    "cvUrl" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'POSTULADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estados" (
    "id" TEXT NOT NULL,
    "postulacionId" TEXT NOT NULL,
    "estadoAnterior" "EstadoPostulacion",
    "estadoNuevo" "EstadoPostulacion" NOT NULL,
    "cambiadoPorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vacantes_slug_key" ON "vacantes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "postulaciones_vacanteId_postulanteId_key" ON "postulaciones"("vacanteId", "postulanteId");

-- AddForeignKey
ALTER TABLE "vacantes" ADD CONSTRAINT "vacantes_reclutadorId_fkey" FOREIGN KEY ("reclutadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "vacantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_postulanteId_fkey" FOREIGN KEY ("postulanteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "postulaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados" ADD CONSTRAINT "historial_estados_cambiadoPorId_fkey" FOREIGN KEY ("cambiadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
