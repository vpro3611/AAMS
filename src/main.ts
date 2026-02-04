

import {startServer} from "./server";

startServer().catch((err) => {
    console.error("Fatal error on startup: ", err);
    process.exit(1);
})

