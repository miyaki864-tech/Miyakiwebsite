export function buildStudioHTML() {
    return `
        <div class="pr-bespoke-layout studio-bento reveal-up active">

            <!-- CARD 1: Hero headline -->
            <div class="sb-card sb-card--hero">
                <div class="sb-card-inner">
                    <p class="sb-eyebrow">EST. 2019</p>
                    <h1 class="sb-hero-title">THE<br>STUDIO</h1>
                    <p class="sb-hero-sub">One kiln.</p>
                </div>
            </div>

            <!-- CARD 2: Temperature stat -->
            <div class="sb-card sb-card--stat sb-card--accent">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">FIRING TEMP</p>
                    <div class="sb-stat-line">
                        <span class="sb-stat-num">1280</span><span class="sb-stat-unit">&deg;C</span>
                    </div>
                </div>
            </div>

            <!-- CARD 3: Year stat -->
            <div class="sb-card sb-card--stat sb-card--dark">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">YEARS ACTIVE</p>
                    <div class="sb-stat-line">
                        <span class="sb-stat-num">07</span>
                    </div>
                </div>
            </div>

            <!-- CARD 4: Kiln image -->
            <div class="sb-card sb-card--image sb-card--kiln">
                <img src="assets/images/generated/studio_kiln_interior.png" alt="Kiln at temperature" loading="lazy" class="sb-img">
                <div class="sb-image-caption">THE KILN</div>
            </div>

            <!-- CARD 5: Philosophy quote -->
            <div class="sb-card sb-card--quote">
                <div class="sb-card-inner">
                    <p class="sb-quote-mark">&ldquo;</p>
                    <blockquote class="sb-quote-text">We don&rsquo;t iterate after the fire.</blockquote>
                    <p class="sb-quote-body">Thrown once. Fired once. Done.</p>
                </div>
            </div>

            <!-- CARD 6: Material descriptor -->
            <div class="sb-card sb-card--material">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">MATERIAL</p>
                    <p class="sb-material-name">Stone-<br>ware</p>
                    <p class="sb-material-desc">Raw iron-rich clay. Unrefined.</p>
                </div>
            </div>

            <!-- CARD 7: Vessels image -->
            <div class="sb-card sb-card--image sb-card--vessels">
                <img src="assets/images/generated/studio_vessels_overhead.png" alt="Dark stoneware vessels, studio floor" loading="lazy" class="sb-img">
                <div class="sb-image-caption">STUDIO FLOOR</div>
            </div>

        </div>
    `;
}

export function buildAboutHTML() {
    return `
        <div class="pr-bespoke-layout about-bento reveal-up active">

            <!-- CARD 1: Declaration headline -->
            <div class="sb-card sb-card--decl">
                <div class="sb-card-inner">
                    <p class="sb-eyebrow">KOLKATA</p>
                    <h1 class="sb-decl-title">Against<br>Perfection.</h1>
                </div>
            </div>

            <!-- CARD 2: Years stat -->
            <div class="sb-card sb-card--stat sb-card--accent">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">YEARS</p>
                    <div class="sb-stat-line">
                        <span class="sb-stat-num">07</span>
                    </div>
                </div>
            </div>

            <!-- CARD 3: Kiln stat -->
            <div class="sb-card sb-card--stat sb-card--dark">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">KILNS</p>
                    <div class="sb-stat-line">
                        <span class="sb-stat-num">01</span>
                    </div>
                </div>
            </div>

            <!-- CARD 4: Heritage image -->
            <div class="sb-card sb-card--image sb-card--heritage">
                <img src="assets/images/generated/about_heritage.png" alt="Hands on the wheel" loading="lazy" class="sb-img">
                <div class="sb-image-caption">THE WHEEL</div>
            </div>

            <!-- CARD 5: Pullquote -->
            <div class="sb-card sb-card--quote">
                <div class="sb-card-inner">
                    <p class="sb-quote-mark">&ldquo;</p>
                    <blockquote class="sb-quote-text">The wheel does not lie.</blockquote>
                    <p class="sb-quote-body">No digital templates. No slip-casting. Form emerges from pure force.</p>
                </div>
            </div>

            <!-- CARD 6: Manifesto text -->
            <div class="sb-card sb-card--manifesto">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">THE ARGUMENT</p>
                    <p class="sb-manifesto-body">Permanent arguments for the dignity of imperfection.</p>
                </div>
            </div>

            <!-- CARD 7: Giant quote / CTA -->
            <div class="sb-card sb-card--about-cta">
                <div class="sb-card-inner">
                    <p class="sb-about-statement">&ldquo;WE BUILD<br>OBJECTS.<br>NOT<br>DESIGNS.&rdquo;</p>
                    <a href="shop.html" class="sb-about-cta-link">SHOP &rarr;</a>
                </div>
            </div>

        </div>
    `;
}
