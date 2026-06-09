function scrollToSection(id) {
  const target = document.getElementById(id);

  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth"
  });
}

function scrollToUnitCard(unitType) {
  const target = document.querySelector(`#units .unit-card[data-type="${unitType}"]`);

  if (!target) {
    scrollToSection("units");
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - 24;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth"
  });
}

function scrollToLocationMapFrame() {
  const mapElement = document.getElementById("location-map");
  const gridElement = document.querySelector("#system .location-grid");
  const target = window.matchMedia("(max-width: 760px)").matches
    ? mapElement || gridElement
    : gridElement || mapElement;

  if (!target) {
    scrollToSection("system");
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - 8;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth"
  });

  if (locationMap) {
    window.requestAnimationFrame(() => {
      locationMap.resize();
    });
    window.setTimeout(() => {
      locationMap.resize();
    }, 420);
  }
}

function initSmoothNavigation() {
  document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href").slice(1);

      if (!targetId) {
        return;
      }

      event.preventDefault();
      scrollToSection(targetId);
      history.pushState(null, "", `#${targetId}`);
    });
  });
}

function initAutoHideHeader() {
  const header = document.querySelector("header");

  if (!header) {
    return;
  }

  let lastScrollY = window.scrollY;
  let isPointerNearTop = false;

  function isInsideModelScroll() {
    const modelScroll = document.querySelector(".architecture-model-scroll");

    if (!modelScroll) {
      return false;
    }

    const rect = modelScroll.getBoundingClientRect();
    return rect.top <= 1 && rect.bottom > window.innerHeight * 0.18;
  }

  function showHeader() {
    if (isInsideModelScroll()) {
      header.classList.add("header-hidden");
      return;
    }

    header.classList.remove("header-hidden");
  }

  function hideHeader() {
    if (isInsideModelScroll() || (!isPointerNearTop && window.scrollY > 80)) {
      header.classList.add("header-hidden");
    }
  }

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (isInsideModelScroll()) {
      hideHeader();
      lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY <= 40 || currentScrollY < lastScrollY) {
      showHeader();
    } else if (currentScrollY > lastScrollY) {
      hideHeader();
    }

    lastScrollY = currentScrollY;
  });

  window.addEventListener("mousemove", event => {
    isPointerNearTop = event.clientY < 80;

    if (isInsideModelScroll()) {
      hideHeader();
    } else if (isPointerNearTop) {
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

function initCollectionReveal() {
  const unitsSection = document.getElementById("units");
  const unitCards = document.querySelectorAll("#units .unit-card");

  if (!unitsSection || unitCards.length === 0) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    unitCards.forEach(card => {
      card.classList.add("is-scroll-visible");
    });
    return;
  }

  unitCards.forEach((card, index) => {
    card.classList.add("is-scroll-hidden");
    card.style.setProperty("--unit-reveal-delay", "0ms");
  });

  let ticking = false;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function updateCollectionReveal() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const animationStart = viewportHeight * 0.94;
    const animationEnd = viewportHeight * 0.34;

    unitCards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const rowDelay = (index % 2) * 0.06;
      const cardProgress = clamp(
        ((animationStart - rect.top) / (animationStart - animationEnd)) - rowDelay,
        0,
        1
      );
      const easedProgress = 1 - Math.pow(1 - cardProgress, 3);
      const offset = 0;
      const opacity = easedProgress;

      card.style.setProperty("--unit-reveal-x", `${offset}px`);
      card.style.opacity = opacity.toFixed(3);
      card.classList.toggle("is-scroll-visible", cardProgress > 0.98);
      card.classList.toggle("is-scroll-hidden", cardProgress <= 0.98);
    });

    ticking = false;
  }

  function requestRevealUpdate() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(updateCollectionReveal);
  }

  updateCollectionReveal();
  window.addEventListener("scroll", requestRevealUpdate, { passive: true });
  window.addEventListener("resize", requestRevealUpdate);
}

function goToUnitsFromTitle() {
  scrollToSection("units");
}

function handleTitleKey(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    goToUnitsFromTitle();
  }
}

