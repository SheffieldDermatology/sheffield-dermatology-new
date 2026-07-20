const navItems = [...document.querySelectorAll('.nav-item')];
const views = [...document.querySelectorAll('.workspace-view')];
const sidebar = document.querySelector('.sidebar');
const toast = document.querySelector('#portal-toast');

function showView(id) {
  const view = document.querySelector(`#${id}`);
  if (!view) return;
  views.forEach(item => item.classList.toggle('active', item === view));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.view === id));
  document.title = `${view.dataset.title} | Sheffield Dermatology`;
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.querySelectorAll('[data-view-link]').forEach(item => item.addEventListener('click', () => showView(item.dataset.viewLink)));
document.querySelectorAll('[data-open-scribe]').forEach(item => item.addEventListener('click', () => showView('scribe')));
document.querySelector('.sidebar-toggle').addEventListener('click', () => sidebar.classList.toggle('open'));

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
}

const consent = document.querySelector('#scribe-consent');
const recordButton = document.querySelector('#record-button');
consent.addEventListener('change', () => { recordButton.disabled = !consent.checked; });
recordButton.addEventListener('click', () => showToast('Prototype only — no microphone or patient data has been accessed.'));
document.querySelector('#upload-demo').addEventListener('click', () => showToast('File upload is disabled until secure storage and access controls are connected.'));

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('.topbar .search input').focus();
  }
});
