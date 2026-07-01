/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  testTimeout: 30000,
  // Serializado: todos los tests comparten el mismo pool de conexiones de
  // Supabase; correr los archivos en paralelo lo satura y causa timeouts.
  maxWorkers: 1,
};
