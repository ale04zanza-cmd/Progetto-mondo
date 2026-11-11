(() => {
    const themeStorageKey = "travelExplorerTheme";
    const carouselTargets = {
        "countries-container": "destinazioni",
        "capitals-container": "capitali"
    };

    function applyTheme(theme) {
        const isDark = theme === "dark";
        document.body.classList.toggle("dark", isDark);

        const themeButton = document.getElementById("theme-toggle");
        if (themeButton) {
            themeButton.textContent = isDark ? "☀️" : "🌙";
            themeButton.setAttribute("aria-label", isDark ? "Attiva modalità chiara" : "Attiva modalità scura");
        }
    }

    try {
        applyTheme(window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light");
    } catch (error) {
        console.error("Impossibile leggere la modalità salvata.", error);
        applyTheme("light");
    }

    window.addEventListener("storage", (event) => {
        if (event.key !== themeStorageKey) return;
        applyTheme(event.newValue === "dark" ? "dark" : "light");
    });

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link) return;

        const carousel = link.closest(".continenti-container[id]");
        if (carousel && carouselTargets[carousel.id]) {
            const cards = [...carousel.querySelectorAll(".continente-card")];
            const cardIndex = cards.indexOf(link);
            if (cardIndex < 0) return;

            const destinationUrl = new URL(link.href);
            destinationUrl.searchParams.set("returnCarousel", carousel.id);
            destinationUrl.searchParams.set("returnCard", String(cardIndex));
            link.href = destinationUrl.href;
            return;
        }

        if (!link.matches(".city-back") || !document.body.classList.contains("city-page")) return;

        const detailUrl = new URL(window.location.href);
        const carouselId = detailUrl.searchParams.get("returnCarousel");
        const target = carouselTargets[carouselId];
        const savedCardIndex = detailUrl.searchParams.get("returnCard");
        const cardIndex = Number(savedCardIndex);
        if (!target || savedCardIndex === null || !Number.isInteger(cardIndex) || cardIndex < 0) return;

        event.preventDefault();
        const returnUrl = new URL(link.href);
        returnUrl.hash = target;
        returnUrl.searchParams.set("returnCarousel", carouselId);
        returnUrl.searchParams.set("returnCard", String(cardIndex));
        window.location.href = returnUrl.href;
    });

    document.addEventListener("DOMContentLoaded", () => {
        const themeButton = document.getElementById("theme-toggle");
        if (!themeButton) return;

        themeButton.addEventListener("click", () => {
            const theme = document.body.classList.contains("dark") ? "light" : "dark";
            applyTheme(theme);

            try {
                window.localStorage.setItem(themeStorageKey, theme);
            } catch (error) {
                console.error("Impossibile salvare la modalità scelta.", error);
            }
        });
    });
})();
