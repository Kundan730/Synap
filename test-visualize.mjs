// Quick test: call the visualize API and inspect the output HTML
const resp = await fetch("http://localhost:3000/api/visualize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic: "Interactive map of India with states", type: "applet" }),
});

const data = await resp.json();

if (data.error) {
  console.error("API Error:", data.error);
  process.exit(1);
}

console.log("=== STATUS:", resp.status, "===");
console.log("=== HTML LENGTH:", data.htmlCode?.length, "===");
console.log("");
console.log("=== FIRST 500 CHARS ===");
console.log(data.htmlCode?.substring(0, 500));
console.log("");
console.log("=== LAST 500 CHARS ===");
console.log(data.htmlCode?.substring(data.htmlCode.length - 500));

// Write to file for full inspection
const fs = await import("fs");
fs.writeFileSync("test-output.html", data.htmlCode || "EMPTY");
console.log("\n=== Written full HTML to test-output.html ===");
