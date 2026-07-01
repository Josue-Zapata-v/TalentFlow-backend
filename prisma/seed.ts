import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/shared/utils/bcrypt.util";
import { slugify } from "../src/shared/utils/slugify.util";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("Talentflow123!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@talentflow.com" },
    update: {},
    create: {
      nombre: "Admin TalentFlow",
      email: "admin@talentflow.com",
      passwordHash,
      rol: "ADMIN",
    },
  });

  const reclutador = await prisma.user.upsert({
    where: { email: "reclutador@talentflow.com" },
    update: {},
    create: {
      nombre: "Reclutador Demo",
      email: "reclutador@talentflow.com",
      passwordHash,
      rol: "RECLUTADOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "postulante@talentflow.com" },
    update: {},
    create: {
      nombre: "Postulante Demo",
      email: "postulante@talentflow.com",
      passwordHash,
      rol: "POSTULANTE",
    },
  });

  const vacantes = [
    {
      titulo: "Desarrollador Backend Node.js",
      descripcion: "Buscamos desarrollador backend con experiencia en Node.js y Express.",
      requisitos: "2+ años con Node.js, TypeScript y bases de datos relacionales.",
      ubicacion: "Lima, Perú",
      modalidad: "REMOTO" as const,
      categoria: "Backend",
    },
    {
      titulo: "Desarrollador Frontend React",
      descripcion: "Buscamos desarrollador frontend con experiencia en React y Next.js.",
      requisitos: "2+ años con React, Next.js y consumo de APIs REST.",
      ubicacion: "Arequipa, Perú",
      modalidad: "HIBRIDO" as const,
      categoria: "Frontend",
    },
    {
      titulo: "QA Automation Engineer",
      descripcion: "Buscamos QA automation para pruebas de integración y end-to-end.",
      requisitos: "Experiencia con Jest, Supertest o Cypress.",
      ubicacion: "Trujillo, Perú",
      modalidad: "PRESENCIAL" as const,
      categoria: "QA",
    },
  ];

  for (const vacante of vacantes) {
    await prisma.vacante.upsert({
      where: { slug: slugify(vacante.titulo) },
      update: {},
      create: {
        ...vacante,
        slug: slugify(vacante.titulo),
        estado: "ABIERTA",
        reclutadorId: reclutador.id,
      },
    });
  }

  console.log("Seed completado:", { admin: admin.email, reclutador: reclutador.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
