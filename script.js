/* ============================================
   FUNDACIÓN IMPULSO
   SCRIPT.JS
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ============================================
       REVEAL ANIMATION ON SCROLL
       ============================================ */

    const revealElements = document.querySelectorAll(
        ".card, .story-card, .gallery-item, .stat, .timeline-item, .section-header"
    );

    revealElements.forEach(el => {
        el.classList.add("reveal");
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, {
        threshold: 0.15
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    /* ============================================
       COUNTER ANIMATION
       ============================================ */

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000)
                .toFixed(1)
                .replace(/\.0$/, "") + "M";
        }

        if (num >= 1000) {
            return (num / 1000)
                .toFixed(1)
                .replace(/\.0$/, "") + "K";
        }

        return num.toString();
    }

    const counters = document.querySelectorAll(".counter");

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const counter = entry.target;
            const target = parseInt(counter.textContent);
            let current = 0;
            const speed = target / 120;

            const updateCounter = () => {
                current += speed;
                if (current < target) {
                    counter.textContent = formatNumber(Math.floor(current));
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = formatNumber(target);
                }
            };

            updateCounter();
            counterObserver.unobserve(counter);
        });
    }, {
        threshold: 0.5
    });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    /* ============================================
       HEADER EFFECT
       ============================================ */

    const header = document.querySelector(".header");

    /* ============================================
   MENÚ MÓVIL
============================================ */

const menuToggle = document.querySelector(".menu-toggle");
const navbar = document.querySelector(".navbar");

if (menuToggle && navbar) {

    menuToggle.addEventListener("click", () => {

        navbar.classList.toggle("active");

    });

}

    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.style.background = "rgba(10,10,11,0.90)";
            header.style.borderBottom = "1px solid rgba(255,255,255,.08)";
        } else {
            header.style.background = "rgba(10,10,11,0.65)";
        }
    });

    /* ============================================
       SMOOTH SCROLL
       ============================================ */

    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const target = document.querySelector(targetId);

            if (!target) return;

            target.scrollIntoView({
                behavior: "smooth"
            });
        });
    });

    /* ============================================
       LANGUAGE SYSTEM
       ============================================ */

    const esBtn = document.getElementById("esBtn");
    const enBtn = document.getElementById("enBtn");

    const translations = {
        es: {
            heroTitle: "Cada persona merece una segunda oportunidad.",
            heroText: "Ayudamos a personas necesitadas a recuperar esperanza, dignidad y oportunidades para construir un mejor futuro.",
            heroBtn1: "Ver Historias",
            heroBtn2: "Nuestra Misión"
        },
        en: {
            heroTitle: "Everyone deserves a second chance.",
            heroText: "We help people in need regain hope, dignity and opportunities to build a better future.",
            heroBtn1: "View Stories",
            heroBtn2: "Our Mission"
        }
    };

    function setLanguage(lang) {
        const heroTitle = document.querySelector(".hero h1");
        const heroText = document.querySelector(".hero p");
        const heroButtons = document.querySelectorAll(".hero-buttons a");

        if (heroTitle && heroText && heroButtons.length >= 2) {
            heroTitle.textContent = translations[lang].heroTitle;
            heroText.textContent = translations[lang].heroText;
            heroButtons[0].textContent = translations[lang].heroBtn1;
            heroButtons[1].textContent = translations[lang].heroBtn2;
        }
    }

    if (esBtn) {
        esBtn.addEventListener("click", () => {
            setLanguage("es");
        });
    }

    if (enBtn) {
        enBtn.addEventListener("click", () => {
            setLanguage("en");
        });
    }

    /* ============================================
       PARALLAX HERO
       ============================================ */

    const hero = document.querySelector(".hero-content");

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        if (hero) {
            hero.style.transform = `translateY(${scrollY * 0.15}px)`;
            hero.style.opacity = 1 - scrollY / 700;
        }
    });

    /* ============================================
       GALLERY HOVER GLOW
       ============================================ */

    const galleryItems = document.querySelectorAll(".gallery-item");

    galleryItems.forEach(item => {
        item.addEventListener("mousemove", e => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            item.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(245,166,35,.25), #1a1a1f 60%)`;
        });

        item.addEventListener("mouseleave", () => {
            item.style.background = "linear-gradient(135deg,#222228,#151518)";
        });
    });

    /* ============================================
       ACTIVE MENU ON SCROLL
       ============================================ */

    const sections = document.querySelectorAll("section[id]");
    const menuLinks = document.querySelectorAll(".nav a");

    window.addEventListener("scroll", () => {
        let current = "";

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute("id");
            }
        });

        menuLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + current) {
                link.classList.add("active");
            }
        });
    });

    /* ============================================
       HERO FADE-IN
       ============================================ */

    const heroContent = document.querySelector(".hero-content");

    if (heroContent) {
        heroContent.style.opacity = "0";
        heroContent.style.transform = "translateY(40px)";

        setTimeout(() => {
            heroContent.style.transition = "all 1.2s ease";
            heroContent.style.opacity = "1";
            heroContent.style.transform = "translateY(0px)";
        }, 300);
    }

    /* ============================================
       PRELOADER (CORREGIDO)
       ============================================ */
    const preloader = document.getElementById("preloader");
    
    if (preloader) {
        // Se ejecuta de inmediato cuando el DOM está listo
        preloader.style.opacity = "0";
        setTimeout(() => {
            preloader.style.display = "none";
        }, 600);
    }

    /* ============================================
       CONTACT FORM EMAILJS (REORGANIZADO ADENTRO)
       ============================================ */
    // Inicializar EmailJS
    if (typeof emailjs !== "undefined") {
        emailjs.init("LEWhsYtH2U7zjnDzg");
    }

    const contactForm = document.getElementById("contact-form");
    const sendBtn = document.getElementById("sendBtn");

    if (sendBtn && contactForm) {
        sendBtn.addEventListener("click", function (e) {
            e.preventDefault();
            console.log("BOTÓN PRESIONADO - ENVIANDO FORMULARIO");

            emailjs.sendForm(
                "service_g941eww",
                "template_0rhl079",
                contactForm
            )
            .then(function () {
                alert("¡Mensaje enviado correctamente!");
                contactForm.reset();
            })
            .catch(function (error) {
                console.error(error);
                alert("Error al enviar el mensaje.");
            });
        });
    }


/* ============================================
   BOTÓN SUBIR
============================================ */

const scrollBtn = document.getElementById("scrollTop");

if (scrollBtn) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 300) {

            scrollBtn.style.display = "flex";

        } else {

            scrollBtn.style.display = "none";

        }

    });

    scrollBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}


    /* ============================================
       CONSOLE MESSAGE
       ============================================ */
    console.log(
        "%cFundación Impulso",
        "color:#F5A623;font-size:24px;font-weight:bold;"
    );
    console.log("Sitio desarrollado con diseño premium.");

});