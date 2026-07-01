import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/database";

const suffix = Date.now();
const throwawayEmail = `test-users-throwaway-${suffix}@talentflow.com`;
const activeEmail = `test-users-active-${suffix}@talentflow.com`;
const password = "password123";

let adminToken: string;
let throwawayToken: string;
let throwawayId: string;
let activeId: string;
let activeVacanteId: string;

async function registerAndLogin(email: string, rol: "RECLUTADOR" | "POSTULANTE") {
  const registerRes = await request(app).post("/api/auth/register").send({
    nombre: "Usuario de Prueba",
    email,
    password,
    rol,
  });
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  return { id: registerRes.body.data.user.id as string, token: loginRes.body.data.accessToken as string };
}

describe("Users", () => {
  beforeAll(async () => {
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@talentflow.com", password: "Talentflow123!" });
    adminToken = adminLogin.body.data.accessToken;

    const throwaway = await registerAndLogin(throwawayEmail, "POSTULANTE");
    throwawayId = throwaway.id;
    throwawayToken = throwaway.token;

    const active = await registerAndLogin(activeEmail, "RECLUTADOR");
    activeId = active.id;

    const vacante = await request(app)
      .post("/api/vacantes")
      .set("Authorization", `Bearer ${active.token}`)
      .send({
        titulo: `Vacante Users Test ${suffix}`,
        descripcion: "Descripción con longitud suficiente para pasar la validación.",
        requisitos: "Requisitos de prueba con longitud suficiente",
        ubicacion: "Lima, Perú",
        modalidad: "REMOTO",
        estado: "ABIERTA",
      });
    activeVacanteId = vacante.body.data.vacante.id;
  });

  afterAll(async () => {
    if (activeVacanteId) {
      await prisma.vacante.deleteMany({ where: { id: activeVacanteId } });
    }
    await prisma.user.deleteMany({ where: { email: { in: [throwawayEmail, activeEmail] } } });
    await prisma.$disconnect();
  });

  it("rechaza listar usuarios a alguien que no es ADMIN", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${throwawayToken}`);
    expect(res.status).toBe(403);
  });

  it("permite a un ADMIN listar usuarios", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users[0].passwordHash).toBeUndefined();
  });

  it("permite actualizar el propio perfil", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${throwawayToken}`)
      .send({ nombre: "Nombre Actualizado", rol: "ADMIN" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.nombre).toBe("Nombre Actualizado");
    expect(res.body.data.user.rol).toBe("POSTULANTE");
  });

  it("permite a un ADMIN obtener y actualizar el rol de otro usuario", async () => {
    const getRes = await request(app).get(`/api/users/${throwawayId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/users/${throwawayId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rol: "RECLUTADOR" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.user.rol).toBe("RECLUTADOR");
  });

  it("bloquea eliminar un usuario con actividad registrada", async () => {
    const res = await request(app).delete(`/api/users/${activeId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });

  it("elimina un usuario sin actividad registrada", async () => {
    const res = await request(app).delete(`/api/users/${throwawayId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    throwawayId = "";
  });
});
