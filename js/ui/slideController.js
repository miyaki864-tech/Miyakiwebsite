export class SlideController {
    constructor(config) {
        this.trackEl = document.getElementById(config.trackId);
        this.viewportEl = document.getElementById(config.viewportId);
        this.resistanceThreshold = config.resistanceThreshold || 110;
        this.animationDuration = config.animationDuration || 1200;
        
        this.itemsCount = config.itemsCount || 0;
        this.activeIndex = config.initialIndex || 0;
        this.onIndexChange = config.onIndexChange || null; // callback when active index updates
        
        this.scrollAccum = 0;
        this.resistTimer = null;
        this.isAnimating = false;

        this.initResistanceScroll();
    }

    setItemsCount(count) {
        this.itemsCount = count;
    }

    syncSlide(index, direction) {
        if (this.isAnimating && direction !== 'none') return;
        this.isAnimating = true;

        if (!this.trackEl) return;
        const slides = Array.from(this.trackEl.querySelectorAll('.series-slide'));

        const exitClass = direction === 'down' ? 'slide-exit-up' : 'slide-exit-down';
        const enterClass = direction === 'down' ? 'slide-enter-from-below' : 'slide-enter-from-above';

        // Remove old transition classes
        slides.forEach(slide => {
            slide.classList.remove('slide-exit-up', 'slide-exit-down', 'slide-enter-from-below', 'slide-enter-from-above');
        });

        if (direction === 'none') {
            slides.forEach((s, i) => s.classList.toggle('slide-active', i === index));
            this.isAnimating = false;
        } else {
            const entering = slides[index];
            const exiting = slides.find(s => s.classList.contains('slide-active'));

            if (exiting) {
                exiting.classList.add(exitClass);
                exiting.classList.remove('slide-active');
            }

            if (entering) {
                entering.classList.add('slide-active', enterClass);
                void entering.offsetHeight; // force reflow
                entering.scrollTop = 0;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        entering.classList.remove(enterClass);
                    });
                });
            }

            setTimeout(() => {
                if (exiting) {
                    exiting.classList.remove(exitClass);
                }
                this.isAnimating = false;
            }, this.animationDuration);
        }

        if (this.onIndexChange) {
            this.onIndexChange(index);
        }
    }

    goToNext() {
        if (this.activeIndex < this.itemsCount - 1 && !this.isAnimating) {
            this.activeIndex++;
            this.syncSlide(this.activeIndex, 'down');
        }
    }

    goToPrev() {
        if (this.activeIndex > 0 && !this.isAnimating) {
            this.activeIndex--;
            this.syncSlide(this.activeIndex, 'up');
        }
    }

    goToIndex(index) {
        if (this.isAnimating || index === this.activeIndex || index < 0 || index >= this.itemsCount) return;
        const dir = index > this.activeIndex ? 'down' : 'up';
        this.activeIndex = index;
        this.syncSlide(this.activeIndex, dir);
    }

    initResistanceScroll() {
        if (!this.viewportEl) return;

        const arcFill  = document.getElementById('arc-fill');
        const arcWrap  = document.getElementById('scroll-resistance-wrap');
        const dirLabel = document.getElementById('resistance-direction');
        const CIRCUMFERENCE = 94.25;

        const setArc = (progress, direction) => {
            if (!arcFill || !dirLabel || !arcWrap) return;
            const offset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(progress, 1));
            arcFill.style.strokeDashoffset = offset;
            dirLabel.textContent = direction > 0 ? '↓' : '↑';

            if (progress > 0.05) {
                arcWrap.classList.add('visible');
            } else {
                arcWrap.classList.remove('visible');
            }
        };

        const resetAccum = () => {
            this.scrollAccum = 0;
            setArc(0, 1);
            if (arcWrap) arcWrap.classList.remove('visible');
            clearTimeout(this.resistTimer);
        };

        this.viewportEl.addEventListener('wheel', (e) => {
            // Ignore if a modal is open (like the product panel in shop)
            if (document.body.style.overflow === 'hidden') return;

            const activeSlide = document.querySelector('.series-slide.slide-active');
            if (!activeSlide) return;

            const delta = e.deltaY;
            const atBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 2;
            const atTop = activeSlide.scrollTop <= 0;
            const scrollingDown = delta > 0;
            const scrollingUp = delta < 0;

            if (scrollingDown && !atBottom) {
                resetAccum();
                return;
            }
            if (scrollingUp && !atTop) {
                resetAccum();
                return;
            }

            e.preventDefault();
            this.scrollAccum += delta;

            const progress = Math.abs(this.scrollAccum) / this.resistanceThreshold;
            setArc(progress, this.scrollAccum);

            clearTimeout(this.resistTimer);
            this.resistTimer = setTimeout(resetAccum, 800);

            if (this.scrollAccum > this.resistanceThreshold) {
                resetAccum();
                this.goToNext();
            } else if (this.scrollAccum < -this.resistanceThreshold) {
                resetAccum();
                this.goToPrev();
            }
        }, { passive: false });
        
        let touchStartY = null;
        this.viewportEl.addEventListener('touchstart', e => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.viewportEl.addEventListener('touchend', e => {
            if (document.body.style.overflow === 'hidden') return;
            if (touchStartY === null) return;
            const diff = touchStartY - e.changedTouches[0].clientY;
            touchStartY = null;
            if (Math.abs(diff) < 60) return;
            if (diff > 0) this.goToNext(); else this.goToPrev();
        }, { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', e => {
            if (document.body.style.overflow === 'hidden') return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowDown' || e.key === 'PageDown') this.goToNext();
            if (e.key === 'ArrowUp'   || e.key === 'PageUp')   this.goToPrev();
        });
    }
}
