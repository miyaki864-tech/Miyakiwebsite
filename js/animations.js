export function initAnimations() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Calcutta time clock
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const updateTime = () => {
            timeEl.textContent = `CALCUTTA, IN: ${new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).format(new Date())}`;
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Scroll-reveal via IntersectionObserver
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-text, .reveal-up').forEach(el => revealObserver.observe(el));

    // Hero text initial trigger
    setTimeout(() => {
        document.querySelectorAll('.hero .reveal-text').forEach(el => el.classList.add('active'));
    }, 100);

    // Parallax on scroll (desktop only)
    if (!isTouchDevice) {
        window.addEventListener('scroll', () => {
            const parallaxImage = document.querySelector('.parallax');
            if (parallaxImage) {
                parallaxImage.style.transform = `translateY(calc(-10% + ${window.scrollY * 0.2}px))`;
            }
        }, { passive: true });
    }

    // GSAP enhancements (only if GSAP is loaded)
    if (typeof gsap === 'undefined') return;

    if (!isTouchDevice) {
        gsap.to('.hero-image', {
            yPercent: 20, scale: 1.1, ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
    }
}
