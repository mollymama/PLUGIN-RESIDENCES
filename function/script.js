function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth"
  });
}

function initAutoHideHeader() {
  const header = document.querySelector("header");

  if (!header) {
    return;
  }

  let lastScrollY = window.scrollY;
  let isPointerNearTop = false;

  function showHeader() {
    header.classList.remove("header-hidden");
  }

  function hideHeader() {
    if (!isPointerNearTop && window.scrollY > 80) {
      header.classList.add("header-hidden");
    }
  }

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= 40 || currentScrollY < lastScrollY) {
      showHeader();
    } else if (currentScrollY > lastScrollY) {
      hideHeader();
    }

    lastScrollY = currentScrollY;
  });

  window.addEventListener("mousemove", event => {
    isPointerNearTop = event.clientY < 80;

    if (isPointerNearTop) {
      showHeader();
    } else if (window.scrollY > 80) {
      hideHeader();
    }
  });

  header.addEventListener("mouseenter", () => {
    isPointerNearTop = true;
    showHeader();
  });

  header.addEventListener("mouseleave", () => {
    isPointerNearTop = false;
    hideHeader();
  });
}

function flipLifestyleTitle() {
  const title = document.querySelector(".kinetic-title");

  if (!title) {
    return;
  }

  title.classList.toggle("is-flipped");
}

function handleTitleKey(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    flipLifestyleTitle();
  }
}

const locationSites = [
  {
    id: "beitou",
    name: "Beitou Studio Site",
    district: "Taipei / Beitou",
    type: "Adaptive Reuse",
    description: "Former production landscape with potential for live-work housing and public courtyard systems.",
    coordinates: [25.1375, 121.5021]
  },
  {
    id: "nangang",
    name: "Nangang Industrial Edge",
    district: "Taipei / Nangang",
    type: "Transit + Industry",
    description: "Industrial fringe close to rail and metro infrastructure, suitable for logistics and creator units.",
    coordinates: [25.0553, 121.6071]
  },
  {
    id: "wugu",
    name: "Wugu Production Belt",
    district: "New Taipei / Wugu",
    type: "Light Industry",
    description: "Large-format production blocks that can support modular housing and shared work courtyards.",
    coordinates: [25.0842, 121.4386]
  },
  {
    id: "sanchong",
    name: "Sanchong River Interface",
    district: "New Taipei / Sanchong",
    type: "Urban Repair",
    description: "Dense urban-industrial fabric near the river, useful for testing compact live-work prototypes.",
    coordinates: [25.0615, 121.4863]
  },
  {
    id: "xindian",
    name: "Xindian Mobility Node",
    district: "New Taipei / Xindian",
    type: "Mixed Use",
    description: "A mobility-linked site condition for focus units, remote work housing, and shared amenities.",
    coordinates: [24.9677, 121.5416]
  }
];

function loadLocationSites() {
  // Replace this with fetch("/api/locations") when your backend endpoint is ready.
  return Promise.resolve(locationSites);
}

const roadMapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
};

function initLocationMap() {
  const mapElement = document.getElementById("location-map");
  const listElement = document.getElementById("location-list");
  const countElement = document.getElementById("location-count");

  if (!mapElement || !listElement || typeof maplibregl === "undefined") {
    return;
  }

  const map = new maplibregl.Map({
    container: mapElement,
    style: roadMapStyle,
    center: [121.52, 25.055],
    zoom: 10.2,
    pitch: 0,
    bearing: 0,
    maplibreLogo: false
  });

  map.scrollZoom.disable();
  map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true
  }), "top-right");

  loadLocationSites().then(sites => {
    const bounds = new maplibregl.LngLatBounds();
    const markers = new Map();

    if (countElement) {
      countElement.textContent = sites.length;
    }

    sites.forEach((site, index) => {
      const coordinates = [site.coordinates[1], site.coordinates[0]];
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = "location-marker";
      markerElement.textContent = index + 1;
      markerElement.setAttribute("aria-label", site.name);

      const popup = new maplibregl.Popup({
        offset: 24,
        closeButton: false
      }).setHTML(`
        <div class="map-popup">
          <h3>${site.name}</h3>
          <p>${site.district}<br>${site.description}</p>
        </div>
      `);

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center"
      })
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);

      markers.set(site.id, marker);
      bounds.extend(coordinates);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "location-card";
      card.dataset.siteId = site.id;
      card.innerHTML = `
        <small>${String(index + 1).padStart(2, "0")} / ${site.type}</small>
        <strong>${site.name}</strong>
        <span>${site.district}</span>
      `;

      card.addEventListener("click", () => {
        document.querySelectorAll(".location-card").forEach(item => item.classList.remove("active"));
        card.classList.add("active");
      map.flyTo({
        center: coordinates,
        zoom: 14,
          pitch: 0,
          bearing: 0,
          essential: true
        });
        marker.togglePopup();
      });

      listElement.appendChild(card);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 80,
        pitch: 0,
        bearing: 0,
        duration: 900
      });
    }
  });
}

function filterUnits(type, button) {
  const cards = document.querySelectorAll(".unit-card");
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  cards.forEach(card => {
    if (type === "all" || card.dataset.type === type) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

let currentSlide = 0;
const slides = document.querySelectorAll(".carousel-slide");
const dots = document.querySelectorAll(".carousel-dot");

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === currentSlide);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === currentSlide);
  });
}

function changeSlide(direction) {
  showSlide(currentSlide + direction);
}

function goToSlide(index) {
  showSlide(index);
}

setInterval(() => {
  changeSlide(1);
}, 4000);

initLocationMap();
initAutoHideHeader();
