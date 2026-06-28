import './style.css';

// 1. Navbar & Hero Scroll Effect
const header = document.querySelector('.header');
const heroContent = document.querySelector('.hero-content');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;

  // Trigger header solid background almost immediately to prevent text bleed-through
  if (scrollY > 10) {
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

// 4. Bento Box & Glass Button Hover Glow Effect
const handleBentoHover = (e) => {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  for (const card of document.querySelectorAll(".bento-hover, .btn-secondary")) {
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

// Add generic listener for buttons outside the about section (like hero section)
document.addEventListener("mousemove", (e) => {
  // Only trigger if mouse is actually over a button, for performance
  if (e.target.closest('.btn-secondary')) {
    handleBentoHover(e);
  }
});

// Enable Safari hover state & touch handling for cards
for (const card of document.querySelectorAll(".bento-hover, .btn-secondary")) {
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
    window.isNightGlobal = actualIsNight;

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

// Weather data automatically refreshes every 5 minutes.
// Click events are handled purely by widget.onclick to instantly replay animations without jerks.

let weatherTimer1;
let weatherTimer2;
window.isNightGlobal = false; // Used to track day/night for weather effects

// Helper to spawn a premium moon
function createMoon(extraClass = '') {
  const moonWrapper = document.createElement('div');
  moonWrapper.className = `moon-wrapper ${extraClass}`.trim();

  const moon = document.createElement('div');
  moon.className = 'moon';
  moonWrapper.appendChild(moon);

  // Drifting clouds passing in front of the moon
  for (let i = 0; i < 2; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'moon-cloud';
    cloud.style.animationDelay = `${i * 12}s`;
    cloud.style.top = `${20 + (i * 40)}%`;
    moonWrapper.appendChild(cloud);
  }

  return moonWrapper;
}

// Helper function to spawn weather particles
function applyWeatherEffect(type, durationMs = 3000, forceNight = null) {
  const isNight = forceNight !== null ? forceNight : window.isNightGlobal;
  const container = document.getElementById('weather-effects');
  const bgContainer = document.getElementById('weather-effects-bg');
  if (!container || !bgContainer) return;

  // Clear existing timeouts and elements so it resets smoothly if clicked repeatedly
  clearTimeout(weatherTimer1);
  clearTimeout(weatherTimer2);
  container.innerHTML = '';
  bgContainer.innerHTML = '';
  container.style.opacity = '1';
  bgContainer.style.opacity = '1';
  container.style.transition = 'none';
  bgContainer.style.transition = 'none';

  if (type === 'thunder' || type === 'storm') {
    const flash = document.createElement('div');
    flash.className = 'lightning-flash';
    bgContainer.appendChild(flash);

    // Add the top-right focal storm cloud
    const cloud = document.createElement('div');
    cloud.className = 'storm-cloud';
    bgContainer.appendChild(cloud);

    // Add realistic lightning bolts striking from the cloud
    const boltCount = type === 'storm' ? 2 : 1;
    for (let i = 0; i < boltCount; i++) {
      const bolt = document.createElement('div');
      bolt.className = 'lightning-bolt';

      // Position them precisely under the cloud in the top right
      if (i === 0) {
        bolt.style.right = '80px';
        bolt.style.animationDelay = '0.5s';
      } else {
        bolt.style.right = '180px';
        bolt.style.animationDelay = '2.5s';
        bolt.style.transform = 'scaleX(-1) scaleY(0.8)';
      }

      // Premium crisp glowing SVG lightning bolt
      bolt.innerHTML = `
        <svg viewBox="0 0 100 200" preserveAspectRatio="none" style="width:100%; height:100%;">
            <filter id="glow-${i}">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <polygon points="70,0 20,90 55,90 0,200 90,100 45,100 100,0" fill="#ffffff" filter="url(#glow-${i})" />
        </svg>
        `;
      bgContainer.appendChild(bolt);
    }
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
    bgContainer.appendChild(sun);
  } else if (type === 'night' || type === 'evening') {
    const celestial = createMoon();
    bgContainer.appendChild(celestial);

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
    const celestial = isNight ? createMoon('moon-cool') : (() => {
      const el = document.createElement('div');
      el.className = 'sun sun-cool';
      return el;
    })();
    bgContainer.appendChild(celestial);

    // Premium Aurora Borealis effect
    const auroraContainer = document.createElement('div');
    auroraContainer.className = 'aurora-container';
    const aurora = document.createElement('div');
    aurora.className = 'aurora';
    auroraContainer.appendChild(aurora);
    bgContainer.appendChild(auroraContainer);

    const mist1 = document.createElement('div');
    mist1.className = 'mist mist-1';
    const mist2 = document.createElement('div');
    mist2.className = 'mist mist-2';
    bgContainer.appendChild(mist1);
    bgContainer.appendChild(mist2);

    for (let i = 0; i < 20; i++) {
      const frost = document.createElement('div');
      frost.className = 'frost';
      frost.style.left = `${Math.random() * 100}vw`;
      frost.style.top = `${Math.random() * 100}vh`;
      frost.style.animationDuration = `${4 + Math.random() * 4}s`;
      frost.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(frost);
    }
  } else if (type === 'snow') {
    const celestial = isNight ? createMoon('moon-snow') : (() => {
      const el = document.createElement('div');
      el.className = 'sun sun-snow';
      return el;
    })();
    bgContainer.appendChild(celestial);

    const snowBg = document.createElement('div');
    snowBg.className = 'weather-bg-snow';
    bgContainer.appendChild(snowBg);

    for (let i = 0; i < 120; i++) {
      const flake = document.createElement('div');
      flake.className = 'snow-flake';

      const size = Math.random() * 5 + 2;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;

      if (size > 5.5) flake.style.filter = 'blur(2px)';
      else if (size < 3) flake.style.opacity = '0.5';

      flake.style.left = `${Math.random() * 100}vw`;
      flake.style.setProperty('--sway', `${(Math.random() - 0.5) * 30}vw`);
      flake.style.setProperty('--max-opacity', `${Math.random() * 0.5 + 0.4}`);

      const duration = 6 + Math.random() * 10;
      const delay = Math.random() * -15;
      flake.style.animationDuration = `${duration}s`;
      flake.style.animationDelay = `${delay}s`;

      container.appendChild(flake);
    }
  } else if (type === 'rain' || type === 'storm' || type === 'thunder') {
    if (type === 'rain') {
      const celestial = isNight ? createMoon('moon-rain') : (() => {
        const el = document.createElement('div');
        el.className = 'sun sun-rain';
        return el;
      })();
      bgContainer.appendChild(celestial);
    }

    const rainBg = document.createElement('div');
    rainBg.className = 'weather-bg-rain';
    bgContainer.appendChild(rainBg);

    const isStorm = type === 'storm' || type === 'thunder';
    const count = isStorm ? 200 : 120;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.classList.add('rain-drop');

      const depth = Math.random();
      const isForeground = depth > 0.8;
      const isBackground = depth < 0.3;

      if (isForeground) {
        el.style.width = '1.5px';
        el.style.height = '25px';
        el.style.filter = 'blur(1px)';
        el.style.setProperty('--drop-opacity', `${0.2 + Math.random() * 0.15}`);
        el.style.zIndex = '5';
      } else if (isBackground) {
        el.style.width = '1px';
        el.style.height = '10px';
        el.style.setProperty('--drop-opacity', `${0.05 + Math.random() * 0.05}`);
        el.style.zIndex = '1';
      } else {
        el.style.width = '1px';
        el.style.height = '15px';
        el.style.setProperty('--drop-opacity', `${0.1 + Math.random() * 0.1}`);
        el.style.zIndex = '2';
      }

      el.style.left = `${Math.random() * 110 - 10}vw`;

      const baseDuration = isForeground ? 0.2 : (isBackground ? 0.6 : 0.4);
      const duration = (isStorm ? baseDuration * 0.5 : baseDuration) + Math.random() * 0.2;
      const delay = Math.random() * -5;

      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;

      if (isStorm) {
        el.classList.add('storm-drop');
      }
      container.appendChild(el);
    }
  }

  // Fade out and remove the effect after the specified duration
  weatherTimer1 = setTimeout(() => {
    container.style.transition = 'opacity 3s ease-out';
    bgContainer.style.transition = 'opacity 3s ease-out';
    container.style.opacity = '0';
    bgContainer.style.opacity = '0';

    // Completely clear the DOM elements after the fade-out completes
    weatherTimer2 = setTimeout(() => {
      container.innerHTML = '';
      bgContainer.innerHTML = '';
      container.style.opacity = '1'; // Reset for future calls if needed
      bgContainer.style.opacity = '1';
    }, 3000);
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

// ==========================================
// FOR TESTING PURPOSES ONLY: Weather Panel
// ==========================================
const ENABLE_TEST_PANEL = false; // Set to true to show weather test buttons

if (ENABLE_TEST_PANEL) {
  const testPanel = document.createElement('div');
  testPanel.style.position = 'fixed';
  testPanel.style.bottom = '10px';
  testPanel.style.left = '10px';
  testPanel.style.zIndex = '9999';
  testPanel.style.background = 'rgba(0,0,0,0.8)';
  testPanel.style.padding = '10px';
  testPanel.style.borderRadius = '8px';
  testPanel.style.display = 'flex';
  testPanel.style.gap = '5px';
  testPanel.style.flexWrap = 'wrap';
  testPanel.style.maxWidth = '250px';

  const scenarios = ['sunny', 'night', 'cool', 'rain', 'snow', 'storm', 'thunder'];
  scenarios.forEach(type => {
    const btn = document.createElement('button');
    btn.innerText = type;
    btn.style.padding = '5px 10px';
    btn.style.fontSize = '12px';
    btn.style.cursor = 'pointer';
    btn.style.background = 'var(--accent-2, #4FACFE)';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.textTransform = 'capitalize';

    btn.onclick = () => {
      applyWeatherEffect(type, 5000); // 5 seconds for easy viewing
    };

    testPanel.appendChild(btn);
  });

  document.body.appendChild(testPanel);
}

// ==========================================
// 9. Mobile Menu Toggle
// ==========================================
const hamburger = document.querySelector('.hamburger-menu');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close menu when clicking a link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

// ==========================================
// 10. Motivational Word Cycle Hover Effect
// ==========================================
const cycleElements = document.querySelectorAll('.extraordinary-hover');
const words = ['meaningful', 'impactful', 'innovative', 'extraordinary'];

cycleElements.forEach(el => {
  // Ensure the element behaves as an inline block for perfect text alignment
  el.style.display = 'inline-block';
  el.style.transition = 'opacity 0.2s ease';

  const startCycle = async () => {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Infinite loop to run automatically
    while (true) {
      // Lock the width before changing text to PREVENT JIGGLING!
      const currentWidth = el.offsetWidth;
      el.style.width = `${currentWidth}px`;
      el.style.textAlign = 'center';

      // Add transform and filter to the CSS transition for the slam effect
      el.style.transition = 'opacity 0.2s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.3s ease';

      // Cycle through words
      for (let i = 0; i < words.length; i++) {
        el.style.opacity = '0';

        // If it's the final word, start it huge, slightly higher, and blurred
        if (i === words.length - 1) {
          el.style.transform = 'scale(1.5) translateY(-10px)';
          el.style.filter = 'blur(10px)';
        } else {
          el.style.transform = 'scale(1) translateY(0)';
          el.style.filter = 'blur(0)';
        }

        await sleep(200);

        const textSpan = el.querySelector('.gradient-text');
        if (textSpan) {
          textSpan.innerText = words[i];
        } else {
          el.innerText = words[i]; // Fallback
        }

        el.style.opacity = '1';

        // If it's the final word, slam it back into place and sharpen it
        if (i === words.length - 1) {
          el.style.transform = 'scale(1) translateY(0)';
          el.style.filter = 'blur(0)';

          // Add the cinematic water wave flow effect
          if (textSpan) {
            textSpan.classList.add('water-wave');

            // Remove the effect after 3 seconds
            setTimeout(() => {
              textSpan.classList.remove('water-wave');
            }, 3000);
          }
        }

        // Hold the word, unless it's the last one
        if (i < words.length - 1) {
          await sleep(600);
        }
      }

      // Unlock width to allow for responsive browser resizing again
      el.style.width = 'auto';

      // Wait for the water wave effect (3s) plus a small pause before restarting the cycle
      await sleep(4000);
    }
  };

  // Start the automatic cycle immediately on page load
  startCycle();
});

// ==========================================
// 11. Top Scroll Progress Bar
// ==========================================
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;

  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    progressBar.style.width = scrolled + '%';
  }
}, { passive: true });
