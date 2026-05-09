import fs from 'fs';
const req = await fetch('http://localhost:3000/api/visualize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'applet', topic: 'A realistic, interactive 3D simulation of the solar system with planetary orbits and relative speeds' })
});
const res = await req.json();
fs.writeFileSync('api-out5.html', res.htmlCode || 'failed');
console.log("Wrote to api-out5.html");
