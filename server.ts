import app from "./server/app";
import { createServer as createViteServer } from "vite";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Stake Exchange running on http://0.0.0.0:${PORT}`)
  );
}
start();