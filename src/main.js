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
const handleBentoHover = (e) => {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  for (const card of document.getElementsByClassName("bento-hover")) {
    const rect = card.getBoundingClientRect(),
      x = clientX - rect.left,
      y = clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }
};

const aboutSection = document.getElementById("about");
if (aboutSection) {
  aboutSection.addEventListener("mousemove", handleBentoHover);
  aboutSection.addEventListener("touchmove", handleBentoHover, { passive: true });
}

// Enable Safari hover state & touch handling for cards
for (const card of document.getElementsByClassName("bento-hover")) {
  card.addEventListener("touchstart", (e) => {
    handleBentoHover(e);
    card.classList.add("touch-hover");
  }, { passive: true });

  card.addEventListener("touchend", () => {
    card.classList.remove("touch-hover");
  }, { passive: true });

  card.addEventListener("touchcancel", () => {
    card.classList.remove("touch-hover");
  }, { passive: true });
}

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

    const isApiDay = weatherData.current_weather.is_day;
    const hour = new Date().getHours();
    const actualIsNight = isApiDay !== undefined ? isApiDay === 0 : (hour < 6 || hour >= 18);

    const determineEffect = (wCode, wTemp) => {
      if (wCode >= 95) return 'storm';
      if (wCode >= 71 && wCode <= 77) return wTemp > 15 ? 'rain' : 'snow';
      if (wCode >= 51 && wCode <= 67) return 'rain';
      if (wCode === 0) return actualIsNight ? 'night' : (wTemp <= 15 ? 'cool' : 'sunny');
      if (wCode >= 1 && wCode <= 48) {
        if (wTemp >= 30) return 'sunny';
        if (wTemp <= 15) return 'cool';
        return actualIsNight ? 'night' : 'sunny';
      }
      return actualIsNight ? 'night' : 'sunny';
    };

    const effectType = determineEffect(code, temp);

    // 3. Map WMO Weather Codes to Emojis and Trigger Animations
    let emoji = '🌤️';
    if (code === 0) emoji = actualIsNight ? '🌙' : '☀️';
    else if (code >= 1 && code <= 3) emoji = actualIsNight ? '☁️' : '⛅';
    else if (code >= 45 && code <= 48) emoji = '🌫️';
    else if (code >= 51 && code <= 67) emoji = '🌧️';
    else if (code >= 71 && code <= 77) emoji = '❄️';
    else if (code >= 95) emoji = '⛈️';

    applyWeatherEffect(effectType);

    // 4. Update UI and reveal
    widget.innerHTML = `<span class="weather-icon">${emoji}</span><span class="weather-text">${temp}°C in ${city}</span>`;
    widget.style.display = 'flex';
    widget.style.cursor = 'pointer'; // Make it clear it's interactive

    // 5. Click event to replay animation
    widget.onclick = () => {
      applyWeatherEffect(determineEffect(code, temp), 4000);
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
function applyWeatherEffect(type, durationMs = 3000) {
  const container = document.getElementById('weather-effects');
  if (!container) return;

  // Clear existing timeouts and elements so it resets smoothly if clicked repeatedly
  clearTimeout(weatherTimer1);
  clearTimeout(weatherTimer2);
  container.innerHTML = '';
  container.style.opacity = '1';
  container.style.transition = 'none';

  if (type === 'thunder' || type === 'storm') {
    const flash = document.createElement('div');
    flash.className = 'lightning-flash';
    container.appendChild(flash);
  }

  if (type === 'sunny') {
    const sun = document.createElement('div');
    sun.className = 'sun';
    const ray = document.createElement('div');
    ray.className = 'sun-ray';
    sun.appendChild(ray);
    for (let i = 0; i < 30; i++) {
      const dust = document.createElement('div');
      dust.className = 'sun-dust';
      dust.style.left = `${Math.random() * 100}vw`;
      dust.style.top = `${Math.random() * 100}vh`;
      dust.style.animationDuration = `${3 + Math.random() * 4}s`;
      dust.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(dust);
    }
    container.appendChild(sun);
  } else if (type === 'night' || type === 'evening') {
    const moon = document.createElement('div');
    moon.className = 'moon';
    container.appendChild(moon);

    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}vw`;
      star.style.top = `${Math.random() * 100}vh`;
      star.style.animationDuration = `${1 + Math.random() * 3}s`;
      star.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(star);
    }
  } else if (type === 'cool') {
    const mist1 = document.createElement('div');
    mist1.className = 'mist mist-1';
    const mist2 = document.createElement('div');
    mist2.className = 'mist mist-2';
    container.appendChild(mist1);
    container.appendChild(mist2);

    for (let i = 0; i < 20; i++) {
      const frost = document.createElement('div');
      frost.className = 'frost';
      frost.style.left = `${Math.random() * 100}vw`;
      frost.style.top = `${Math.random() * 100}vh`;
      frost.style.animationDuration = `${4 + Math.random() * 4}s`;
      frost.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(frost);
    }
  } else if (type === 'rain' || type === 'snow' || type === 'storm' || type === 'thunder') {
    const isRain = type === 'rain' || type === 'storm' || type === 'thunder';
    const isStorm = type === 'storm' || type === 'thunder';
    const count = isRain ? (isStorm ? 120 : 80) : 40;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.classList.add(isRain ? 'rain-drop' : 'snow-flake');
      el.style.left = `${Math.random() * 100}vw`;
      const duration = isRain ? ((isStorm ? 0.2 : 0.4) + Math.random() * 0.3) : (3 + Math.random() * 4);
      const delay = Math.random() * 2;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;
      if (isStorm && isRain) {
        el.classList.add('storm-drop');
      }
      container.appendChild(el);
    }
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

// 9. 3D Flip Quotes Animation
const flipper = document.getElementById('quote-flipper');
const backText = document.getElementById('quote-back');
const loveIcon = document.querySelector('.love-icon');

if (flipper && backText && loveIcon) {
  const triggerFlip = (e) => {
    if (e && e.type === 'touchstart') {
      flipper.dataset.touched = 'true';
    } else if (e && e.type === 'mouseenter' && flipper.dataset.touched === 'true') {
      setTimeout(() => flipper.dataset.touched = 'false', 500);
      return;
    }

    if (flipper.classList.contains('flipped')) return;

    const quotes = [
      "Quality is doing it right when no one is looking. - Henry Ford",
      "Success is no accident. It is hard work. - Pelé",
      "The harder I work, the more luck I have. - Thomas Jefferson",
      "Hard work beats talent when talent doesn't work hard. - Tim Notke",
      "Full effort is full victory. - Mahatma Gandhi",
      "Success comes before work only in the dictionary. - Vidal Sassoon"
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    backText.innerText = `"${randomQuote}"`;

    flipper.classList.add('flipped');

    // Flip back after 5 seconds
    setTimeout(() => {
      flipper.classList.remove('flipped');
    }, 5000);
  };

  // Use mouseenter for hover (desktop) and touchstart for tap (mobile)
  loveIcon.addEventListener('mouseenter', triggerFlip);
  loveIcon.addEventListener('touchstart', triggerFlip, { passive: true });
}
