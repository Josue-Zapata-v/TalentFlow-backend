import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/config/database";

const testEmail = `test-auth-${Date.now()}@talentflow.com`;
const testPassword = "password123";

describe("Auth", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("registra un usuario nuevo", async () => {
    const res = await request(app).post("/api/auth/register").send({
      nombre: "Usuario de Prueba",
      email: testEmail,
      password: testPassword,
      rol: "POSTULANTE",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it("rechaza el registro con un email ya existente", async () => {
    const res = await request(app).post("/api/auth/register").send({
      nombre: "Otro Usuario",
      email: testEmail,
      password: testPassword,
      rol: "POSTULANTE",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("hace login con credenciales correctas", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it("rechaza el login con contraseña incorrecta", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "contraseña-incorrecta",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("devuelve el perfil autenticado en /me con un access token válido", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });
    const { accessToken } = loginRes.body.data;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it("rechaza /me sin token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
