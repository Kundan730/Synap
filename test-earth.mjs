const res = await fetch("http://localhost:3000/api/visualize", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic: "generate a simple 3d simulation of the earth", type: "applet" }),
});
const data = await res.json();
const fs = await import("fs");
fs.writeFileSync("test-earth.html", data.htmlCode || "");
console.log("Written test-earth.html");
