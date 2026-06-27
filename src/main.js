import './style.css';

// 1. Navbar Scroll Effect
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// 2. Intersection Observer for Scroll Reveal
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach((el) => {
  observer.observe(el);
});

// 3. Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    e.preventDefault();
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      const headerOffset = 100;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// 4. Bento Box Hover Glow Effect
document.getElementById("about").onmousemove = e => {
  for (const card of document.getElementsByClassName("bento-hover")) {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }
};

// 5. Premium 3D Tilt Effect for Cards
const tiltElements = document.querySelectorAll('.bento-card, .project-showcase');

tiltElements.forEach(el => {
  // Initial transition for smooth snapping back
  el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease';

  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Quick transition during active mouse movement to avoid lag
    el.style.transition = 'transform 0.1s ease-out, border-color 0.3s ease, box-shadow 0.3s ease';

    // Calculate rotation (-4 to 4 degrees for a subtle but noticeable effect)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    // Apply 3D transform and dynamic shadow
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  el.addEventListener('mouseleave', () => {
    // Restore the smooth bounce-back transition
    el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease';
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
});

// 7. Dynamic Weather Widget
async function fetchWeather() {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  try {
    // 1. Get Location via IP
    const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!geoRes.ok) throw new Error('Location fetch failed');
    const geoData = await geoRes.json();
    const lat = geoData.latitude;
    const lon = geoData.longitude;
    const city = geoData.city;

    // 2. Get Weather from Open-Meteo (Free, no API key required)
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    if (!weatherRes.ok) throw new Error('Weather fetch failed');
    const weatherData = await weatherRes.json();
    const temp = Math.round(weatherData.current_weather.temperature);
    const code = weatherData.current_weather.weathercode;

    // 3. Map WMO Weather Codes to Emojis and Trigger Animations
    let emoji = '🌤️';
    if (code === 0) emoji = '☀️'; // Clear
    else if (code >= 1 && code <= 3) emoji = '⛅'; // Partly cloudy
    else if (code >= 45 && code <= 48) emoji = '🌫️'; // Fog
    else if (code >= 51 && code <= 67) {
      emoji = '🌧️';
      applyWeatherEffect('rain');
    }
    else if (code >= 71 && code <= 77) {
      emoji = '❄️';
      applyWeatherEffect('snow');
    }
    else if (code >= 95) {
      emoji = '⛈️';
      applyWeatherEffect('rain');
    }

    // 4. Update UI and reveal
    widget.innerHTML = `<span class="weather-icon">${emoji}</span><span class="weather-text">${temp}°C in ${city}</span>`;
    widget.style.display = 'flex';
    widget.style.cursor = 'pointer'; // Make it clear it's interactive

    // 5. Click event to replay animation
    widget.onclick = () => {
      let effectType = 'rain';
      if (code >= 71 && code <= 77) effectType = 'snow';
      // If it's clear/cloudy out, we spawn a random effect as a playful easter egg
      else if (code === 0 || (code >= 1 && code <= 48)) effectType = Math.random() > 0.5 ? 'rain' : 'snow';

      applyWeatherEffect(effectType, 3000);
    };
  } catch (error) {
    // If anything fails (adblocker, no location, etc), we do absolutely nothing. 
    // The widget remains display: none and does not affect the UI.
    console.log("Weather widget disabled due to location/fetch failure.");
  }
}

// Initialize Weather Widget
fetchWeather();

// 1. Auto-update weather every 5 minutes (300000ms) without refreshing the page
setInterval(fetchWeather, 300000);

// 2. Allow user to manually update weather by clicking the widget
const weatherWidgetElement = document.getElementById('weather-widget');
if (weatherWidgetElement) {
  weatherWidgetElement.style.cursor = 'pointer';
  weatherWidgetElement.title = 'Click to refresh weather';

  weatherWidgetElement.addEventListener('click', async () => {
    // Briefly fade out to indicate it's fetching new data
    weatherWidgetElement.style.opacity = '0.5';
    await fetchWeather();
    weatherWidgetElement.style.opacity = '1';
  });
}

let weatherTimer1;
let weatherTimer2;

// Helper function to spawn weather particles
function applyWeatherEffect(type, durationMs = 10000) {
  const container = document.getElementById('weather-effects');
  if (!container) return;

  // Clear existing timeouts and elements so it resets smoothly if clicked repeatedly
  clearTimeout(weatherTimer1);
  clearTimeout(weatherTimer2);
  container.innerHTML = '';
  container.style.opacity = '1';
  container.style.transition = 'none';

  const count = type === 'rain' ? 80 : 40; // Adjust density

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.classList.add(type === 'rain' ? 'rain-drop' : 'snow-flake');

    // Random horizontal position across the screen
    el.style.left = `${Math.random() * 100}vw`;

    // Vary the speed and delay for a natural effect
    const duration = type === 'rain' ? (0.6 + Math.random() * 0.4) : (3 + Math.random() * 4);
    const delay = Math.random() * 3;

    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;

    container.appendChild(el);
  }

  // Fade out and remove the effect after the specified duration
  weatherTimer1 = setTimeout(() => {
    container.style.transition = 'opacity 1s ease';
    container.style.opacity = '0';

    // Completely clear the DOM elements after the fade-out completes
    weatherTimer2 = setTimeout(() => {
      container.innerHTML = '';
      container.style.opacity = '1'; // Reset for future calls if needed
    }, 1000);
  }, durationMs);
}

// 8. Logo Click Surprise Animation (3D Flip & Sonar Wave)
const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('click', (e) => {
    e.preventDefault();

    // Prevent overlapping clicks
    if (logo.classList.contains('logo-flip')) return;

    // 1. Add 3D Flip class
    logo.classList.add('logo-flip');
    setTimeout(() => logo.classList.remove('logo-flip'), 800);

    // 2. Spawn a fixed sonar wave from the logo center
    // This is appended to the body, so it never affects the header layout
    const rect = logo.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const wave = document.createElement('div');
    wave.className = 'sonar-wave';
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;

    document.body.appendChild(wave);

    setTimeout(() => wave.remove(), 1000);
  });
}
