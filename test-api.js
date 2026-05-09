const req = await fetch('http://localhost:3000/api/visualize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'applet', topic: 'solar system simulation' })
});
const res = await req.json();
console.log(res.htmlCode.substring(res.htmlCode.indexOf('// --- AI GENERATED CODE START ---'), res.htmlCode.indexOf('// --- AI GENERATED CODE END ---')));
