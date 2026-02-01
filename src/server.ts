// src/server.ts
import { createApp } from "./app";
import { buildContainer } from "./container";

export async function startServer() {
    const deps = buildContainer();
    const app = createApp(deps);

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}
