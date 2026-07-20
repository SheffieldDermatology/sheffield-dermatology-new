const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  navigation.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
  document.body.classList.remove('menu-open');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

const dateInput = document.querySelector('#appointment-date');
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = tomorrow.toISOString().split('T')[0];

const form = document.querySelector('#booking-form');
const steps = [...document.querySelectorAll('.form-step')];
const progress = [...document.querySelectorAll('.progress-step')];
let currentStep = 1;

function showStep(number) {
  currentStep = number;
  steps.forEach(step => step.classList.toggle('active', Number(step.dataset.step) === number));
  progress.forEach((item, index) => {
    const stepNumber = index + 1;
    item.classList.toggle('active', stepNumber === number);
    item.classList.toggle('complete', stepNumber < number);
    item.disabled = stepNumber > number;
  });
  document.querySelector('.booking-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validateStep(number) {
  const error = document.querySelector(`#step-${['one', 'two', 'three'][number - 1]}-error`);
  error.textContent = '';
  if (number === 1 && !form.querySelector('input[name="service"]:checked')) {
    error.textContent = 'Please select the appointment that best matches your concern.';
    return false;
  }
  if (number === 2) {
    if (!dateInput.value) {
      error.textContent = 'Please choose a preferred date.';
      return false;
    }
    if (!form.querySelector('input[name="time"]:checked')) {
      error.textContent = 'Please choose a preferred time.';
      return false;
    }
  }
  return true;
}

document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
  if (validateStep(currentStep)) showStep(Number(button.dataset.next));
}));

document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => {
  showStep(Number(button.dataset.back));
}));

progress.forEach(button => button.addEventListener('click', () => {
  const target = Number(button.dataset.progress);
  if (target < currentStep) showStep(target);
}));

form.addEventListener('submit', event => {
  event.preventDefault();
  const requiredFields = [...form.querySelectorAll('[data-step="3"] [required]')];
  const invalid = requiredFields.find(field => !field.checkValidity());
  const error = document.querySelector('#step-three-error');
  error.textContent = '';
  if (invalid) {
    error.textContent = invalid.type === 'checkbox' ? 'Please confirm that we may use your details to contact you.' : 'Please complete all contact details with a valid email address.';
    invalid.focus();
    return;
  }
  const data = new FormData(form);
  const preferredDate = new Date(`${data.get('date')}T12:00:00`);
  const dateText = preferredDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.querySelector('#success-name').textContent = data.get('firstName');
  document.querySelector('#success-summary').textContent = `${data.get('service')} (${data.get('visit')}) on ${dateText} at ${data.get('time')}`;
  steps.forEach(step => step.classList.remove('active'));
  document.querySelector('.booking-progress').hidden = true;
  document.querySelector('.form-success').hidden = false;
});

document.querySelector('#start-again').addEventListener('click', () => {
  form.reset();
  form.querySelector('input[name="visit"][value="In-person"]').checked = true;
  document.querySelector('.form-success').hidden = true;
  document.querySelector('.booking-progress').hidden = false;
  showStep(1);
});

document.querySelector('#cookie-close').addEventListener('click', () => {
  document.querySelector('#cookie-banner').classList.add('hidden');
});

document.querySelector('#current-year').textContent = new Date().getFullYear();
