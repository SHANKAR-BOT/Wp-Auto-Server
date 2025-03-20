function generateQR() {
  fetch('/generate-qr')
    .then(res => res.json())
    .then(data => {
      document.getElementById('qr-container').innerHTML = `<img src="${data.qrImage}" alt="Scan QR">`;
      document.getElementById('pair-status').innerText = "Scan this QR with WhatsApp";
    });
}

function startSending() {
  const form = document.getElementById('upload-form');
  const formData = new FormData(form);
  formData.append('number', document.getElementById('targetNumber').value);
  formData.append('message', document.getElementById('message').value);
  formData.append('interval', document.getElementById('interval').value);

  fetch('/start', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
      document.getElementById('start-response').innerHTML = `Started! Use stop key: <b>${data.stopKey}</b>`;
    });
}

function stopServer() {
  const key = document.getElementById('stopKey').value;
  fetch('/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  })
  .then(res => res.json())
  .then(data => alert(data.msg));
}
