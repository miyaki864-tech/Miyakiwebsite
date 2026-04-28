import { SlideController } from './ui/slideController.js';
import { buildStudioHTML, buildAboutHTML } from './templates/archiveTemplates.js';
import { renderEvents } from './components/eventsModule.js';

let _activeCategory = 'Studio';
const CATEGORIES = ['Studio', 'About', 'Events'];

export async function initArchive() {
    const root = document.getElementById('archive-root');
    if (!root) return;

    root.innerHTML = `
        <aside class="shop-sidebar archive-sidebar">
            <div id="archive-links" class="series-links-container archive-static-links">
                <button class="series-link active" data-category="Studio"><span>STUDIO</span></button>
                <button class="series-link" data-category="About"><span>ABOUT</span></button>
                <button class="series-link" data-category="Events"><span>EVENTS</span></button>
            </div>
        </aside>

        <div class="shop-slides-viewport archive-grid-viewport" id="archive-grid-viewport">
            
            <!-- Resistance progress arc -->
            <div class="scroll-resistance-wrap" id="scroll-resistance-wrap">
                <svg class="resistance-arc" viewBox="0 0 40 40">
                    <circle class="arc-bg" cx="20" cy="20" r="15" fill="none" stroke-width="1.5"/>
                    <circle class="arc-fill" id="arc-fill" cx="20" cy="20" r="15" fill="none" stroke-width="1.5"
                        stroke-dasharray="94.25" stroke-dashoffset="94.25"
                        stroke-linecap="round" transform="rotate(-90 20 20)"/>
                </svg>
                <span class="resistance-direction" id="resistance-direction">↓</span>
            </div>

            <div class="shop-slides-track archive-slides-track" id="archive-slides-track">
                <!-- Slides will be rendered here -->
            </div>
        </div>
    `;

    const track = document.getElementById('archive-slides-track');
    CATEGORIES.forEach((cat) => {
        const slide = document.createElement('div');
        slide.className = 'series-slide';
        slide.dataset.category = cat;
        slide.innerHTML = `
            <div class="series-slide-inner archive-stage-inner">
                <div class="archive-section-kicker">Archive / ${cat}</div>
                <div id="archive-container-${cat}"></div>
            </div>
        `;
        track.appendChild(slide);
    });

    document.getElementById('archive-container-Studio').innerHTML = buildStudioHTML();
    document.getElementById('archive-container-About').innerHTML = buildAboutHTML();
    
    const evContainer = document.getElementById('archive-container-Events');
    evContainer.innerHTML = `<div class="pr-events-loading"><span>Loading</span></div>`;
    await renderEvents(evContainer);

    const buttons = root.querySelectorAll('#archive-links .series-link');
    
    function updateActiveButton(category) {
        buttons.forEach(b => {
             b.classList.toggle('active', b.dataset.category === category);
        });
    }

    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
        const slideController = new SlideController({
            trackId: 'archive-slides-track',
            viewportId: 'archive-grid-viewport',
            resistanceThreshold: 110,
            animationDuration: 1200,
            itemsCount: CATEGORIES.length,
            initialIndex: CATEGORIES.indexOf(_activeCategory),
            onIndexChange: (index) => {
                _activeCategory = CATEGORIES[index];
                updateActiveButton(_activeCategory);
            }
        });

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetIdx = CATEGORIES.indexOf(btn.dataset.category);
                slideController.goToIndex(targetIdx);
            });
        });

        slideController.syncSlide(CATEGORIES.indexOf(_activeCategory), 'none');
    } else {
        const slides = Array.from(track.querySelectorAll('.series-slide'));
        slides.forEach((slide) => {
            slide.classList.add('slide-active', 'archive-mobile-section');
        });

        // Mobile Tab Navigation (Jump to section since physics are off)
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                const target = root.querySelector(`.series-slide[data-category="${cat}"]`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    updateActiveButton(cat);
                }
            });
        });

        // Inject stat pair wrappers for mobile bento grid
        const packStats = (containerId) => {
            const container = document.querySelector(
                `#${containerId} .studio-bento, #${containerId} .about-bento, #${containerId} .events-bento`
            );
            if (!container) return;
            const stats = Array.from(container.querySelectorAll(':scope > .sb-card--stat'));
            for (let i = 0; i < stats.length; i += 2) {
                if (stats[i+1]) {
                    const wrap = document.createElement('div');
                    wrap.className = 'stat-pair-row';
                    container.insertBefore(wrap, stats[i]);
                    wrap.appendChild(stats[i]);
                    wrap.appendChild(stats[i+1]);
                }
            }
        };
        packStats('archive-container-Studio');
        packStats('archive-container-About');
        packStats('archive-container-Events');
    }
}
