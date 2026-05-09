import fs from "fs";

async function run() {
  const res = await fetch("http://localhost:3000/api/visualize", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "A simple, interactive simulation of the solar system showing planets orbiting the sun.", type: "applet" }),
  });
  const data = await res.json();
  fs.writeFileSync("test-solarsystem.html", data.htmlCode || "");
  console.log("Written test-solarsystem.html length: ", (data.htmlCode || "").length);
}
run();