const locationSites = [
  {
    id: "beitou",
    name: "Beitou Studio Site",
    district: "Taipei / Beitou",
    type: "Adaptive Reuse",
    vibe: "Industrial Cinema District",
    description: "Former production landscape with river fog, studio culture, iron workshops, and warehouse-scale live-work potential.",
    image: "images/cf483a65-2db5-4439-908a-6e51797ef55c.jpg",
    popupImage: "images/final.png",
    popupImages: ["images/final.png", "images/popupbtold.png"],
    logo: "images/BeitouLOGO-02.png",
    coordinates: [25.139899, 121.487938],
    transitBadges: [
      { type: "mrt", label: "捷運", route: "R23", detail: "復興崗站", color: "#e3002c" },
      { type: "bus", label: "公車", route: "216", detail: "復興崗站" },
      { type: "bus", label: "公車", route: "小6", detail: "中央北路" }
    ],
    dailyRadius: [
      {
        type: "mrt",
        label: "MRT",
        name: "Fuxinggang Station",
        localName: "復興崗站",
        line: "Tamsui-Xinyi Line",
        lineCode: "R23",
        lineColor: "#e3002c",
        time: "7 min"
      },
      {
        type: "coffee",
        label: "Coffee",
        name: "Late-night work cafes",
        localName: "工作咖啡廳群",
        time: "3 min"
      },
      {
        type: "studio",
        label: "Studio",
        name: "Film / photo studios",
        localName: "影像攝影棚",
        time: "6 min"
      },
      {
        type: "riverside",
        label: "Riverside",
        name: "Guandu riverside edge",
        localName: "關渡河岸",
        time: "5 min"
      }
    ],
    creativeInfrastructure: [
      "film production resources",
      "prop and set suppliers",
      "riverside shooting locations",
      "iron workshops",
      "old warehouse fabric",
      "late-night work cafes"
    ],
    lifestyleIndex: [
      ["Remote Work", 84],
      ["Content Creation", 96],
      ["Fabrication", 88],
      ["Night Lifestyle", 74]
    ],
    vibeNotes: [
      "night-set atmosphere",
      "river mist and industrial edges",
      "cinema-adjacent production culture"
    ]
  },
  {
    id: "nangang",
    name: "Nangang Industrial Edge",
    district: "Taipei / Nangang",
    type: "Transit + Industry",
    vibe: "AI Infrastructure Zone",
    description: "A rail-linked technology edge shaped by exhibitions, startup commuters, software offices, and biotech infrastructure.",
    image: "images/ChatGPT06_26_30.png",
    popupImage: "images/popupng.png",
    popupImages: ["images/popupng.png", "images/popupngold.png"],
    logo: "images/NangangLOGO-03.png",
    coordinates: [25.0534, 121.5861],
    transitBadges: [
      { type: "mrt", label: "捷運", route: "BL21", detail: "昆陽站", color: "#0070bd" },
      { type: "bus", label: "公車", route: "212", detail: "昆陽站" },
      { type: "bus", label: "公車", route: "270", detail: "忠孝東路" }
    ],
    dailyRadius: [
      {
        type: "mrt",
        label: "MRT",
        name: "Kunyang Station",
        localName: "昆陽站",
        line: "Bannan Line",
        lineCode: "BL21",
        lineColor: "#0070bd",
        time: "5 min"
      },
      {
        type: "coffee",
        label: "Coffee",
        name: "Startup cafe cluster",
        localName: "新創咖啡廳群",
        time: "2 min"
      },
      {
        type: "studio",
        label: "Studio",
        name: "Presentation / media rooms",
        localName: "簡報攝影室",
        time: "4 min"
      },
      {
        type: "expo",
        label: "Expo",
        name: "Nangang Exhibition Hall",
        localName: "南港展覽館",
        time: "6 min"
      }
    ],
    creativeInfrastructure: [
      "exhibition halls",
      "coworking offices",
      "software park",
      "biotech cluster",
      "startup meeting rooms",
      "presentation venues"
    ],
    lifestyleIndex: [
      ["Remote Work", 91],
      ["Startup", 95],
      ["Content Creation", 82],
      ["Night Office", 86]
    ],
    vibeNotes: [
      "data-center atmosphere",
      "exhibition city rhythm",
      "late-night office culture"
    ]
  },
  {
    id: "Xizhi",
    name: "Xizhi Production Belt",
    district: "New Taipei / Xizhi",
    type: "Light Industry",
    vibe: "Flow & Logistics Corridor",
    description: "A river and highway production corridor where storage, delivery, repair, and modular housing can operate together.",
    image: "images/Gemini_Generated_Image_x74oe2x74oe2x74o.png",
    logo: "images/XizhiLOGO-04.png",
    coordinates: [25.061686, 121.628729],
    dailyRadius: [
      {
        type: "mrt",
        label: "MRT",
        name: "Taipei Nangang Exhibition Center Station",
        localName: "南港展覽館站",
        line: "Bannan / Wenhu Line",
        lineCode: "BL23",
        lineColor: "#0070bd",
        time: "8 min"
      },
      {
        type: "coffee",
        label: "Coffee",
        name: "Commuter coffee stops",
        localName: "通勤咖啡點",
        time: "5 min"
      },
      {
        type: "studio",
        label: "Studio",
        name: "Maker / repair studios",
        localName: "修繕製作工作室",
        time: "5 min"
      },
      {
        type: "warehouse",
        label: "Warehouse",
        name: "Logistics warehouse belt",
        localName: "物流倉儲帶",
        time: "3 min"
      }
    ],
    creativeInfrastructure: [
      "logistics warehouses",
      "packing suppliers",
      "light industrial blocks",
      "repair workshops",
      "river transport edge",
      "material storage streets"
    ],
    lifestyleIndex: [
      ["Logistics", 95],
      ["Fabrication", 87],
      ["Remote Work", 78],
      ["Content Creation", 73]
    ],
    vibeNotes: [
      "highway infrastructure landscape",
      "warehouse belt",
      "river-flow production terrain"
    ]
  },
  {
    id: "sanchong",
    name: "Sanchong River Interface",
    district: "New Taipei / Sanchong",
    type: "Urban Repair",
    vibe: "Dense Taiwanese Hybrid",
    description: "A compressed urban-industrial district mixing markets, hardware, printing, food streets, and compact production energy.",
    image: "images/a94b5ebf-578c-4c11-b41d-b9f06e32c393.png",
    popupImage: "images/popupsz.png",
    popupImages: ["images/popupsz.png", "images/popupszold.png"],
    logo: "images/SanchongLOGO-05.png",
    coordinates: [25.061494, 121.500836],
    transitBadges: [
      { type: "mrt", label: "捷運", route: "O13", detail: "台北橋站", color: "#f8b61c" },
      { type: "bus", label: "公車", route: "221", detail: "台北橋站" },
      { type: "bus", label: "公車", route: "232", detail: "重新路" }
    ],
    dailyRadius: [
      {
        type: "mrt",
        label: "MRT",
        name: "Taipei Bridge Station",
        localName: "台北橋站",
        line: "Zhonghe-Xinlu Line",
        lineCode: "O13",
        lineColor: "#f8b61c",
        time: "6 min"
      },
      {
        type: "coffee",
        label: "Coffee",
        name: "Alley coffee shops",
        localName: "巷弄咖啡廳",
        time: "3 min"
      },
      {
        type: "studio",
        label: "Studio",
        name: "Printing / product studios",
        localName: "印刷產品工作室",
        time: "4 min"
      },
      {
        type: "market",
        label: "Market",
        name: "Sanchong local market",
        localName: "三重在地市場",
        time: "2 min"
      }
    ],
    creativeInfrastructure: [
      "hardware shops",
      "printing stores",
      "packaging suppliers",
      "night markets",
      "second-hand furniture",
      "dense alley workshops"
    ],
    lifestyleIndex: [
      ["Fabrication", 92],
      ["Night Lifestyle", 89],
      ["Content Creation", 84],
      ["Remote Work", 76]
    ],
    vibeNotes: [
      "market and workshop collision",
      "high-density alley energy",
      "Taiwanese urban hybridity"
    ]
  },
  {
    id: "xindian",
    name: "Xindian Mobility Node",
    district: "New Taipei / Xindian",
    type: "Mixed Use",
    vibe: "Green Remote Work Edge",
    description: "A mobility-linked foothill node for focus work, riverside recovery, small studios, and quieter long-stay routines.",
    image: "images/ChatGPT Image 3_25_12.png",
    coordinates: [24.974892, 121.544898],
    dailyRadius: [
      {
        type: "mrt",
        label: "MRT",
        name: "Qizhang Station",
        localName: "七張站",
        line: "Songshan-Xindian Line",
        lineCode: "G03",
        lineColor: "#008659",
        time: "6 min"
      },
      {
        type: "coffee",
        label: "Coffee",
        name: "Remote work cafes",
        localName: "遠端工作咖啡廳",
        time: "4 min"
      },
      {
        type: "studio",
        label: "Studio",
        name: "Small maker studios",
        localName: "小型製作工作室",
        time: "6 min"
      },
      {
        type: "riverside",
        label: "Riverside",
        name: "Xindian river loop",
        localName: "新店溪河岸",
        time: "3 min"
      }
    ],
    creativeInfrastructure: [
      "remote work cafes",
      "riverside work breaks",
      "small maker studios",
      "shared offices",
      "bike logistics routes",
      "quiet residential services"
    ],
    lifestyleIndex: [
      ["Remote Work", 94],
      ["Deep Focus", 91],
      ["Content Creation", 79],
      ["Night Lifestyle", 62]
    ],
    vibeNotes: [
      "green mobility edge",
      "river recovery loop",
      "quiet focus infrastructure"
    ]
  }
];

