// scripts/copy404.cjs
const fs = require("fs");
const src = "build/index.html";
const dst = "build/404.html";
if (fs.existsSync("build/index.html")) {
  fs.copyFileSync("build/index.html", "build/404.html");
  console.log("Created build/404.html");
}
} else {
  console.warn("index.html not found; run build first.");
}

