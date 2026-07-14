// Validación mínima de entorno al arrancar (T014). El .env se lee al iniciar.
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Falta la variable de entorno obligatoria: ${key}`);
    }
  }
  return config;
}