function loadLocationSites() {
  // Replace this with fetch("/api/locations") when your backend endpoint is ready.
  return Promise.resolve(locationSites.filter(site => site.logo));
}

const radiusTypeMeta = {
  mrt: { icon: "M", color: "#111" },
  coffee: { icon: "CF", color: "#8b5a2b" },
  studio: { icon: "ST", color: "#6b4fd6" },
  riverside: { icon: "RV", color: "#238a8d" },
  expo: { icon: "EX", color: "#c24b2a" },
  warehouse: { icon: "WH", color: "#6d6d6d" },
  market: { icon: "MK", color: "#d24b52" }
};

const featuredPopupSiteIds = new Set(["beitou", "nangang", "sanchong"]);

function isFeaturedPopupSite(site) {
  return featuredPopupSiteIds.has(site?.id);
}

function getFeaturedPopupSites() {
  return locationSites.filter(site => isFeaturedPopupSite(site));
}

function getRadiusItems(site) {
  return site.dailyRadius.map(item => {
    if (Array.isArray(item)) {
      return {
        label: item[0],
        name: item[0],
        time: item[1]
      };
    }

    return item;
  });
}

function renderRadiusIcon(item) {
  const meta = radiusTypeMeta[item.type] || { icon: item.label.slice(0, 2), color: "#111" };
  const iconText = item.type === "mrt" ? item.lineCode : meta.icon;
  const iconColor = item.type === "mrt" ? item.lineColor : meta.color;

  return `<span class="radius-icon radius-icon-${item.type || "default"}" style="--amenity-color: ${iconColor};">${iconText}</span>`;
}

function renderRadiusSummary(site, limit = 4) {
  return getRadiusItems(site).slice(0, limit).map(item => {
    const detail = item.localName || item.name || item.label;
    const meta = radiusTypeMeta[item.type] || { icon: item.label.slice(0, 2), color: "#111" };
    const iconText = item.type === "mrt" ? item.lineCode : meta.icon;
    const iconColor = item.type === "mrt" ? item.lineColor : meta.color;

    return `
      <span class="map-popup-radius-item" style="--amenity-color: ${iconColor};">
        <b>${iconText}</b>
        <em>${item.label}</em>
        <strong>${detail}</strong>
        <small>${item.time}</small>
      </span>
    `;
  }).join("");
}

function renderDefaultMapPopup(site) {
  return `
    <button class="map-popup" type="button" data-popup-site-id="${site.id}" aria-label="Show ${site.name} site context">
      <div class="map-popup-heading">
        ${site.logo ? `<img class="map-popup-logo" src="${site.logo}" alt="${site.name} logo">` : ""}
        <div>
          <h3>${site.name}</h3>
          <strong>${site.vibe}</strong>
        </div>
      </div>
      <p>${site.district}<br>${site.description}</p>
      <div class="map-popup-radius">
        ${renderRadiusSummary(site)}
      </div>
    </button>
  `;
}

function renderFeaturedMapPopup(site) {
  const popupImages = site.popupImages || [site.popupImage || site.image];

  return `
    <article class="map-popup map-popup-featured" role="button" tabindex="0" data-popup-site-id="${site.id}" aria-label="Show ${site.name} site context">
      <div class="map-popup-featured-media" data-popup-carousel data-active-index="0">
        <div class="map-popup-featured-slides">
          ${popupImages.map((image, imageIndex) => `
            <img class="map-popup-featured-image${imageIndex === 0 ? " active" : ""}" src="${image}" alt="${site.name} ${imageIndex === 0 ? "proposal rendering" : "existing factory"}" data-popup-slide="${imageIndex}">
          `).join("")}
        </div>
        <button class="architecture-control map-popup-carousel-btn map-popup-carousel-prev" type="button" data-popup-carousel-control="previous" aria-label="Previous ${site.name} image">&lsaquo;</button>
        <button class="architecture-control map-popup-carousel-btn map-popup-carousel-next" type="button" data-popup-carousel-control="next" aria-label="Next ${site.name} image">&rsaquo;</button>
        <div class="map-popup-carousel-dots" aria-label="${site.name} image selection">
          ${popupImages.map((image, imageIndex) => `
            <button class="map-popup-carousel-dot${imageIndex === 0 ? " active" : ""}" type="button" data-popup-carousel-dot="${imageIndex}" aria-label="Show image ${imageIndex + 1}"></button>
          `).join("")}
        </div>
      </div>
      <div class="map-popup-featured-content">
        ${site.logo ? `<img class="map-popup-featured-logo" src="${site.logo}" alt="${site.name} logo">` : ""}
        <h3>${site.name}</h3>
        <strong>${site.vibe}</strong>
        <p>${site.district}</p>
        <p>${site.description}</p>
        <div class="map-popup-radius">
          ${renderRadiusSummary(site)}
        </div>
      </div>
    </article>
  `;
}

function renderMapPopup(site) {
  if (isFeaturedPopupSite(site)) {
    return renderFeaturedMapPopup(site);
  }

  return renderDefaultMapPopup(site);
}

function setPopupCarouselSlide(carousel, nextIndex) {
  if (!carousel) {
    return;
  }

  const slides = Array.from(carousel.querySelectorAll("[data-popup-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-popup-carousel-dot]"));

  if (slides.length === 0) {
    return;
  }

  const activeIndex = ((nextIndex % slides.length) + slides.length) % slides.length;
  carousel.dataset.activeIndex = String(activeIndex);

  slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === activeIndex);
  });

  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.classList.toggle("active", isActive);
    dot.setAttribute("aria-pressed", String(isActive));
  });
}

