/* Helmi portfolio — vanilla JS: mobile nav, scroll state, active link, reveal. */
(function () {
    "use strict";

    var header = document.getElementById("site-header");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");
    var yearEl = document.getElementById("year");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Footer year */
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    /* Header border on scroll */
    function onScroll() {
        if (header) {
            header.classList.toggle("is-scrolled", window.scrollY > 8);
        }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Mobile menu */
    if (toggle && menu) {
        toggle.addEventListener("click", function () {
            var open = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            toggle.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
        });

        menu.addEventListener("click", function (event) {
            if (event.target.closest("a") && menu.classList.contains("is-open")) {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.setAttribute("aria-label", "Buka menu navigasi");
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && menu.classList.contains("is-open")) {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.setAttribute("aria-label", "Buka menu navigasi");
                toggle.focus();
            }
        });
    }

    /* Active nav link via IntersectionObserver */
    var navAnchors = Array.prototype.slice.call(
        document.querySelectorAll('.nav-links a[href^="#"]')
    );
    var sections = navAnchors
        .map(function (a) { return document.querySelector(a.getAttribute("href")); })
        .filter(Boolean);

    var sideAnchors = Array.prototype.slice.call(
        document.querySelectorAll('.side-index a[href^="#"]')
    );

    function setActive(id) {
        navAnchors.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
        sideAnchors.forEach(function (a) {
            var on = a.getAttribute("href") === "#" + id;
            a.classList.toggle("is-active", on);
            if (on) {
                a.setAttribute("aria-current", "true");
            } else {
                a.removeAttribute("aria-current");
            }
        });
    }

    if ("IntersectionObserver" in window && sections.length > 0) {
        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        setActive(entry.target.id);
                    }
                });
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
        );
        sections.forEach(function (s) { observer.observe(s); });
    }

    /* Boot splash — "Welcome" (0,5 detik).
       - Markup statis di HTML biar langsung ter-paint; JS hanya menutup.
       - Hero reveal ditahan sampai splash selesai (lihat finishBoot). */
    var BOOT_DURATION = 500;
    var BOOT_HOLD = reduceMotion ? 50 : 100;

    /* Editorial scroll reveal — Standard tier (y24 / 600ms / stagger 80ms).
       - No-JS fallback: .reveal hanya ditambah via JS, jadi tanpa JS konten tetap terlihat.
       - Reduced motion: skip semua animasi, render final state langsung.
       - Dipanggil setelah boot selesai agar entrance hero tidak main di balik splash. */
    function initReveal() {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            return;
        }

    function addReveal(el, delayMs, useScale) {
        if (!el || el.classList.contains("reveal")) {
            return;
        }
        el.classList.add("reveal");
        if (useScale) {
            el.classList.add("reveal-scale");
        }
        if (typeof delayMs === "number" && delayMs > 0) {
            // Cap total stagger biar list panjang tidak terasa laggy (maks ~8 item).
            el.style.setProperty("--reveal-delay", Math.min(delayMs, 640) + "ms");
        }
    }

    function staggerChildren(container, childSelector, stepMs, useScale) {
        var children = container.querySelectorAll(childSelector);
        Array.prototype.forEach.call(children, function (child, index) {
            addReveal(child, index * stepMs, useScale);
        });
        return children;
    }

    /* 1. Hero entrance — stagger on load (di atas fold, langsung terlihat). */
    var heroStagger = [
        [".eyebrow", 0],
        [".hero-title", 80],
        [".hero-role", 160],
        [".hero-desc", 240],
        [".hero-actions", 320],
        [".hero-visual", 200],
    ];
    heroStagger.forEach(function (pair) {
        var el = document.querySelector(pair[0]);
        addReveal(el, pair[1], pair[0] === ".hero-visual");
    });
    var heroMeta = document.querySelector(".hero-meta");
    if (heroMeta) {
        staggerChildren(heroMeta, ":scope > div", 80, false);
    }

    /* 2. Section headers — fade-up satu per satu. */
    Array.prototype.forEach.call(
        document.querySelectorAll(".section-index, .section-title"),
        function (el) { addReveal(el, 0, false); }
    );

    /* 3. About — paragraf stagger + kartu samping scale halus. */
    var aboutStory = document.querySelector(".about-story");
    if (aboutStory) {
        staggerChildren(aboutStory, "p", 80, false);
    }
    addReveal(document.querySelector(".about-side"), 120, true);

    /* 4. Stack groups — stagger per baris. */
    var stackGroups = document.querySelector(".stack-groups");
    if (stackGroups) {
        staggerChildren(stackGroups, ".stack-group", 80, false);
    }

    /* 5. Projects — kartu stagger + scale halus, featured sedikit lebih lambat. */
    var projectList = document.querySelector(".project-list");
    if (projectList) {
        staggerChildren(projectList, ".project", 80, true);
    }
    addReveal(document.querySelector(".projects-more"), 160, false);

    /* 6. Contact — judul, deskripsi, lalu tiap link stagger. */
    addReveal(document.querySelector(".contact-title"), 0, false);
    addReveal(document.querySelector(".contact-desc"), 80, false);
    var contactLinks = document.querySelector(".contact-links");
    if (contactLinks) {
        staggerChildren(contactLinks, "li", 80, false);
    }

    /* Observer: trigger ~top 85% (ala ScrollTrigger start 'top 85%'), sekali main. */
    var revealObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { rootMargin: "0px 0px -15% 0px", threshold: 0.1 }
    );
    Array.prototype.forEach.call(
        document.querySelectorAll(".reveal"),
        function (el) { revealObserver.observe(el); }
    );
    }

    /* Jalankan boot Welcome 0,5 detik; panggil initReveal saat splash mulai
       exit agar hero stagger-in berbarengan dengan fade-out splash. */
    (function runBoot() {
        var boot = document.getElementById("boot");
        if (!boot) {
            initReveal();
            return;
        }

        var finished = false;

        document.documentElement.classList.add("is-booting");

        function finishBoot() {
            if (finished) {
                return;
            }
            finished = true;
            window.setTimeout(function () {
                boot.classList.add("is-done");
                initReveal();
                window.setTimeout(function () {
                    document.documentElement.classList.remove("is-booting");
                    if (boot.parentNode) {
                        boot.parentNode.removeChild(boot);
                    }
                }, 500);
            }, BOOT_HOLD);
        }

        /* Tampilkan "Welcome" selama 0,5 detik, lalu tutup. */
        window.setTimeout(finishBoot, BOOT_DURATION);
        /* Failsafe: jangan pernah mengunci halaman lebih dari ~1,5 detik. */
        window.setTimeout(finishBoot, BOOT_DURATION + 1000);
    })();
})();
