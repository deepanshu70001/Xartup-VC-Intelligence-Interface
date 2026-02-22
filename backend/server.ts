import "dotenv/config";
import { createApp } from "./src/server/app.ts";

async function startServer() {
  const { app, port } = await createApp();

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
