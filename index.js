function scrollToContact() {
  const contactSection = document.getElementById("contact");

  if (contactSection) {
    contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

const body = document.body;
const header = document.querySelector(".site-header");
const brandLink = document.querySelector(".brand");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const sections = document.querySelectorAll("main section[id]");
const sectionShells = document.querySelectorAll(".section-shell");
const revealElements = document.querySelectorAll(".reveal");
const scrollProgress = document.querySelector(".scroll-progress");
const hero = document.querySelector(".hero");
const heroAurora = document.querySelector(".hero-aurora");
const heroBackdrop = document.querySelector(".hero-backdrop");
const interactiveCards = document.querySelectorAll(".hero-panel-card");
const leadForm = document.getElementById("lead-form");
const leadFormStatus = document.getElementById("lead-form-status");
const localLeadApiPort = "3011";
const isLocalHttpPreview =
  (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") &&
  window.location.protocol.startsWith("http") &&
  window.location.port !== localLeadApiPort;
const leadApiBaseUrl =
  typeof window.STUDIO7_API_BASE_URL === "string" && window.STUDIO7_API_BASE_URL.trim()
    ? window.STUDIO7_API_BASE_URL.trim().replace(/\/$/, "")
    : window.location.protocol === "file:"
      ? `http://127.0.0.1:${localLeadApiPort}`
      : isLocalHttpPreview
        ? `${window.location.protocol}//${window.location.hostname}:${localLeadApiPort}`
        : window.location.origin;
const leadApiEndpoint = `${leadApiBaseUrl}/api/leads`;
const publicConfigEndpoint = `${leadApiBaseUrl}/api/public-config`;
const glowCards = document.querySelectorAll(
  ".about-text, .about-highlight, .service-card, .process-step, .proof-card, .contact-card, .hero-panel-card, .hero-metrics li"
);
const touchPreviewCards = document.querySelectorAll(".client-card");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const supportsFinePointer = finePointerQuery.matches;
const prefersReducedMotion = reducedMotionQuery.matches;
const saveDataEnabled = navigator.connection?.saveData === true;
const deviceMemory = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null;
const lowPowerDevice = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
const shouldUseEnhancedMotion =
  supportsFinePointer &&
  !prefersReducedMotion &&
  !saveDataEnabled &&
  !lowPowerDevice &&
  !(deviceMemory !== null && deviceMemory <= 4);
const performanceLiteMode = !shouldUseEnhancedMotion;

body.classList.toggle("performance-lite", performanceLiteMode);

let lastScrollY = window.scrollY;
let headerCompact = false;
let headerScrolled = null;
let headerToggleAnchor = window.scrollY;
let scrollTicking = false;
let activeSectionId = "";
let usesObservedNav = false;
let turnstileLoaderPromise = null;

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoaderPromise) {
    return turnstileLoaderPromise;
  }

  turnstileLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-turnstile-script="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("TURNSTILE_LOAD_FAILED")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }

      reject(new Error("TURNSTILE_UNAVAILABLE"));
    };
    script.onerror = () => {
      reject(new Error("TURNSTILE_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });

  return turnstileLoaderPromise;
}

function setActiveNavLink(sectionId) {
  if (activeSectionId === sectionId) {
    return;
  }

  activeSectionId = sectionId;

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function closeMenu() {
  if (!header || !navToggle) {
    return;
  }

  header.classList.remove("menu-open");
  body.classList.remove("menu-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Abrir menu");
}

function toggleMenu() {
  if (!header || !navToggle) {
    return;
  }

  const isOpen = header.classList.toggle("menu-open");
  body.classList.toggle("menu-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
}

function setupStaticInteractionSafeguards() {
  document.querySelector(".lead-form-turnstile-note")?.remove();
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const contactTrigger = event.target.closest("[data-scroll-contact]");

    if (!contactTrigger) {
      return;
    }

    event.preventDefault();
    scrollToContact();
  });

  document.addEventListener(
    "error",
    (event) => {
      if (!(event.target instanceof HTMLImageElement)) {
        return;
      }

      const fallbackSource = event.target.dataset.fallbackSrc;

      if (!fallbackSource) {
        return;
      }

      delete event.target.dataset.fallbackSrc;
      event.target.src = fallbackSource;
    },
    true
  );
}

function handleHeaderState() {
  if (!header) {
    return;
  }

  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - lastScrollY;
  const scrollingDown = scrollDelta > 10;
  const scrollingUp = scrollDelta < -10;

  if (!headerCompact) {
    if (currentScrollY > 240 && scrollingDown) {
      headerCompact = true;
      headerToggleAnchor = currentScrollY;
      header.classList.add("header-compact");
    }
  } else {
    const revealDistance = headerToggleAnchor - currentScrollY;

    if (currentScrollY <= 132 || (scrollingUp && revealDistance > 42)) {
      headerCompact = false;
      headerToggleAnchor = currentScrollY;
      header.classList.remove("header-compact");
    }
  }

  lastScrollY = currentScrollY;

  const isScrolled = currentScrollY > 24;

  if (headerScrolled !== isScrolled) {
    headerScrolled = isScrolled;
    header.classList.toggle("header-scrolled", isScrolled);
  }

  if (!headerCompact && window.innerWidth > 720) {
    closeMenu();
  }
}

function scheduleEnhancement(callback) {
  if (typeof callback !== "function") {
    return;
  }

  const runCallback = () => {
    window.setTimeout(callback, 0);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(runCallback, { timeout: 900 });
    return;
  }

  window.setTimeout(callback, 120);
}

function updateActiveNavLinkFallback() {
  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 160;
    const sectionHeight = section.offsetHeight;

    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentSection = section.getAttribute("id") || "";
    }
  });

  if (currentSection) {
    setActiveNavLink(currentSection);
  }
}

