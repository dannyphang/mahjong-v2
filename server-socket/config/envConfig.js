import env from "./environment.json" assert { type: "json" };
import envProd from "./environment.prod.json" assert { type: "json" };

const isDev = false;

const port = isDev ? env.port : envProd.port;

const apiBaseUrl = isDev ? env.api : envProd.api;

export { apiBaseUrl, port };
