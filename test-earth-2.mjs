import fs from "fs";

async function run() {
  const res = await fetch("http://localhost:3000/api/visualize", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: "generate the 3D Earth simulation", type: "applet" }),
  });
  const data = await res.json();
  fs.writeFileSync("test-earth-2.html", data.htmlCode || "");
  console.log("Written test-earth-2.html length: ", (data.htmlCode || "").length);
}
run();
