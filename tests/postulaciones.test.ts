import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/database";

const suffix = Date.now();
const reclutadorEmail = `test-post-reclutador-${suffix}@talentflow.com`;
const otroReclutadorEmail = `test-post-otro-reclutador-${suffix}@talentflow.com`;
const postulanteEmail = `test-post-postulante-${suffix}@talentflow.com`;
const postulante2Email = `test-post-postulante2-${suffix}@talentflow.com`;
const password = "password123";

let reclutadorToken: string;
let otroReclutadorToken: string;
let postulanteToken: string;
let postulante2Token: string;

let vacanteAbiertaId: string;
let vacanteBorradorId: string;
let postulacionId: string;

async function registerAndLogin(email: string, rol: "RECLUTADOR" | "POSTULANTE") {
  await request(app).post("/api/auth/register").send({ nombre: "Usuario de Prueba", email, password, rol });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.data.accessToken as string;
}

describe("Postulaciones", () => {
  beforeAll(async () => {
    reclutadorToken = await registerAndLogin(reclutadorEmail, "RECLUTADOR");
    otroReclutadorToken = await registerAndLogin(otroReclutadorEmail, "RECLUTADOR");
    postulanteToken = await registerAndLogin(postulanteEmail, "POSTULANTE");
    postulante2Token = await registerAndLogin(postulante2Email, "POSTULANTE");

    const vacanteAbierta = await request(app)
      .post("/api/vacantes")
      .set("Authorization", `Bearer ${reclutadorToken}`)
      .send({
        titulo: `Vacante Abierta Postulaciones ${suffix}`,
        descripcion: "Descripción con longitud suficiente para pasar la validación.",
        requisitos: "Requisitos de prueba con longitud suficiente",
        ubicacion: "Lima, Perú",
        modalidad: "REMOTO",
        estado: "ABIERTA",
      });
    vacanteAbiertaId = vacanteAbierta.body.data.vacante.id;

    const vacanteBorrador = await request(app)
      .post("/api/vacantes")
      .set("Authorization", `Bearer ${reclutadorToken}`)
      .send({
        titulo: `Vacante Borrador Postulaciones ${suffix}`,
        descripcion: "Descripción con longitud suficiente para pasar la validación.",
        requisitos: "Requisitos de prueba con longitud suficiente",
        ubicacion: "Lima, Perú",
        modalidad: "REMOTO",
        estado: "BORRADOR",
      });
    vacanteBorradorId = vacanteBorrador.body.data.vacante.id;
  });

  afterAll(async () => {
    const vacanteIds = [vacanteAbiertaId, vacanteBorradorId].filter(Boolean);
    await prisma.historialEstado.deleteMany({ where: { postulacion: { vacanteId: { in: vacanteIds } } } });
    await prisma.postulacion.deleteMany({ where: { vacanteId: { in: vacanteIds } } });
    await prisma.vacante.deleteMany({ where: { id: { in: vacanteIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: [reclutadorEmail, otroReclutadorEmail, postulanteEmail, postulante2Email] } },
    });
    await prisma.$disconnect();
  });

  it("permite postular a una vacante ABIERTA", async () => {
    const res = await request(app)
      .post("/api/postulaciones")
      .set("Authorization", `Bearer ${postulanteToken}`)
      .send({ vacanteId: vacanteAbiertaId, observaciones: "Muy interesado en la posición" });

    expect(res.status).toBe(201);
    expect(res.body.data.postulacion.estado).toBe("POSTULADO");
    postulacionId = res.body.data.postulacion.id;
  });

  it("rechaza postular dos veces a la misma vacante", async () => {
    const res = await request(app)
      .post("/api/postulaciones")
      .set("Authorization", `Bearer ${postulanteToken}`)
      .send({ vacanteId: vacanteAbiertaId });

    expect(res.status).toBe(409);
  });

  it("rechaza postular a una vacante que no está ABIERTA", async () => {
    const res = await request(app)
      .post("/api/postulaciones")
      .set("Authorization", `Bearer ${postulante2Token}`)
      .send({ vacanteId: vacanteBorradorId });

    expect(res.status).toBe(409);
  });

  it("lista las postulaciones propias del postulante", async () => {
    const res = await request(app).get("/api/postulaciones/mias").set("Authorization", `Bearer ${postulanteToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.postulaciones.map((p: { id: string }) => p.id);
    expect(ids).toContain(postulacionId);
  });

  it("permite al reclutador dueño ver las postulaciones de su vacante", async () => {
    const res = await request(app)
      .get(`/api/postulaciones/vacante/${vacanteAbiertaId}`)
      .set("Authorization", `Bearer ${reclutadorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.postulaciones).toHaveLength(1);
  });

  it("rechaza a otro reclutador ver postulaciones de una vacante ajena", async () => {
    const res = await request(app)
      .get(`/api/postulaciones/vacante/${vacanteAbiertaId}`)
      .set("Authorization", `Bearer ${otroReclutadorToken}`);

    expect(res.status).toBe(403);
  });

  it("rechaza a un postulante ver una postulación ajena", async () => {
    const res = await request(app)
      .get(`/api/postulaciones/${postulacionId}`)
      .set("Authorization", `Bearer ${postulante2Token}`);

    expect(res.status).toBe(403);
  });

  it("rechaza a un POSTULANTE cambiar el estado de una postulación", async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionId}/estado`)
      .set("Authorization", `Bearer ${postulanteToken}`)
      .send({ estado: "EN_REVISION" });

    expect(res.status).toBe(403);
  });

  it("permite al reclutador dueño cambiar el estado y registra el historial", async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionId}/estado`)
      .set("Authorization", `Bearer ${reclutadorToken}`)
      .send({ estado: "EN_REVISION" });

    expect(res.status).toBe(200);
    expect(res.body.data.postulacion.estado).toBe("EN_REVISION");

    const historialRes = await request(app)
      .get(`/api/postulaciones/${postulacionId}/historial`)
      .set("Authorization", `Bearer ${reclutadorToken}`);

    expect(historialRes.status).toBe(200);
    expect(historialRes.body.data.historial).toHaveLength(2);
    expect(historialRes.body.data.historial[0].estadoNuevo).toBe("POSTULADO");
    expect(historialRes.body.data.historial[1].estadoNuevo).toBe("EN_REVISION");
    expect(historialRes.body.data.historial[1].estadoAnterior).toBe("POSTULADO");
  });

  it("rechaza cambiar a un estado igual al actual", async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionId}/estado`)
      .set("Authorization", `Bearer ${reclutadorToken}`)
      .send({ estado: "EN_REVISION" });

    expect(res.status).toBe(400);
  });
});