function updateScrollProgress() {
  if (!scrollProgress) {
    return;
  }

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
}

function runScrollEffects() {
  handleHeaderState();

  if (!usesObservedNav) {
    updateActiveNavLinkFallback();
  }

  updateScrollProgress();
  scrollTicking = false;
}

function setupInteractiveCards() {
  if (!shouldUseEnhancedMotion) {
    return;
  }

  interactiveCards.forEach((card) => {
    let bounds = null;
    let pointerX = 0;
    let pointerY = 0;
    let frameId = 0;
    const isClientCard = card.classList.contains("client-card");
    const rotateStrength = isClientCard ? 7 : 5;
    const lift = isClientCard ? -6 : -4;

    card.classList.add("interactive-card");

    const renderTilt = () => {
      if (!bounds) {
        frameId = 0;
        return;
      }

      const offsetX = pointerX - bounds.left;
      const offsetY = pointerY - bounds.top;
      const rotateY = ((offsetX / bounds.width) - 0.5) * rotateStrength;
      const rotateX = (0.5 - (offsetY / bounds.height)) * rotateStrength;

      if (isClientCard) {
        const shiftX = ((offsetX / bounds.width) - 0.5) * -10;
        const shiftY = ((offsetY / bounds.height) - 0.5) * -10;

        card.style.setProperty("--client-shift-x", `${shiftX}px`);
        card.style.setProperty("--client-shift-y", `${shiftY}px`);
      }

      card.style.transform = `translate3d(0, ${lift}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      frameId = 0;
    };

    const queueTilt = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(renderTilt);
      }
    };

    const resetTilt = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      bounds = null;
      card.classList.remove("is-tilting");
      card.style.transform = "";
      card.style.removeProperty("--client-shift-x");
      card.style.removeProperty("--client-shift-y");
    };

    card.addEventListener("pointerenter", () => {
      bounds = card.getBoundingClientRect();
      card.classList.add("is-tilting");
    });

    card.addEventListener("pointermove", (event) => {
      if (!bounds) {
        bounds = card.getBoundingClientRect();
      }

      pointerX = event.clientX;
      pointerY = event.clientY;
      queueTilt();
    });

    card.addEventListener("pointerleave", resetTilt);
  });
}

function setupGlowCards() {
  glowCards.forEach((card) => {
    card.classList.add("glow-card");
  });

  const clearClientPreviews = (exceptCard = null) => {
    touchPreviewCards.forEach((card) => {
      if (card !== exceptCard) {
        card.classList.remove("is-touch-preview");
        card.setAttribute("aria-expanded", "false");
      }
    });
  };

  touchPreviewCards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("aria-expanded", "false");

    const togglePreview = () => {
      const willExpand = !card.classList.contains("is-touch-preview");
      clearClientPreviews(card);
      card.classList.toggle("is-touch-preview", willExpand);
      card.setAttribute("aria-expanded", String(willExpand));
    };

    card.addEventListener("click", () => {
      if (supportsFinePointer) {
        return;
      }

      togglePreview();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      togglePreview();
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || event.target.closest(".client-card")) {
      return;
    }

    clearClientPreviews();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearClientPreviews();
    }
  });
}

function setupPointerReactiveGlows() {
  if (!shouldUseEnhancedMotion) {
    return;
  }

  const glowSelector = ".glow-card, .photo-hover-surface, .interactive-section";
  let activeElement = null;
  let frameId = 0;
  let nextPointerX = 0;
  let nextPointerY = 0;

  const resetGlowPosition = (element) => {
    if (!element) {
      return;
    }

    element.style.setProperty("--glow-x", "50%");
    element.style.setProperty("--glow-y", "50%");
    element.style.setProperty("--photo-glow-x", "50%");
    element.style.setProperty("--photo-glow-y", "50%");
    element.style.setProperty("--section-glow-x", "50%");
    element.style.setProperty("--section-glow-y", "50%");
  };

  const setGlowState = (element, isActive) => {
    if (!element) {
      return;
    }

    if (element.classList.contains("glow-card")) {
      element.classList.toggle("is-glowing", isActive);
    }

    if (element.classList.contains("photo-hover-surface")) {
      element.classList.toggle("is-photo-glowing", isActive);
    }

    if (element.classList.contains("interactive-section")) {
      element.classList.toggle("is-section-lit", isActive);
    }
  };

  const updateGlowPosition = () => {
    if (!activeElement) {
      frameId = 0;
      return;
    }

    const bounds = activeElement.getBoundingClientRect();

    if (!bounds.width || !bounds.height) {
      frameId = 0;
      return;
    }

    const x = Math.min(Math.max(((nextPointerX - bounds.left) / bounds.width) * 100, 0), 100);
    const y = Math.min(Math.max(((nextPointerY - bounds.top) / bounds.height) * 100, 0), 100);
    const xValue = `${x.toFixed(2)}%`;
    const yValue = `${y.toFixed(2)}%`;

    activeElement.style.setProperty("--glow-x", xValue);
    activeElement.style.setProperty("--glow-y", yValue);
    activeElement.style.setProperty("--photo-glow-x", xValue);
    activeElement.style.setProperty("--photo-glow-y", yValue);
    activeElement.style.setProperty("--section-glow-x", xValue);
    activeElement.style.setProperty("--section-glow-y", yValue);
    frameId = 0;
  };

  const queueGlowPosition = (element, pointerX, pointerY) => {
    if (activeElement !== element) {
      setGlowState(activeElement, false);
      resetGlowPosition(activeElement);
      activeElement = element;
      setGlowState(activeElement, true);
    }

    nextPointerX = pointerX;
    nextPointerY = pointerY;

    if (!frameId) {
      frameId = window.requestAnimationFrame(updateGlowPosition);
    }
  };

  const clearActiveGlow = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    if (!activeElement) {
      return;
    }

    setGlowState(activeElement, false);
    resetGlowPosition(activeElement);
    activeElement = null;
  };

  document.addEventListener("pointermove", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const glowElement = event.target.closest(glowSelector);

    if (!glowElement) {
      clearActiveGlow();
      return;
    }

    queueGlowPosition(glowElement, event.clientX, event.clientY);
  });

  document.addEventListener("pointerout", (event) => {
    if (!activeElement || !(event.target instanceof Element)) {
      return;
    }

    const glowElement = event.target.closest(glowSelector);

    if (glowElement !== activeElement) {
      return;
    }

    if (event.relatedTarget instanceof Element && event.relatedTarget.closest(glowSelector) === activeElement) {
      return;
    }

    clearActiveGlow();
  });

  document.addEventListener("focusin", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const glowElement = event.target.closest(glowSelector);

    if (!glowElement) {
      return;
    }

    setGlowState(glowElement, true);
    resetGlowPosition(glowElement);
  });

  document.addEventListener("focusout", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const glowElement = event.target.closest(glowSelector);

    if (!glowElement) {
      return;
    }

    if (event.relatedTarget instanceof Element && event.relatedTarget.closest(glowSelector) === glowElement) {
      return;
    }

    setGlowState(glowElement, false);
    resetGlowPosition(glowElement);

    if (activeElement === glowElement) {
      activeElement = null;
    }
  });

  window.addEventListener("blur", clearActiveGlow);
}

function setupHeroParallax() {
  if (!hero || !heroAurora || !heroBackdrop || !shouldUseEnhancedMotion) {
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let frameId = 0;

  const renderParallax = () => {
    heroAurora.style.transform = `translate3d(${targetX * 26}px, ${targetY * 18}px, 0)`;
    heroBackdrop.style.transform = `translate3d(${targetX * -18}px, ${targetY * -14}px, 0)`;
    frameId = 0;
  };

  const queueParallax = () => {
    if (!frameId) {
      frameId = window.requestAnimationFrame(renderParallax);
    }
  };

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width - 0.5;
    targetY = (event.clientY - rect.top) / rect.height - 0.5;
    queueParallax();
  });

  hero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    queueParallax();
  });
}

function clearLeadFieldState(input) {
  const field = input?.closest(".lead-form-field");
  const errorElement = field?.querySelector(".lead-form-error");

  field?.classList.remove("is-invalid");
  input?.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function setLeadFieldState(input, message) {
  const field = input?.closest(".lead-form-field");
  const errorElement = field?.querySelector(".lead-form-error");

  if (!field || !input) {
    return;
  }

  field.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function normalizeLeadEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function isValidLeadGmail(value = "") {
  const normalized = normalizeLeadEmail(value);
  const atIndex = normalized.indexOf("@");

  if (atIndex <= 0 || atIndex !== normalized.lastIndexOf("@")) {
    return false;
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  if (domain !== "gmail.com") {
    return false;
  }

  const [baseLocalPart, aliasPart = ""] = localPart.split("+");

  if (!baseLocalPart || baseLocalPart.startsWith(".") || baseLocalPart.endsWith(".")) {
    return false;
  }

  if (baseLocalPart.includes("..") || !/^[a-z0-9.]+$/.test(baseLocalPart)) {
    return false;
  }

  if (aliasPart && !/^[a-z0-9._-]+$/.test(aliasPart)) {
    return false;
  }

  return true;
}

function normalizeLeadPhoneDigits(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 11);
}

function formatLeadPhone(value = "") {
  const digits = normalizeLeadPhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const firstPart = digits.slice(2, 7);
  const lastPart = digits.slice(7, 11);

  if (!lastPart) {
    return `(${areaCode}) ${firstPart}`;
  }

  return `(${areaCode}) ${firstPart}-${lastPart}`;
}

function isValidLeadMobilePhone(value = "") {
  const digits = normalizeLeadPhoneDigits(value);
  return digits.length === 11 && digits[2] === "9";
}

function validateLeadField(input) {
  if (!input) {
    return "";
  }

  const value = input.value.trim();

  if (!value) {
    if (input.name === "fullName") {
      return "Informe seu nome completo.";
    }

    if (input.name === "email") {
      return "Informe seu email Gmail.";
    }

    return "Informe seu numero de telefone.";
  }

  if (input.name === "fullName" && value.split(/\s+/).filter(Boolean).length < 2) {
    return "Informe nome e sobrenome.";
  }

  if (input.name === "email" && !isValidLeadGmail(value)) {
    return "Use um Gmail valido, como nome@gmail.com.";
  }

  if (input.name === "phone" && !isValidLeadMobilePhone(value)) {
    return "Use um celular valido no formato (99) 99999-9999.";
  }

  return "";
}

function setupLeadForm() {
  if (!leadForm || !leadFormStatus) {
    return;
  }

  const inputs = [...leadForm.querySelectorAll(".lead-form-input")].filter(
    (input) => !input.closest(".lead-form-honeypot")
  );
  const submitButton = leadForm.querySelector(".lead-form-submit");
  const startedAtInput = leadForm.elements.startedAt;
  const honeypotInput = leadForm.elements.companyWebsite;
  const turnstileShell = document.getElementById("lead-turnstile-shell");
  const turnstileContainer = document.getElementById("lead-turnstile");
  const defaultSubmitLabel = submitButton?.textContent?.trim() || "Quero ser contatado";
  let leadFormStartedAt = 0;
  let turnstileEnabled = false;
  let turnstileReady = false;
  let turnstileToken = "";
  let turnstileWidgetId = null;

  const refreshLeadProtectionStart = () => {
    leadFormStartedAt = Date.now();

    if (startedAtInput) {
      startedAtInput.value = String(leadFormStartedAt);
    }
  };

  const setTurnstileToken = (value = "") => {
    turnstileToken = String(value || "").trim();
  };

  const resetTurnstileWidget = () => {
    setTurnstileToken("");

    if (turnstileEnabled && turnstileReady && window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  };

  const renderLeadStatus = (message, state = "") => {
    leadFormStatus.textContent = message;

    if (state) {
      leadFormStatus.dataset.state = state;
    } else {
      delete leadFormStatus.dataset.state;
    }
  };

  refreshLeadProtectionStart();

  leadForm.addEventListener("focusin", () => {
    if (!leadFormStartedAt) {
      refreshLeadProtectionStart();
    }
  });

  async function setupTurnstileProtection() {
    let shouldRequireTurnstile = false;

    try {
      const response = await fetch(publicConfigEndpoint);

      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => ({}));
      const turnstileConfig = payload?.turnstile;

      if (!turnstileConfig?.enabled || !turnstileConfig.siteKey || !turnstileContainer) {
        return;
      }

      shouldRequireTurnstile = true;
      turnstileEnabled = true;

      if (turnstileShell) {
        turnstileShell.hidden = false;
      }

      const turnstileApi = await loadTurnstileScript();
      turnstileWidgetId = turnstileApi.render(turnstileContainer, {
        sitekey: turnstileConfig.siteKey,
        action: turnstileConfig.action || "lead_capture",
        theme: "dark",
        size: "flexible",
        callback: (token) => {
          setTurnstileToken(token);
        },
        "expired-callback": () => {
          setTurnstileToken("");
        },
        "error-callback": () => {
          setTurnstileToken("");
          renderLeadStatus(
            "Nao foi possivel carregar a verificacao de seguranca. Atualize a pagina e tente novamente.",
            "error"
          );
        }
      });
      turnstileReady = true;
    } catch (error) {
      if (shouldRequireTurnstile) {
        turnstileEnabled = true;
        turnstileReady = false;

        if (turnstileShell) {
          turnstileShell.hidden = false;
        }

        renderLeadStatus(
          "Nao foi possivel carregar a verificacao de seguranca. Atualize a pagina e tente novamente.",
          "error"
        );
      }
    }
  }

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.name === "email") {
        input.value = normalizeLeadEmail(input.value);
      }

      if (input.name === "phone") {
        input.value = formatLeadPhone(input.value);
      }

      clearLeadFieldState(input);

      if (leadFormStatus.dataset.state) {
        renderLeadStatus("");
      }
    });

    input.addEventListener("blur", () => {
      if (input.name === "email") {
        input.value = normalizeLeadEmail(input.value);
      }

      if (input.name === "phone") {
        input.value = formatLeadPhone(input.value);
      }

      const validationMessage = validateLeadField(input);

      if (validationMessage) {
        setLeadFieldState(input, validationMessage);
      } else {
        clearLeadFieldState(input);
      }
    });
  });

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    let firstInvalidInput = null;

    renderLeadStatus("");

    inputs.forEach((input) => {
      const validationMessage = validateLeadField(input);

      if (validationMessage) {
        setLeadFieldState(input, validationMessage);

        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
      } else {
        clearLeadFieldState(input);
      }
    });

    if (firstInvalidInput) {
      renderLeadStatus("Confira os campos obrigatorios antes de enviar.", "error");
      firstInvalidInput.focus();
      return;
    }

    if (turnstileEnabled) {
      if (!turnstileReady) {
        renderLeadStatus(
          "Nao foi possivel carregar a verificacao de seguranca. Atualize a pagina e tente novamente.",
          "error"
        );
        return;
      }

      if (!turnstileToken) {
        renderLeadStatus("Conclua a verificacao de seguranca antes de enviar.", "error");
        return;
      }
    }

    const payload = {
      name: leadForm.elements.fullName.value.trim(),
      gmail: normalizeLeadEmail(leadForm.elements.email.value),
      phone: formatLeadPhone(leadForm.elements.phone.value),
      startedAt: startedAtInput?.value || String(leadFormStartedAt),
      companyWebsite: String(honeypotInput?.value || ""),
      turnstileToken
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    renderLeadStatus("Enviando seus dados...", "pending");

    try {
      const response = await fetch(leadApiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        renderLeadStatus(
          result.message || "Nao foi possivel enviar seus dados agora. Tente novamente em instantes.",
          "error"
        );
        resetTurnstileWidget();
        return;
      }

      leadForm.reset();
      inputs.forEach(clearLeadFieldState);
      const phoneInput = leadForm.elements.phone;
      const emailInput = leadForm.elements.email;

      if (phoneInput) {
        phoneInput.value = "";
      }

      if (emailInput) {
        emailInput.value = "";
      }

      if (honeypotInput) {
        honeypotInput.value = "";
      }

      refreshLeadProtectionStart();
      resetTurnstileWidget();

      renderLeadStatus(
        result.message || "Obrigado! Entraremos em contato em breve.",
        "success"
      );
    } catch (error) {
      renderLeadStatus(
        "Servidor indisponivel no momento. Inicie o back-end e tente novamente.",
        "error"
      );
      resetTurnstileWidget();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultSubmitLabel;
      }
    }
  });

  setupTurnstileProtection();
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealElements.forEach((element) => {
    if (!element.classList.contains("reveal-visible")) {
      revealObserver.observe(element);
    }
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -18% 0px"
    }
  );

  sectionShells.forEach((section) => {
    if (!section.classList.contains("section-visible")) {
      sectionObserver.observe(section);
    }
  });

  const navState = new Map();
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        navState.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      const nextSection = [...navState.entries()]
        .sort((left, right) => right[1] - left[1])
        .find((entry) => entry[1] > 0);

      if (nextSection) {
        setActiveNavLink(nextSection[0]);
      }
    },
    {
      threshold: [0.2, 0.35, 0.55, 0.75],
      rootMargin: "-18% 0px -44% 0px"
    }
  );

  sections.forEach((section) => {
    navState.set(section.id, 0);
    navObserver.observe(section);
  });

  usesObservedNav = true;
} else {
  revealElements.forEach((element) => {
    element.classList.add("reveal-visible");
  });

  sectionShells.forEach((section) => {
    section.classList.add("section-visible");
  });
}

if (navToggle) {
  navToggle.addEventListener("click", toggleMenu);
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMenu();
  });
});

if (brandLink) {
  brandLink.addEventListener("click", () => {
    closeMenu();
  });
}

document.addEventListener("pointerdown", (event) => {
  if (!header || !header.classList.contains("menu-open") || window.innerWidth > 720) {
    return;
  }

  if (!(event.target instanceof Element)) {
    closeMenu();
    return;
  }

  if (event.target.closest(".site-nav, .nav-toggle")) {
    return;
  }

  closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && header?.classList.contains("menu-open")) {
    closeMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 720) {
    closeMenu();
  }

  runScrollEffects();
});

runScrollEffects();
setupStaticInteractionSafeguards();
setupGlowCards();
window.requestAnimationFrame(() => {
  scheduleEnhancement(setupInteractiveCards);
  scheduleEnhancement(setupPointerReactiveGlows);
  scheduleEnhancement(setupHeroParallax);
  scheduleEnhancement(setupLeadForm);
});

window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(runScrollEffects);
    }
  },
  { passive: true }
);


