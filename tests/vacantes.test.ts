import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/database";

const ownerEmail = `test-vac-owner-${Date.now()}@talentflow.com`;
const otherEmail = `test-vac-other-${Date.now()}@talentflow.com`;
const postulanteEmail = `test-vac-postulante-${Date.now()}@talentflow.com`;
const password = "password123";

let ownerToken: string;
let otherToken: string;
let postulanteToken: string;
let createdVacanteId: string;

async function registerAndLogin(email: string, rol: "RECLUTADOR" | "POSTULANTE") {
  await request(app).post("/api/auth/register").send({
    nombre: "Usuario de Prueba",
    email,
    password,
    rol,
  });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.data.accessToken as string;
}

describe("Vacantes", () => {
  beforeAll(async () => {
    ownerToken = await registerAndLogin(ownerEmail, "RECLUTADOR");
    otherToken = await registerAndLogin(otherEmail, "RECLUTADOR");
    postulanteToken = await registerAndLogin(postulanteEmail, "POSTULANTE");
  });

  afterAll(async () => {
    if (createdVacanteId) {
      await prisma.vacante.deleteMany({ where: { id: createdVacanteId } });
    }
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, otherEmail, postulanteEmail] } } });
    await prisma.$disconnect();
  });

  it("lista vacantes públicas", async () => {
    const res = await request(app).get("/api/vacantes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.vacantes)).toBe(true);
    expect(res.body.data.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it("rechaza crear una vacante sin autenticación", async () => {
    const res = await request(app).post("/api/vacantes").send({
      titulo: "Vacante sin auth",
      descripcion: "Descripción con longitud suficiente para pasar la validación.",
      requisitos: "Requisitos de prueba",
      ubicacion: "Lima",
      modalidad: "REMOTO",
    });

    expect(res.status).toBe(401);
  });

  it("rechaza crear una vacante como POSTULANTE", async () => {
    const res = await request(app)
      .post("/api/vacantes")
      .set("Authorization", `Bearer ${postulanteToken}`)
      .send({
        titulo: "Vacante como postulante",
        descripcion: "Descripción con longitud suficiente para pasar la validación.",
        requisitos: "Requisitos de prueba",
        ubicacion: "Lima",
        modalidad: "REMOTO",
      });

    expect(res.status).toBe(403);
  });

  it("crea una vacante como RECLUTADOR", async () => {
    const res = await request(app)
      .post("/api/vacantes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        titulo: `Vacante de Prueba ${Date.now()}`,
        descripcion: "Descripción con longitud suficiente para pasar la validación.",
        requisitos: "Requisitos de prueba con longitud suficiente",
        ubicacion: "Lima, Perú",
        modalidad: "REMOTO",
        estado: "ABIERTA",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.vacante.slug).toEqual(expect.any(String));
    createdVacanteId = res.body.data.vacante.id;
  });

  it("devuelve el detalle público de la vacante creada por su slug", async () => {
    const detail = await prisma.vacante.findUnique({ where: { id: createdVacanteId } });
    const res = await request(app).get(`/api/vacantes/${detail!.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.data.vacante.id).toBe(createdVacanteId);
  });

  it("devuelve 404 para un slug inexistente", async () => {
    const res = await request(app).get("/api/vacantes/slug-que-no-existe-xyz");
    expect(res.status).toBe(404);
  });

  it("lista la vacante creada en el manage/list del dueño", async () => {
    const res = await request(app)
      .get("/api/vacantes/manage/list")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.vacantes.map((v: { id: string }) => v.id);
    expect(ids).toContain(createdVacanteId);
  });

  it("rechaza actualizar la vacante desde otro RECLUTADOR (no dueño)", async () => {
    const res = await request(app)
      .patch(`/api/vacantes/manage/${createdVacanteId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ titulo: "Intento no autorizado" });

    expect(res.status).toBe(403);
  });

  it("permite actualizar la vacante al dueño", async () => {
    const res = await request(app)
      .patch(`/api/vacantes/manage/${createdVacanteId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ estado: "CERRADA" });

    expect(res.status).toBe(200);
    expect(res.body.data.vacante.estado).toBe("CERRADA");
  });

  it("elimina la vacante propia sin postulaciones", async () => {
    const res = await request(app)
      .delete(`/api/vacantes/manage/${createdVacanteId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);

    const res2 = await request(app)
      .get(`/api/vacantes/manage/${createdVacanteId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(res2.status).toBe(404);

    createdVacanteId = "";
  });
});
