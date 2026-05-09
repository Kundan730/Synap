import fs from 'fs';
const req = await fetch('http://localhost:3000/api/visualize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'applet', topic: 'solar system simulation' })
});
const res = await req.json();
fs.writeFileSync('api-out3.html', res.htmlCode || 'failed');
console.log("Wrote to api-out3.html");
