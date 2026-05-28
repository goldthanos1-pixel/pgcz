// static/app.js
// Demo user id – in real app use auth token / session
const USER_ID = 'demo-user';

// Helper to add X-User-Id header
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': USER_ID,
  };
}

// Fetch and render existing records
async function loadRecords() {
  const res = await fetch('/api/data', {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) return console.error('Failed to load records');
  const records = await res.json();
  const container = document.getElementById('recordsContainer');
  container.innerHTML = '';
  records.forEach(renderRecord);
}

// Render a single record as a semi‑transparent neon card
function renderRecord(rec) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = rec.id;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '✖';
  deleteBtn.title = 'Delete';
  deleteBtn.onclick = () => deleteRecord(rec.id, card);

  const content = document.createElement('div');
  content.textContent = rec.data;

  const timestamp = document.createElement('small');
  timestamp.style.display = 'block';
  timestamp.style.opacity = '0.6';
  timestamp.textContent = new Date(rec.created_at).toLocaleString();

  card.appendChild(deleteBtn);
  card.appendChild(content);
  card.appendChild(timestamp);
  document.getElementById('recordsContainer').appendChild(card);
}

// POST a new record
async function addRecord() {
  const input = document.getElementById('dataInput');
  const value = input.value.trim();
  if (!value) return alert('Please enter some text');

  const res = await fetch('/api/data', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ data: value }),
  });

  if (!res.ok) {
    const err = await res.json();
    return alert('Error: ' + (err.error || 'unknown'));
  }
  const newRec = await res.json();
  renderRecord(newRec);
  input.value = '';
}

// DELETE request and UI removal
async function deleteRecord(id, element) {
  const confirmed = confirm('Delete this record?');
  if (!confirmed) return;
  const res = await fetch(`/api/data/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    return alert('Delete failed: ' + (err.error || 'unknown'));
  }
  // Remove card from DOM with fade‑out effect
  element.style.transition = 'opacity 0.3s';
  element.style.opacity = '0';
  setTimeout(() => element.remove(), 300);
}

// Event listeners
document.getElementById('addBtn').addEventListener('click', addRecord);
// Optional: press Enter to submit
document.getElementById('dataInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addRecord();
});

// Initial load
loadRecords();