function renderLocationTransitBadges(site) {
  const badges = site.transitBadges || [];

  return badges.map(item => {
    const badgeColor = item.type === "mrt" ? item.color : "#5e4b36";

    return `
      <span class="location-transit-badge location-transit-badge-${item.type}" style="--transit-color: ${badgeColor};">
        <b>${item.label}</b>
        <strong>${item.route}</strong>
        <small>${item.detail}</small>
      </span>
    `;
  }).join("");
}

function renderProposalSiteFeatures(sites) {
  const featureList = document.getElementById("proposal-site-list");

  if (!featureList) {
    return;
  }

  featureList.innerHTML = sites.map((site, index) => `
    <article class="proposal-site-card" data-site-id="${site.id}">
      <img class="proposal-site-image" src="${site.image}" alt="${site.name}">
      <div class="proposal-site-card-content">
        ${site.logo ? `<img class="proposal-site-logo" src="${site.logo}" alt="${site.name} logo">` : ""}
        <small>${String(index + 1).padStart(2, "0")} / ${site.type}</small>
        <h3>${site.name}</h3>
        <span>${site.district}</span>
        <p>${site.description}</p>
      </div>
    </article>
  `).join("");
}

function updateSiteContextTabs(siteId) {
  document.querySelectorAll(".site-context-tab").forEach(tab => {
    const isActive = tab.dataset.siteId === siteId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
}

function getSiteContextTabsMarkup() {
  return locationState.sites.map((site, index) => `
    <button class="site-context-tab" type="button" data-site-id="${site.id}" aria-pressed="false">
      ${site.logo ? `<img class="location-card-logo" src="${site.logo}" alt="${site.name} logo">` : ""}
      <span>
        <small>${String(index + 1).padStart(2, "0")} / ${site.type}</small>
        <strong>${site.name}</strong>
        <em>${site.district}</em>
      </span>
    </button>
  `).join("");
}

function bindSiteContextTabs() {
  document.querySelectorAll(".site-context-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const selectedIndex = locationState.sites.findIndex(site => site.id === tab.dataset.siteId);
      const selectedSite = locationState.sites[selectedIndex];

      if (selectedSite) {
        renderLocationIntel(selectedSite, selectedIndex);
      }
    });
  });
}

function renderLocationIntel(site, index = 0) {
  const intelElement = document.getElementById("location-intel");
  const intelSection = intelElement?.closest(".site-context-anchor");

  if (!intelElement || !site) {
    return;
  }

  if (intelSection) {
    intelSection.classList.add("is-visible");
  }

  const radiusItems = getRadiusItems(site);

  intelElement.innerHTML = `
    <div class="location-intel-hero">
      <div>
        <small>${String(index + 1).padStart(2, "0")} / Site + Surroundings</small>
        <h3>${site.vibe}</h3>
        <p>
          ${site.description}
          This summary combines the selected base, its walking radius, nearby work resources,
          and neighborhood atmosphere into one site context layer.
        </p>
      </div>
      <div class="location-intel-place">
        <span>${site.name}</span>
        <strong>${site.district}</strong>
        ${site.id === "beitou" ? `
          <small class="model-load-status" data-building-model-status="beitou">
            3D model ready / ${beitouBuildingModel.fileSizeLabel}
          </small>
        ` : ""}
      </div>
    </div>

    <div class="site-context-tabs" aria-label="Switch site context">
      ${getSiteContextTabsMarkup()}
    </div>

    <div class="site-context-body">
      <figure class="site-context-image-card">
        <img src="${site.image}" alt="${site.name}">
        <figcaption>
          <span>Base</span>
          <strong>${site.type}</strong>
        </figcaption>
      </figure>

      <div class="site-context-summary">
        <section class="site-context-block site-context-block-main">
          <span class="intel-kicker">Site and Surroundings</span>
          <p>
            Transit, work resources, and local atmosphere form the selected live-work context.
          </p>
          <div class="site-context-radius" aria-label="Daily radius from selected site">
            ${radiusItems.map(item => `
              <span>
                ${renderRadiusIcon(item)}
                <b>${item.label}</b>
                <strong>${item.name}</strong>
                <small>${item.time}</small>
              </span>
            `).join("")}
          </div>
        </section>

        <section class="site-context-block">
          <span class="intel-kicker">Production Cues</span>
          <div class="infrastructure-tags">
            ${site.creativeInfrastructure.map(item => `<span>${item}</span>`).join("")}
          </div>
          <ul class="vibe-list">
            ${site.vibeNotes.map(note => `<li>${note}</li>`).join("")}
          </ul>
        </section>

        <section class="site-context-block">
          <span class="intel-kicker">Daily Potential</span>
          <div class="lifestyle-index">
            ${site.lifestyleIndex.map(([label, value]) => `
              <div class="index-row">
                <div>
                  <strong>${label}</strong>
                  <span>${value}</span>
                </div>
                <meter min="0" max="100" value="${value}">${value}</meter>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    </div>
  `;

  bindSiteContextTabs();
  updateSiteContextTabs(site.id);
  updateBeitouModelStatus(site.id === "beitou" ? undefined : "hidden");
}

function initArchitectureModelViewer() {
  const stage = document.getElementById("architecture-model-stage");
  const status = document.getElementById("architecture-model-status");

  if (!stage || !status) {
    return;
  }

  stage.dataset.loader = "waiting-for-module";
  status.textContent = "Preparing GLB loader";
  status.classList.remove("is-hidden");
}

const mapStyles = {
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
};

const mapDefaultCamera = {
  pitch: 62,
  bearing: -28
};

const beitouBuildingModel = {
  id: "beitou-building-model",
  origin: [121.487938, 25.139899],
  altitude: 3,
  scale: 1.35,
  rotation: [Math.PI / 2, 0, 0],
  fileSizeLabel: "16MB"
};

let locationMap;
const isBeitouBuildingModelDisabled = true;
let beitouBuildingModelRequested = false;
let beitouBuildingModelLoaded = false;
const locationState = {
  cards: new Map(),
  markers: new Map(),
  sites: [],
  pendingSiteId: null,
  mapReady: false
};

function closeInactiveLocationPopups(activeSiteId) {
  locationState.markers.forEach((locationMarker, markerSiteId) => {
    if (markerSiteId === activeSiteId) {
      return;
    }

    const popup = locationMarker.getPopup();

    if (popup?.isOpen()) {
      popup.remove();
    }
  });
}

function restoreWindowScroll(left, top) {
  window.scrollTo({
    left,
    top,
    behavior: "auto"
  });
}

function selectLocationSite(siteId, options = {}) {
  const shouldLockPageScroll = options.scroll === false;
  const lockedScrollX = window.scrollX;
  const lockedScrollY = window.scrollY;
  const card = locationState.cards.get(siteId);
  const marker = locationState.markers.get(siteId);

  if (options.scroll !== false) {
    if (options.scrollTarget === "map") {
      scrollToLocationMapFrame();
    } else {
      scrollToSection("system");
    }

    history.pushState(null, "", "#system");
  }

  if (!card || !marker || !locationMap) {
    locationState.pendingSiteId = siteId;
    return;
  }

  const coordinates = marker.getLngLat();
  const selectedSite = locationSites.find(site => site.id === siteId);
  const selectedIndex = locationSites.findIndex(site => site.id === siteId);
  document.querySelectorAll(".location-card").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".location-marker").forEach(item => item.classList.remove("active"));
  card.classList.add("active");
  marker.getElement().classList.add("active");
  closeInactiveLocationPopups(siteId);

  if (options.showIntel) {
    renderLocationIntel(selectedSite, selectedIndex);
  }

  if (options.showIntel && options.scrollToIntel) {
    const intelAnchor = document.getElementById("about");

    if (intelAnchor) {
      window.requestAnimationFrame(() => {
        intelAnchor.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  }

  console.log("clicked siteId =", siteId);
  requestBeitouBuildingModel({
    fly: false
  });

  const isFeaturedSite = isFeaturedPopupSite(selectedSite);
  const selectedZoom = isFeaturedSite ? 15.8 : 17;
  const selectedOffset = isFeaturedSite ? [0, 160] : [0, 0];

  locationMap.flyTo({
    center: coordinates,
    zoom: selectedZoom,
    offset: selectedOffset,
    pitch: mapDefaultCamera.pitch,
    bearing: mapDefaultCamera.bearing,
    essential: true
  });

  if (!marker.getPopup().isOpen()) {
    marker.togglePopup();
  }

  if (shouldLockPageScroll) {
    restoreWindowScroll(lockedScrollX, lockedScrollY);
    window.requestAnimationFrame(() => restoreWindowScroll(lockedScrollX, lockedScrollY));
    window.setTimeout(() => restoreWindowScroll(lockedScrollX, lockedScrollY), 80);
  }
}

function updateBeitouModelStatus(state) {
  const statusElement = document.querySelector("[data-building-model-status='beitou']");

  if (!statusElement) {
    return;
  }

  if (isBeitouBuildingModelDisabled) {
    statusElement.textContent = "3D model disabled";
    statusElement.dataset.state = "hidden";
    return;
  }

  if (beitouBuildingModelLoaded || state === "loaded") {
    statusElement.textContent = "3D model active";
    statusElement.dataset.state = "loaded";
    return;
  }

  if (state === "loading" || beitouBuildingModelRequested) {
    statusElement.textContent = `3D model loading / ${beitouBuildingModel.fileSizeLabel}`;
    statusElement.dataset.state = "loading";
    return;
  }

  if (state === "failed") {
    statusElement.textContent = "3D model failed";
    statusElement.dataset.state = "failed";
    return;
  }

  statusElement.textContent = `3D model ready / ${beitouBuildingModel.fileSizeLabel}`;
  statusElement.dataset.state = "ready";
}

function addBeitouBuildingModel(map) {
  updateBeitouModelStatus("hidden");
}

function createSiteVolumeFeature(site) {
  const [lat, lng] = site.coordinates;
  const volumeProfiles = {
    beitou: {
      latSize: 0.00038,
      lngSize: 0.00052,
      height: 44
    },
    nangang: {
      latSize: 0.00042,
      lngSize: 0.00058,
      height: 76
    },
    sanchong: {
      latSize: 0.00032,
      lngSize: 0.00042,
      height: 60
    }
  };
  const profile = volumeProfiles[site.id] || volumeProfiles.beitou;
  const latSize = profile.latSize;
  const lngSize = profile.lngSize;
  const west = lng - (lngSize / 2);
  const east = lng + (lngSize / 2);
  const south = lat - (latSize / 2);
  const north = lat + (latSize / 2);

  return {
    type: "Feature",
    properties: {
      id: site.id,
      height: profile.height,
      base: 0
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]]
    }
  };
}

function addFeaturedSiteVolumes(map) {
  const sourceId = "featured-site-volume-source";
  const layerId = "featured-site-volume";

  if (!map || !map.isStyleLoaded() || map.getLayer(layerId) || map.getSource(sourceId)) {
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: getFeaturedPopupSites().map(createSiteVolumeFeature)
    }
  });

  map.addLayer({
    id: layerId,
    type: "fill-extrusion",
    source: sourceId,
    paint: {
      "fill-extrusion-color": "#050505",
      "fill-extrusion-opacity": 0.46,
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "base"],
      "fill-extrusion-vertical-gradient": true
    }
  });
}

function removeFeaturedSiteVolumes(map) {
  const sourceId = "featured-site-volume-source";
  const layerId = "featured-site-volume";

  if (!map) {
    return;
  }

  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

function removeBeitouGeneratedExtrusion(map) {
  const sourceId = "beitou-generated-building-source";
  const layerId = "beitou-generated-building";

  if (!map) {
    return;
  }

  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

function removeBeitouBuildingPlaceholder(map) {
  const sourceId = "beitou-building-placeholder-source";
  const layerId = "beitou-building-placeholder";

  if (!map) {
    return;
  }

  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

function requestBeitouBuildingModel(options = {}) {
  if (isBeitouBuildingModelDisabled) {
    updateBeitouModelStatus("hidden");
    return;
  }

  beitouBuildingModelRequested = true;

  if (!locationMap) {
    return;
  }

  removeBeitouGeneratedExtrusion(locationMap);
  addBeitouBuildingModel(locationMap);

  if (options.fly !== false) {
    locationMap.flyTo({
      center: beitouBuildingModel.origin,
      zoom: 18,
      pitch: 72,
      bearing: -32,
      essential: true
    });
  }
}

function initLocationMap() {
  const mapElement = document.getElementById("location-map");
  const listElement = document.getElementById("location-list");
  const countElement = document.getElementById("location-count");

  if (!mapElement || !listElement || typeof maplibregl === "undefined") {
    return;
  }

  const map = new maplibregl.Map({
    container: mapElement,
    style: mapStyles.liberty,
    center: [121.52, 25.055],
    zoom: 10.2,
    pitch: mapDefaultCamera.pitch,
    bearing: mapDefaultCamera.bearing,
    maplibreLogo: false
  });

  locationMap = map;

  map.scrollZoom.enable();
  map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true
  }), "top-right");

  map.on("load", () => {
    map.resize();
    removeBeitouBuildingPlaceholder(map);
    addFeaturedSiteVolumes(map);
  });

  map.on("style.load", () => {
    removeFeaturedSiteVolumes(map);
    removeBeitouBuildingPlaceholder(map);
    removeBeitouGeneratedExtrusion(map);
    addFeaturedSiteVolumes(map);

    if (beitouBuildingModelRequested) {
      addBeitouBuildingModel(map);
    }
  });

  loadLocationSites().then(allSites => {
    const sites = allSites.filter(site => site.id !== "Xizhi");
    const bounds = new maplibregl.LngLatBounds();
    locationState.sites = sites;

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
        offset: isFeaturedPopupSite(site) ? 58 : 24,
        closeButton: false,
        maxWidth: isFeaturedPopupSite(site) ? "920px" : "430px"
      }).setHTML(renderMapPopup(site));

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center"
      })
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);

      locationState.markers.set(site.id, marker);
      bounds.extend(coordinates);

      markerElement.addEventListener("click", () => {
        selectLocationSite(site.id, {
          scroll: false
        });
      });

      const card = document.createElement("button");
      card.type = "button";
      card.className = "location-card";
      card.dataset.siteId = site.id;
      card.innerHTML = `
        <div class="location-card-top">
          ${site.logo ? `<img class="location-card-logo" src="${site.logo}" alt="${site.name} logo">` : ""}
          <div>
            <small>${String(index + 1).padStart(2, "0")} / ${site.type}</small>
            <strong>${site.name}</strong>
            <span>${site.district}</span>
          </div>
        </div>
        <em>${site.vibe}</em>
        <div class="location-card-amenities">
          ${renderLocationTransitBadges(site)}
        </div>
      `;

      card.addEventListener("pointerdown", event => {
        event.preventDefault();
      });

      card.addEventListener("click", () => {
        selectLocationSite(site.id, {
          scroll: false
        });
      });

      locationState.cards.set(site.id, card);
      listElement.appendChild(card);
    });

    mapElement.addEventListener("click", event => {
      const carouselControl = event.target.closest("[data-popup-carousel-control]");
      const carouselDot = event.target.closest("[data-popup-carousel-dot]");

      if (carouselControl || carouselDot) {
        const carousel = event.target.closest("[data-popup-carousel]");
        const currentIndex = Number(carousel?.dataset.activeIndex || 0);
        const nextIndex = carouselDot
          ? Number(carouselDot.dataset.popupCarouselDot)
          : currentIndex + (carouselControl.dataset.popupCarouselControl === "next" ? 1 : -1);

        event.preventDefault();
        event.stopPropagation();
        setPopupCarouselSlide(carousel, nextIndex);
        return;
      }

      const popupCard = event.target.closest("[data-popup-site-id]");

      if (!popupCard) {
        return;
      }

      selectLocationSite(popupCard.dataset.popupSiteId, {
        scroll: false,
        showIntel: true,
        scrollToIntel: false
      });
    });

    locationState.mapReady = true;

    if (sites[0]) {
      renderLocationIntel(sites[0], 0);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 80,
        pitch: mapDefaultCamera.pitch,
        bearing: mapDefaultCamera.bearing,
        duration: 900
      });
    }

    if (locationState.pendingSiteId) {
      map.once("moveend", () => {
        selectLocationSite(locationState.pendingSiteId, {
          scroll: false
        });
        locationState.pendingSiteId = null;
      });
    }

    const storedSiteId = sessionStorage.getItem("pendingLocationSite");

    if (storedSiteId) {
      sessionStorage.removeItem("pendingLocationSite");
      map.once("moveend", () => {
        selectLocationSite(storedSiteId, {
          scroll: false
        });
      });
    }
  });
}

function setMapStyle(styleName, button) {
  if (!locationMap || !mapStyles[styleName]) {
    return;
  }

  locationMap.setStyle(mapStyles[styleName]);
  locationMap.once("styledata", () => {
    locationMap.resize();
  });

  document.querySelectorAll(".map-style-btn").forEach(item => item.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  }
}

const unitModelRoutes = {
  logi: "function/unit-3d.html?unit=logi",
  media: "function/unit-3d.html?unit=media",
  focus: "function/unit-3d.html?unit=focus",
  custom: "function/unit-3d.html?unit=custom"
};

function openUnitModel(unitType) {
  const route = unitModelRoutes[unitType];
  const modal = document.getElementById("unit-modal");
  const frame = document.getElementById("unit-modal-frame");
  const loader = document.getElementById("unit-modal-loader");

  if (!route) {
    return;
  }

  if (!modal || !frame || !loader) {
    window.location.href = route;
    return;
  }

  const separator = route.includes("?") ? "&" : "?";
  frame.classList.remove("is-loaded");
  loader.classList.remove("is-hidden");
  frame.src = `${route}${separator}embed=1`;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("unit-modal-open");
}

function handleUnitCardKey(event, unitType) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openUnitModel(unitType);
  }
}

function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

const unitMarketStateKey = "liveWorkMarketState";
const marketUnitTypes = ["logi", "media", "focus"];

function createUnitMarketState(sites) {
  return marketUnitTypes.reduce((state, unitType) => {
    const isAvailable = Math.random() > 0.28;
    const siteCount = Math.ceil(Math.random() * sites.length);

    state[unitType] = {
      isAvailable,
      siteIds: isAvailable ? shuffleItems(sites).slice(0, siteCount).map(site => site.id) : []
    };

    return state;
  }, {});
}

function getUnitMarketState(sites, refresh = false) {
  if (refresh) {
    const state = createUnitMarketState(sites);
    sessionStorage.setItem(unitMarketStateKey, JSON.stringify(state));
    return state;
  }

  const storedState = sessionStorage.getItem(unitMarketStateKey);

  if (storedState) {
    try {
      const parsedState = JSON.parse(storedState);
      const validSiteIds = new Set(sites.map(site => site.id));

      if (
        marketUnitTypes.every(unitType => parsedState[unitType]) &&
        marketUnitTypes.every(unitType => (parsedState[unitType].siteIds || []).every(siteId => validSiteIds.has(siteId)))
      ) {
        return parsedState;
      }
    } catch (error) {
      sessionStorage.removeItem(unitMarketStateKey);
    }
  }

  const state = createUnitMarketState(sites);
  sessionStorage.setItem(unitMarketStateKey, JSON.stringify(state));
  return state;
}

function initUnitAvailability() {
  const availabilityElements = document.querySelectorAll("[data-unit-availability]");

  if (availabilityElements.length === 0) {
    return;
  }

  loadLocationSites().then(allSites => {
    const sites = allSites.filter(site => site.id !== "Xizhi");
    const marketState = getUnitMarketState(sites, true);

    availabilityElements.forEach(element => {
      const unitType = element.dataset.unitAvailability;
      const unitState = marketState[unitType] || {
        isAvailable: false,
        siteIds: []
      };
      const isAvailable = unitState.isAvailable;
      const availableSites = unitState.siteIds
        .map(siteId => sites.find(site => site.id === siteId))
        .filter(Boolean);
      const menuId = `unit-availability-${unitType}`;

      element.classList.toggle("is-unavailable", !isAvailable);
      element.innerHTML = `
        <button class="availability-toggle" type="button" aria-expanded="false" aria-controls="${menuId}">
          <span>${isAvailable ? "AVAILABLE" : "UNAVAILABLE"}</span>
          <strong>${isAvailable ? `${availableSites.length} SITE${availableSites.length > 1 ? "S" : ""}` : "NO LIVE SITES"}</strong>
        </button>
        <div id="${menuId}" class="availability-menu" hidden>
          ${availableSites.length > 0 ? availableSites.map(site => `
            <button class="availability-site" type="button" data-site-id="${site.id}">
              ${site.logo ? `<img src="${site.logo}" alt="${site.name} logo">` : ""}
              <span>
                <b>${site.name}</b>
                <small>${site.district}</small>
              </span>
            </button>
          `).join("") : `
            <span class="availability-empty">Checking new sites</span>
          `}
        </div>
      `;
    });

    document.querySelectorAll(".availability-toggle").forEach(toggle => {
      toggle.addEventListener("click", event => {
        event.stopPropagation();
        const container = toggle.closest(".unit-availability");
        const menu = container?.querySelector(".availability-menu");
        const shouldOpen = menu?.hidden;

        document.querySelectorAll(".availability-menu").forEach(item => {
          item.hidden = true;
        });
        document.querySelectorAll(".availability-toggle").forEach(item => {
          item.setAttribute("aria-expanded", "false");
        });

        if (menu && shouldOpen) {
          menu.hidden = false;
          toggle.setAttribute("aria-expanded", "true");
        }
      });
    });

    document.querySelectorAll(".availability-site").forEach(siteButton => {
      siteButton.addEventListener("click", event => {
        event.stopPropagation();
        const siteId = siteButton.dataset.siteId;

        if (!siteId) {
          return;
        }

        document.querySelectorAll(".availability-menu").forEach(item => {
          item.hidden = true;
        });
        document.querySelectorAll(".availability-toggle").forEach(item => {
          item.setAttribute("aria-expanded", "false");
        });
        selectLocationSite(siteId, {
          scrollTarget: "map"
        });
      });
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".availability-menu").forEach(item => {
      item.hidden = true;
    });
    document.querySelectorAll(".availability-toggle").forEach(item => {
      item.setAttribute("aria-expanded", "false");
    });
  });
}

function closeUnitModel() {
  const modal = document.getElementById("unit-modal");
  const frame = document.getElementById("unit-modal-frame");
  const loader = document.getElementById("unit-modal-loader");

  if (!modal || !frame || !loader) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("unit-modal-open");
  frame.classList.remove("is-loaded");
  loader.classList.remove("is-hidden");
  frame.src = "about:blank";
}

function initUnitModal() {
  const modal = document.getElementById("unit-modal");
  const frame = document.getElementById("unit-modal-frame");
  const loader = document.getElementById("unit-modal-loader");
  const closeButton = document.getElementById("unit-modal-close");
  const backdrop = document.getElementById("unit-modal-backdrop");

  if (!modal || !frame || !loader || !closeButton || !backdrop) {
    return;
  }

  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow) {
      return;
    }

    if (event.data?.type === "unit-3d-model-ready") {
      frame.classList.add("is-loaded");
      loader.classList.add("is-hidden");
    }

    if (event.data?.type === "select-location-site") {
      sessionStorage.removeItem("pendingLocationSite");
      closeUnitModel();
      selectLocationSite(event.data.siteId, {
        scrollTarget: "map"
      });
    }
  });

  closeButton.addEventListener("click", closeUnitModel);
  backdrop.addEventListener("click", closeUnitModel);

  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeUnitModel();
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

function initHorizontalImageGallery(options) {
  const gallery = document.querySelector(options.gallerySelector);
  const currentElement = document.querySelector(options.currentSelector);
  const totalElement = options.totalSelector ? document.querySelector(options.totalSelector) : null;
  const previousButton = document.querySelector(options.previousSelector);
  const nextButton = document.querySelector(options.nextSelector);

  if (!gallery) {
    return;
  }

  const gallerySlides = Array.from(gallery.querySelectorAll(options.slideSelector));

  if (gallerySlides.length === 0) {
    return;
  }

  let activeIndex = 0;
  let scrollFrame = null;
  let isDragging = false;
  let pointerStartX = 0;
  let scrollStartX = 0;
  let isProgrammaticScroll = false;
  let programmaticScrollTimer = null;

  function formatCount(value) {
    return String(value).padStart(2, "0");
  }

  function updateCount(index) {
    activeIndex = Math.min(Math.max(index, 0), gallerySlides.length - 1);

    if (currentElement) {
      currentElement.textContent = formatCount(activeIndex + 1);
    }

    if (totalElement) {
      totalElement.textContent = formatCount(gallerySlides.length);
    }

    options.onIndexChange?.(activeIndex);
  }

  function getNearestSlideIndex() {
    const currentScroll = gallery.scrollLeft;

    if (options.fullWidthSlides) {
      const slideWidth = gallery.clientWidth || gallerySlides[0].offsetWidth || 1;
      return Math.min(Math.max(Math.round(currentScroll / slideWidth), 0), gallerySlides.length - 1);
    }

    return gallerySlides.reduce((nearestIndex, slide, index) => {
      const nearestDistance = Math.abs(gallerySlides[nearestIndex].offsetLeft - currentScroll);
      const slideDistance = Math.abs(slide.offsetLeft - currentScroll);
      return slideDistance < nearestDistance ? index : nearestIndex;
    }, 0);
  }

  function scrollToSlide(index) {
    const nextIndex = (index + gallerySlides.length) % gallerySlides.length;

    if (options.lockCountDuringSmoothScroll) {
      isProgrammaticScroll = true;
      window.clearTimeout(programmaticScrollTimer);
      programmaticScrollTimer = window.setTimeout(() => {
        isProgrammaticScroll = false;
        updateCount(getNearestSlideIndex());
      }, 420);
    }

    gallerySlides[nextIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start"
    });
    updateCount(nextIndex);
  }

  gallery.addEventListener("scroll", () => {
    if (isProgrammaticScroll) {
      return;
    }

    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame);
    }

    scrollFrame = window.requestAnimationFrame(() => {
      updateCount(getNearestSlideIndex());
      scrollFrame = null;
    });
  });

  gallery.addEventListener("pointerdown", event => {
    if (event.button !== 0) {
      return;
    }

    isDragging = true;
    pointerStartX = event.clientX;
    scrollStartX = gallery.scrollLeft;
    gallery.classList.add("is-dragging");
    gallery.setPointerCapture(event.pointerId);
  });

  gallery.addEventListener("pointermove", event => {
    if (!isDragging) {
      return;
    }

    gallery.scrollLeft = scrollStartX - (event.clientX - pointerStartX);
  });

  function endDrag(event) {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    gallery.classList.remove("is-dragging");

    if (gallery.hasPointerCapture(event.pointerId)) {
      gallery.releasePointerCapture(event.pointerId);
    }
  }

  gallery.addEventListener("pointerup", endDrag);
  gallery.addEventListener("pointercancel", endDrag);
  gallery.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    scrollToSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  previousButton?.addEventListener("click", () => {
    scrollToSlide(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    scrollToSlide(activeIndex + 1);
  });

  if (options.markerSelector) {
    document.querySelectorAll(options.markerSelector).forEach(marker => {
      marker.setAttribute("role", "button");
      marker.setAttribute("tabindex", "0");

      marker.addEventListener("pointerdown", event => {
        event.stopPropagation();
      });

      marker.addEventListener("pointerup", event => {
        event.stopPropagation();
      });

      marker.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const markerIndex = Number(marker.dataset.publicSpaceMarker) - 1;

        if (Number.isInteger(markerIndex) && markerIndex >= 0 && markerIndex < gallerySlides.length) {
          scrollToSlide(markerIndex);
        }
      });

      marker.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        marker.click();
      });
    });
  }

  updateCount(0);
}

function initArchitectureImageGalleries() {
  const publicSpaceLabels = [
    "\u79df\u501f\u651d\u5f71\u68da\u62cd\u651d\u7a7a\u9593",
    "\u4f4f\u5b85\u5927\u5ef3",
    "\u5c4b\u9802\u82b1\u5712"
  ];
  const publicSpaceCopy = document.querySelector(".public-space-copy");
  const publicSpaceMarkers = Array.from(document.querySelectorAll("[data-public-space-marker]"));

  function updatePublicSpaceDetails(index) {
    if (publicSpaceCopy && publicSpaceLabels[index]) {
      publicSpaceCopy.textContent = publicSpaceLabels[index];
    }

    publicSpaceMarkers.forEach(marker => {
      marker.classList.toggle("is-active", Number(marker.dataset.publicSpaceMarker) === index + 1);
    });
  }

  initHorizontalImageGallery({
    gallerySelector: "#architecture-gallery",
    slideSelector: "[data-architecture-slide]",
    currentSelector: "#architecture-current",
    totalSelector: "#architecture-total",
    previousSelector: "[data-architecture-prev]",
    nextSelector: "[data-architecture-next]"
  });

  initHorizontalImageGallery({
    gallerySelector: "#public-space-gallery",
    slideSelector: "[data-public-space-slide]",
    currentSelector: "#public-space-current",
    previousSelector: "[data-public-space-prev]",
    nextSelector: "[data-public-space-next]",
    fullWidthSlides: true,
    lockCountDuringSmoothScroll: true,
    markerSelector: "[data-public-space-marker]",
    onIndexChange: updatePublicSpaceDetails
  });

  initHorizontalImageGallery({
    gallerySelector: "#architecture-system-gallery",
    slideSelector: "[data-architecture-system-slide]",
    currentSelector: "#architecture-system-current",
    totalSelector: "#architecture-system-total",
    previousSelector: "[data-architecture-system-prev]",
    nextSelector: "[data-architecture-system-next]"
  });

  initHorizontalImageGallery({
    gallerySelector: "#building-system-gallery",
    slideSelector: "[data-building-system-slide]",
    currentSelector: "#building-system-current",
    totalSelector: "#building-system-total",
    previousSelector: "[data-building-system-prev]",
    nextSelector: "[data-building-system-next]"
  });

}

function initArchitectureSectionReveal() {
  const revealers = document.querySelectorAll("[data-section-reveal]");

  revealers.forEach(revealer => {
    function clampPercent(value) {
      return Math.min(100, Math.max(0, value));
    }

    function setRevealFromClientX(clientX) {
      const rect = revealer.getBoundingClientRect();

      if (rect.width <= 0) {
        return;
      }

      const percent = clampPercent(((clientX - rect.left) / rect.width) * 100);
      revealer.style.setProperty("--section-reveal", `${percent.toFixed(2)}%`);
    }

    function getCurrentReveal() {
      const value = revealer.style.getPropertyValue("--section-reveal");
      return Number.parseFloat(value) || 0;
    }

    revealer.addEventListener("pointerenter", event => {
      setRevealFromClientX(event.clientX);
    });

    revealer.addEventListener("pointermove", event => {
      setRevealFromClientX(event.clientX);
    });

    revealer.addEventListener("pointerdown", event => {
      revealer.setPointerCapture(event.pointerId);
      setRevealFromClientX(event.clientX);
    });

    revealer.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextReveal = clampPercent(getCurrentReveal() + direction * 4);
      revealer.style.setProperty("--section-reveal", `${nextReveal}%`);
    });
  });
}

if (slides.length > 0) {
  setInterval(() => {
    changeSlide(1);
  }, 4000);
}

loadLocationSites().then(renderProposalSiteFeatures);
initArchitectureModelViewer();
initArchitectureImageGalleries();
initLocationMap();
initSmoothNavigation();
initAutoHideHeader();
initCollectionReveal();
initArchitectureSectionReveal();
initUnitModal();
initUnitAvailability();
