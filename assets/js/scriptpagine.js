(() => {
    const profileStorageKey = "travelExplorerProfile";
    const savedTripsKey = "travelExplorerTrips:";
    const visitedCountriesKey = "travelExplorerVisitedCountries:";
    const destinations = {
        roma: { href: "destinazioni/roma.html", label: "Roma · Italia", country: "Italia" },
        parigi: { href: "destinazioni/parigi.html", label: "Parigi · Francia", country: "Francia" },
        madrid: { href: "destinazioni/madrid.html", label: "Madrid · Spagna", country: "Spagna" },
        tokyo: { href: "destinazioni/tokyo.html", label: "Tokyo · Giappone", country: "Giappone" },
        atene: { href: "destinazioni/atene.html", label: "Atene · Grecia", country: "Grecia" },
        washingtondc: { href: "destinazioni/washingtondc.html", label: "Washington, D.C. · Stati Uniti", country: "Stati Uniti" },
        ilcairo: { href: "destinazioni/ilcairo.html", label: "Il Cairo · Egitto", country: "Egitto" },
        bangkok: { href: "destinazioni/bangkok.html", label: "Bangkok · Thailandia", country: "Thailandia" },
        brasilia: { href: "destinazioni/brasilia.html", label: "Brasilia · Brasile", country: "Brasile" },
        canberra: { href: "destinazioni/canberra.html", label: "Canberra · Australia", country: "Australia" },
        nairobi: { href: "destinazioni/nairobi.html", label: "Nairobi · Kenya", country: "Kenya" },
        male: { href: "destinazioni/male.html", label: "Malé · Maldive", country: "Maldive" }
    };

    function getDisplayName(email) {
        const nameFromEmail = email.split("@")[0]
            .split("+")[0]
            .replace(/[._-]+/g, " ")
            .trim();

        if (!nameFromEmail) return "Viaggiatore";
        return nameFromEmail.split(/\s+/)
            .map((part) => part.charAt(0).toLocaleUpperCase("it") + part.slice(1))
            .join(" ");
    }

    function getDemoLoginSubmission(loginForm, event) {
        const nameInput = document.getElementById("login-name");
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        if (!nameInput || !emailInput || !passwordInput) {
            throw new Error("Il modulo di accesso deve contenere nome, email e password.");
        }

        const isRegistering = event.submitter && event.submitter.value === "register";
        const name = nameInput.value.trim();
        nameInput.required = Boolean(isRegistering);
        nameInput.setCustomValidity(isRegistering && !name ? "Inserisci il nome per registrarti." : "");
        if (!loginForm.reportValidity()) {
            nameInput.setCustomValidity("");
            return null;
        }
        nameInput.setCustomValidity("");

        const email = emailInput.value.trim();
        emailInput.value = email;
        return {
            user: { name: name || getDisplayName(email), email },
            isRegistering: Boolean(isRegistering)
        };
    }

    function initPasswordVisibility() {
        document.querySelectorAll(".password-toggle").forEach((toggle) => {
            const passwordInput = toggle.closest(".password-input-wrap")?.querySelector('input[type="password"], input[type="text"]');
            if (!passwordInput) {
                throw new Error("Il pulsante mostra password deve essere associato a un campo password.");
            }

            toggle.addEventListener("click", () => {
                const isVisible = passwordInput.type === "text";
                passwordInput.type = isVisible ? "password" : "text";
                toggle.setAttribute("aria-pressed", String(!isVisible));
                toggle.setAttribute("aria-label", isVisible ? "Mostra password" : "Nascondi password");
            });
        });
    }

    function readVisitedCountries(email) {
        const savedCountries = window.localStorage.getItem(visitedCountriesKey + email.toLowerCase());
        if (!savedCountries) return [];

        const countries = JSON.parse(savedCountries);
        const knownCountries = new Set(Object.values(destinations).map((destination) => destination.country));
        if (!Array.isArray(countries) || !countries.every((country) => knownCountries.has(country))) {
            throw new Error("L'elenco dei Paesi visitati non è valido.");
        }
        return [...new Set(countries)];
    }

    function markVisitedCountry(email, country) {
        const countries = readVisitedCountries(email);
        if (countries.includes(country)) return countries;

        countries.push(country);
        window.localStorage.setItem(visitedCountriesKey + email.toLowerCase(), JSON.stringify(countries));
        return countries;
    }

    function removeVisitedCountry(email, country) {
        const countries = readVisitedCountries(email).filter((visitedCountry) => visitedCountry !== country);
        window.localStorage.setItem(visitedCountriesKey + email.toLowerCase(), JSON.stringify(countries));
        return countries;
    }

    function renderVisitedCountries(email) {
        const badgeList = document.getElementById("visited-country-badges");
        const countBadge = document.getElementById("visited-country-count");
        if (!badgeList || !countBadge) {
            throw new Error("Il profilo deve contenere il riepilogo dei Paesi visitati.");
        }

        const countries = readVisitedCountries(email);
        countBadge.textContent = String(countries.length);
        countBadge.setAttribute("aria-label", `${countries.length} Paesi visitati`);
        badgeList.replaceChildren();

        if (countries.length === 0) {
            const emptyMessage = document.createElement("span");
            emptyMessage.className = "visited-countries-empty";
            emptyMessage.textContent = "Registra un acquisto per aggiungere un Paese.";
            badgeList.append(emptyMessage);
            return;
        }

        countries.forEach((country) => {
            const badge = document.createElement("span");
            badge.className = "visited-country-badge";
            const name = document.createElement("span");
            name.textContent = country;
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "visited-country-remove";
            removeButton.textContent = "×";
            removeButton.setAttribute("aria-label", `Rimuovi ${country} dai Paesi visitati`);
            removeButton.addEventListener("click", () => {
                try {
                    removeVisitedCountry(email, country);
                    renderVisitedCountries(email);
                } catch (error) {
                    console.error(`Impossibile rimuovere ${country} dai Paesi visitati.`, error);
                    const loginMessage = document.getElementById("login-message");
                    if (loginMessage) loginMessage.textContent = "Non è stato possibile aggiornare i Paesi visitati.";
                }
            });
            badge.append(name, removeButton);
            badgeList.append(badge);
        });
    }

    function readSavedTrips(email) {
        const data = window.localStorage.getItem(savedTripsKey + email.toLowerCase());
        if (!data) return [];

        const trips = JSON.parse(data);
        if (!Array.isArray(trips)) {
            throw new Error("L'elenco dei viaggi salvati non è valido.");
        }
        return trips.map((trip) => {
            if (typeof trip === "string" && destinations[trip]) {
                return {
                    id: `legacy-${trip}`,
                    citySlug: trip,
                    days: 3,
                    people: 1,
                    title: "Una prima visita",
                    startDate: "",
                    options: []
                };
            }
            if (
                !trip
                || typeof trip.id !== "string"
                || !destinations[trip.citySlug]
                || !Number.isInteger(trip.days)
                || !Number.isInteger(trip.people)
                || typeof trip.title !== "string"
                || (trip.startDate !== undefined && typeof trip.startDate !== "string")
                || !Array.isArray(trip.options)
            ) {
                throw new Error("Un itinerario salvato non è valido.");
            }
            return { ...trip, startDate: trip.startDate || "" };
        });
    }

    function initCityPage() {
        const citySlug = document.body.dataset.city;
        const city = destinations[citySlug];
        if (!city) {
            throw new Error("La pagina città non specifica una destinazione valida.");
        }

        document.getElementById("city-year").textContent = new Date().getFullYear();

        const saveTripButtons = [...document.querySelectorAll(".itinerary-save-button")];
        const saveTripStatus = document.getElementById("save-trip-status");
        if (saveTripButtons.length !== 3 || !saveTripStatus) {
            throw new Error("La pagina città deve avere tre pulsanti per salvare la destinazione.");
        }
        const profileButton = document.getElementById("city-profile-button");
        const profileDialog = document.getElementById("profile-dialog");
        const loginForm = document.getElementById("login-form");
        const profileSession = document.getElementById("profile-session");
        const loginMessage = document.getElementById("login-message");
        let loggedInUser = null;
        let savedTrips = [];
        let storageError = false;
        let pendingTripSave = null;

        function showStorageError(message, error) {
            console.error(message, error);
            storageError = true;
            saveTripButtons.forEach((button) => {
                button.disabled = true;
            });
            saveTripStatus.textContent = message;
        }

        try {
            const savedProfile = window.localStorage.getItem(profileStorageKey);
            if (savedProfile) {
                const user = JSON.parse(savedProfile);
                if (typeof user.name !== "string" || typeof user.email !== "string") {
                    throw new Error("Il profilo salvato non contiene i dati richiesti.");
                }
                loggedInUser = user;
            }
        } catch (error) {
            showStorageError("Non è stato possibile verificare l'accesso al profilo.", error);
        }

        if (!storageError && loggedInUser) {
            try {
                savedTrips = readSavedTrips(loggedInUser.email);
            } catch (error) {
                showStorageError("Non è stato possibile leggere i viaggi salvati.", error);
            }
        }

        function renderProfile() {
            const loggedIn = loggedInUser !== null;
            loginForm.hidden = loggedIn;
            profileSession.hidden = !loggedIn;
            document.getElementById("profile-title").textContent = loggedIn ? "Il tuo profilo" : "Accedi al profilo";
            profileButton.querySelector("span").textContent = loggedIn ? loggedInUser.name : "Accedi";
            if (loggedIn) {
                document.getElementById("profile-name").textContent = `Ciao, ${loggedInUser.name}!`;
                try {
                    renderVisitedCountries(loggedInUser.email);
                } catch (error) {
                    console.error("Impossibile mostrare i Paesi visitati.", error);
                    loginMessage.textContent = "Non è stato possibile mostrare l'elenco dei Paesi visitati.";
                }
            }
        }

        function renderSavedTrip() {
            if (storageError) return;

            if (!loggedInUser) {
                saveTripButtons.forEach((button) => {
                    button.textContent = "Salva itinerario";
                    button.classList.remove("is-saved");
                });
                saveTripStatus.textContent = "Accedi per salvare questo viaggio.";
                return;
            }

            let hasSavedTrip = false;
            saveTripButtons.forEach((button) => {
                const card = button.closest(".itinerary-card");
                const days = Number(card.querySelector(".itinerary-duration").textContent.match(/\d+/)[0]);
                const isSaved = savedTrips.some((trip) => trip.citySlug === citySlug && trip.days === days);
                button.textContent = isSaved ? "Itinerario salvato ✓" : "Salva itinerario";
                button.classList.toggle("is-saved", isSaved);
                hasSavedTrip = hasSavedTrip || isSaved;
            });
            saveTripStatus.textContent = hasSavedTrip
                ? `Gli itinerari salvati sono disponibili nella pagina I miei viaggi.`
                : "";
        }

        function saveTrip(button) {
            const selectedCard = button.closest(".itinerary-card");
            const selectedDays = Number(selectedCard.querySelector(".itinerary-duration").textContent.match(/\d+/)[0]);
            if (!loggedInUser || savedTrips.some((trip) => trip.citySlug === citySlug && trip.days === selectedDays)) {
                renderSavedTrip();
                return;
            }

            const options = [...document.querySelectorAll(".itinerary-card")].map((card) => {
                const costValues = card.querySelector(".itinerary-cost").textContent.match(/\d[\d.]*/g);
                return {
                    days: Number(card.querySelector(".itinerary-duration").textContent.match(/\d+/)[0]),
                    title: card.querySelector("h3").textContent.trim(),
                    activities: [...card.querySelectorAll(".itinerary-days li")].map((item) => {
                        const heading = item.querySelector("strong");
                        const description = item.querySelector("span");
                        return heading && description
                            ? `${heading.textContent} · ${description.textContent}`
                            : item.textContent.trim();
                    }),
                    costMin: Number(costValues[0].replace(/\./g, "")),
                    costMax: Number(costValues[1].replace(/\./g, ""))
                };
            });
            const selectedOption = options.find((option) => option.days === selectedDays);
            const trip = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                citySlug,
                days: selectedOption.days,
                people: 1,
                title: selectedOption.title,
                options
            };
            savedTrips.push(trip);
            try {
                window.localStorage.setItem(
                    savedTripsKey + loggedInUser.email.toLowerCase(),
                    JSON.stringify(savedTrips)
                );
                const message = `Itinerario di ${city.label.split(" · ")[0]} salvato nei tuoi viaggi.`;
                saveTripStatus.textContent = message;
                loginMessage.textContent = message;
                renderSavedTrip();
            } catch (error) {
                savedTrips.pop();
                console.error("Impossibile salvare l'itinerario nei viaggi.", error);
                saveTripStatus.textContent = "Non è stato possibile salvare il viaggio nel browser.";
                loginMessage.textContent = saveTripStatus.textContent;
            }
        }

        renderSavedTrip();
        renderProfile();

        profileButton.addEventListener("click", () => {
            renderProfile();
            profileDialog.showModal();
        });

        document.getElementById("close-profile").addEventListener("click", () => profileDialog.close());
        document.getElementById("confirm-profile").addEventListener("click", () => profileDialog.close());
        profileDialog.addEventListener("click", (event) => {
            if (event.target === profileDialog) profileDialog.close();
        });

        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const submission = getDemoLoginSubmission(loginForm, event);
            if (!submission) return;
            const { user, isRegistering } = submission;
            const email = user.email;
            let trips = [];
            try {
                trips = readSavedTrips(email);
                window.localStorage.setItem(savedTripsKey + email.toLowerCase(), JSON.stringify(trips));
                window.localStorage.setItem(profileStorageKey, JSON.stringify(user));
            } catch (error) {
                console.error("Impossibile completare l'accesso o leggere i viaggi salvati.", error);
                loginMessage.textContent = "Non è stato possibile completare l'accesso o caricare i viaggi salvati.";
                return;
            }

            loggedInUser = user;
            savedTrips = trips;
            document.getElementById("login-password").value = "";
            renderProfile();
            loginMessage.textContent = isRegistering ? "Registrazione completata." : "Accesso effettuato.";
            renderSavedTrip();
            if (pendingTripSave) {
                const button = pendingTripSave;
                pendingTripSave = false;
                saveTrip(button);
            }
        });

        document.getElementById("logout-button").addEventListener("click", () => {
            loggedInUser = null;
            savedTrips = [];
            loginForm.reset();
            loginMessage.textContent = "";
            try {
                window.localStorage.removeItem(profileStorageKey);
            } catch (error) {
                console.error("Impossibile rimuovere il profilo salvato.", error);
                loginMessage.textContent = "Non è stato possibile rimuovere il profilo salvato dal browser.";
            }
            renderProfile();
            renderSavedTrip();
        });

        saveTripButtons.forEach((button) => button.addEventListener("click", () => {
            if (storageError) return;
            if (!loggedInUser) {
                pendingTripSave = button;
                loginMessage.textContent = "";
                renderProfile();
                profileDialog.showModal();
                return;
            }
            const days = Number(button.closest(".itinerary-card").querySelector(".itinerary-duration").textContent.match(/\d+/)[0]);
            if (savedTrips.some((trip) => trip.citySlug === citySlug && trip.days === days)) {
                renderSavedTrip();
                return;
            }
            saveTrip(button);
        }));
    }

    function initTripsPage() {
        const profileButton = document.getElementById("trips-profile-button");
        const profileDialog = document.getElementById("profile-dialog");
        const loginForm = document.getElementById("login-form");
        const profileSession = document.getElementById("profile-session");
        const loginMessage = document.getElementById("login-message");
        const profileStorageKey = "travelExplorerProfile";
        const purchasesKey = "travelExplorerPurchases:";
        const manager = document.getElementById("itinerary-manager");
        const loginPrompt = document.getElementById("trips-login-prompt");
        const savedTripsList = document.getElementById("saved-itineraries");
        const savedTripsEmpty = document.getElementById("saved-itineraries-empty");
        const purchasesList = document.getElementById("purchased-trips");
        const purchasesEmpty = document.getElementById("purchased-trips-empty");
        const clearHistoryButton = document.getElementById("clear-purchase-history");
        const managerMessage = document.getElementById("trips-message");
        const currency = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
        let loggedInUser = null;
        let savedTrips = [];
        let purchases = [];

        function loadProfile() {
            try {
                const data = window.localStorage.getItem(profileStorageKey);
                if (!data) return null;
                const user = JSON.parse(data);
                if (typeof user.name !== "string" || typeof user.email !== "string") {
                    throw new Error("Il profilo salvato non contiene i dati richiesti.");
                }
                return user;
            } catch (error) {
                console.error("Impossibile leggere il profilo salvato.", error);
                managerMessage.textContent = "Non è stato possibile recuperare il profilo salvato.";
                return null;
            }
        }

        function readPurchases(email) {
            const data = window.localStorage.getItem(purchasesKey + email.toLowerCase());
            if (!data) return [];
            const items = JSON.parse(data);
            if (!Array.isArray(items) || !items.every((item) =>
                item && typeof item.id === "string" && destinations[item.citySlug]
                && typeof item.purchasedAt === "string" && Number.isInteger(item.days)
                && Number.isInteger(item.people) && Number.isFinite(item.totalMin)
                && Number.isFinite(item.totalMax)
                && (item.startDate === undefined || typeof item.startDate === "string")
            )) {
                throw new Error("Lo storico degli acquisti non è valido.");
            }
            return items.map((item) => ({ ...item, startDate: item.startDate || "" }));
        }

        function persistTrips() {
            window.localStorage.setItem(savedTripsKey + loggedInUser.email.toLowerCase(), JSON.stringify(savedTrips));
        }

        function todayDateValue() {
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            return `${today.getFullYear()}-${month}-${day}`;
        }

        function formatTripDate(dateValue) {
            if (!dateValue) return "Data di partenza non specificata";
            const [year, month, day] = dateValue.split("-").map(Number);
            return new Date(year, month - 1, day).toLocaleDateString("it-IT");
        }

        function renderPurchases() {
            purchasesList.replaceChildren();
            purchasesEmpty.hidden = purchases.length > 0;
            clearHistoryButton.hidden = purchases.length === 0;
            purchases.forEach((purchase) => {
                const item = document.createElement("article");
                const destination = destinations[purchase.citySlug];
                const date = new Date(purchase.purchasedAt);
                item.className = "purchase-card";
                const heading = document.createElement("h3");
                heading.textContent = `${destination.label} · ${purchase.title}`;
                const details = document.createElement("p");
                details.textContent = `${purchase.days} giorni · ${purchase.people} ${purchase.people === 1 ? "persona" : "persone"} · Partenza: ${formatTripDate(purchase.startDate)} · Acquistato il ${date.toLocaleDateString("it-IT")}`;
                const price = document.createElement("p");
                price.textContent = `Totale stimato: ${currency.format(purchase.totalMin)}–${currency.format(purchase.totalMax)}`;
                const actions = document.createElement("div");
                actions.className = "purchase-actions";
                const repurchaseButton = document.createElement("button");
                repurchaseButton.type = "button";
                repurchaseButton.className = "login-submit";
                repurchaseButton.textContent = "Riacquista";
                const startDateLabel = document.createElement("label");
                startDateLabel.className = "purchase-date-label";
                startDateLabel.textContent = "Data di partenza per il riacquisto";
                startDateLabel.hidden = true;
                const startDateInput = document.createElement("input");
                startDateInput.type = "date";
                startDateInput.required = true;
                startDateInput.min = todayDateValue();
                startDateInput.value = "";
                startDateInput.setAttribute("aria-label", `Data di partenza per riacquistare ${destination.label}`);
                startDateLabel.append(startDateInput);
                repurchaseButton.addEventListener("click", () => {
                    if (startDateLabel.hidden) {
                        startDateLabel.hidden = false;
                        startDateInput.focus();
                        repurchaseButton.textContent = "Conferma riacquisto";
                        return;
                    }
                    if (!startDateInput.reportValidity()) return;
                    recordPurchase({
                        ...purchase,
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        startDate: startDateInput.value,
                        purchasedAt: new Date().toISOString()
                    });
                });
                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "remove-trip-button";
                removeButton.textContent = "Elimina";
                removeButton.setAttribute("aria-label", `Elimina acquisto ${destination.label}, ${purchase.days} giorni del ${date.toLocaleDateString("it-IT")}`);
                removeButton.addEventListener("click", () => removePurchase(purchase.id));
                actions.append(startDateLabel, repurchaseButton, removeButton);
                item.append(heading, details, price, actions);
                purchasesList.append(item);
            });
        }

        function renderSavedTrips() {
            savedTripsList.replaceChildren();
            savedTripsEmpty.hidden = savedTrips.length > 0;
            savedTrips.forEach((trip) => {
                const destination = destinations[trip.citySlug];
                const option = trip.options.find((item) => item.days === trip.days);
                const card = document.createElement("article");
                card.className = "saved-itinerary-card";
                const heading = document.createElement("h3");
                heading.textContent = `${destination.label} · ${trip.title}`;
                const cityLink = document.createElement("a");
                cityLink.className = "saved-itinerary-city";
                cityLink.href = destination.href;
                cityLink.textContent = "Apri la destinazione";
                card.append(heading, cityLink);

                if (!trip.options.length) {
                    const legacyNotice = document.createElement("p");
                    legacyNotice.textContent = "Questa destinazione era stata salvata senza un itinerario. Apri la città e salva una delle proposte disponibili.";
                    const removeButton = document.createElement("button");
                    removeButton.type = "button";
                    removeButton.className = "remove-trip-button";
                    removeButton.textContent = "Rimuovi";
                    removeButton.addEventListener("click", () => removeTrip(trip.id));
                    card.append(legacyNotice, removeButton);
                    savedTripsList.append(card);
                    return;
                }

                const controls = document.createElement("div");
                controls.className = "itinerary-controls";
                const daysLabel = document.createElement("label");
                daysLabel.textContent = "Durata";
                const daysSelect = document.createElement("select");
                daysSelect.setAttribute("aria-label", `Durata dell'itinerario per ${destination.label}`);
                trip.options.forEach((item) => {
                    const choice = document.createElement("option");
                    choice.value = String(item.days);
                    choice.textContent = `${item.days} giorni`;
                    choice.selected = item.days === trip.days;
                    daysSelect.append(choice);
                });
                daysLabel.append(daysSelect);

                const peopleLabel = document.createElement("label");
                peopleLabel.textContent = "Viaggiatori";
                const peopleInput = document.createElement("input");
                peopleInput.type = "number";
                peopleInput.min = "1";
                peopleInput.max = "12";
                peopleInput.step = "1";
                peopleInput.value = String(trip.people);
                peopleInput.setAttribute("aria-label", `Numero di viaggiatori per ${destination.label}`);
                peopleLabel.append(peopleInput);
                const startDateLabel = document.createElement("label");
                startDateLabel.textContent = "Data di partenza";
                const startDateInput = document.createElement("input");
                startDateInput.type = "date";
                startDateInput.required = true;
                startDateInput.min = todayDateValue();
                startDateInput.value = trip.startDate;
                startDateInput.setAttribute("aria-label", `Data di partenza per ${destination.label}`);
                startDateLabel.append(startDateInput);
                controls.append(daysLabel, peopleLabel, startDateLabel);

                const activities = document.createElement("ul");
                activities.className = "saved-itinerary-days";
                option.activities.forEach((activity) => {
                    const activityItem = document.createElement("li");
                    activityItem.textContent = activity;
                    activities.append(activityItem);
                });

                const price = document.createElement("p");
                price.className = "saved-itinerary-price";
                const buyButton = document.createElement("button");
                buyButton.type = "button";
                buyButton.className = "login-submit";
                buyButton.textContent = "Registra acquisto";
                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "remove-trip-button";
                removeButton.textContent = "Rimuovi itinerario";
                const actions = document.createElement("div");
                actions.className = "saved-itinerary-actions";
                actions.append(buyButton, removeButton);
                card.append(controls, activities, price, actions);

                function updatePrice() {
                    const activeOption = trip.options.find((item) => item.days === trip.days);
                    const min = activeOption.costMin * trip.people;
                    const max = activeOption.costMax * trip.people;
                    price.textContent = `Stima totale: ${currency.format(min)}–${currency.format(max)} per ${trip.people} ${trip.people === 1 ? "persona" : "persone"}`;
                    buyButton.disabled = !trip.startDate || trip.startDate < startDateInput.min;
                    buyButton.onclick = () => {
                        if (!startDateInput.reportValidity()) return;
                        addPurchase(trip, activeOption, min, max);
                    };
                }

                daysSelect.addEventListener("change", () => {
                    const activeOption = trip.options.find((item) => item.days === Number(daysSelect.value));
                    trip.days = activeOption.days;
                    trip.title = activeOption.title;
                    try {
                        persistTrips();
                        renderSavedTrips();
                    } catch (error) {
                        console.error("Impossibile aggiornare la durata dell'itinerario.", error);
                        managerMessage.textContent = "Non è stato possibile salvare la nuova durata.";
                    }
                });
                peopleInput.addEventListener("input", () => {
                    const people = Number(peopleInput.value);
                    if (Number.isInteger(people) && people >= 1 && people <= 12) {
                        trip.people = people;
                        managerMessage.textContent = "";
                        updatePrice();
                    }
                });
                peopleInput.addEventListener("change", () => {
                    if (!Number.isInteger(Number(peopleInput.value)) || Number(peopleInput.value) < 1 || Number(peopleInput.value) > 12) {
                        peopleInput.value = String(trip.people);
                        managerMessage.textContent = "Scegli da 1 a 12 viaggiatori.";
                        return;
                    }
                    try {
                        persistTrips();
                    } catch (error) {
                        console.error("Impossibile aggiornare il numero di viaggiatori.", error);
                        managerMessage.textContent = "Non è stato possibile salvare il numero di viaggiatori.";
                    }
                });
                startDateInput.addEventListener("change", () => {
                    trip.startDate = startDateInput.value;
                    try {
                        persistTrips();
                        managerMessage.textContent = trip.startDate
                            ? `Data di partenza aggiornata: ${formatTripDate(trip.startDate)}.`
                            : "Scegli una data di partenza per poter registrare l'acquisto.";
                        updatePrice();
                    } catch (error) {
                        console.error("Impossibile aggiornare la data di partenza.", error);
                        managerMessage.textContent = "Non è stato possibile salvare la data di partenza.";
                    }
                });
                removeButton.addEventListener("click", () => removeTrip(trip.id));
                updatePrice();
                savedTripsList.append(card);
            });
        }

        function removeTrip(id) {
            const updatedTrips = savedTrips.filter((trip) => trip.id !== id);
            try {
                window.localStorage.setItem(savedTripsKey + loggedInUser.email.toLowerCase(), JSON.stringify(updatedTrips));
                savedTrips = updatedTrips;
                managerMessage.textContent = "Itinerario rimosso.";
                renderSavedTrips();
            } catch (error) {
                console.error("Impossibile rimuovere l'itinerario.", error);
                managerMessage.textContent = "Non è stato possibile rimuovere l'itinerario.";
            }
        }

        function recordPurchase(purchase, savedTripId = null) {
            try {
                const updatedPurchases = [purchase, ...purchases];
                window.localStorage.setItem(purchasesKey + loggedInUser.email.toLowerCase(), JSON.stringify(updatedPurchases));
                purchases = updatedPurchases;
                renderPurchases();
            } catch (error) {
                console.error("Impossibile registrare l'acquisto.", error);
                managerMessage.textContent = "Non è stato possibile registrare l'acquisto nel browser.";
                return;
            }

            const warnings = [];
            if (savedTripId !== null) {
                try {
                    const updatedTrips = savedTrips.filter((trip) => trip.id !== savedTripId);
                    window.localStorage.setItem(savedTripsKey + loggedInUser.email.toLowerCase(), JSON.stringify(updatedTrips));
                    savedTrips = updatedTrips;
                    renderSavedTrips();
                } catch (error) {
                    console.error("Acquisto registrato, ma impossibile rimuovere l'itinerario salvato.", error);
                    warnings.push("non è stato possibile rimuovere l'itinerario dagli itinerari salvati");
                }
            }

            try {
                const country = destinations[purchase.citySlug].country;
                markVisitedCountry(loggedInUser.email, country);
                renderVisitedCountries(loggedInUser.email);
            } catch (error) {
                console.error("Acquisto registrato, ma impossibile aggiornare i Paesi visitati.", error);
                warnings.push("non è stato possibile aggiornare i Paesi visitati");
            }

            managerMessage.textContent = warnings.length
                ? `Acquisto registrato, ma ${warnings.join(" e ")}.`
                : savedTripId !== null
                    ? "Acquisto registrato e itinerario rimosso dagli itinerari salvati."
                    : "Acquisto registrato nello storico.";
        }

        function addPurchase(trip, option, min, max) {
            recordPurchase({
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                citySlug: trip.citySlug,
                title: option.title,
                days: trip.days,
                people: trip.people,
                startDate: trip.startDate,
                totalMin: min,
                totalMax: max,
                purchasedAt: new Date().toISOString()
            }, trip.id);
        }

        function removePurchase(id) {
            const updatedPurchases = purchases.filter((purchase) => purchase.id !== id);
            try {
                window.localStorage.setItem(purchasesKey + loggedInUser.email.toLowerCase(), JSON.stringify(updatedPurchases));
                purchases = updatedPurchases;
                managerMessage.textContent = "Acquisto rimosso dallo storico.";
                renderPurchases();
            } catch (error) {
                console.error("Impossibile rimuovere l'acquisto dallo storico.", error);
                managerMessage.textContent = "Non è stato possibile rimuovere l'acquisto.";
            }
        }

        clearHistoryButton.addEventListener("click", () => {
            try {
                window.localStorage.setItem(purchasesKey + loggedInUser.email.toLowerCase(), JSON.stringify([]));
                purchases = [];
                managerMessage.textContent = "Storico degli acquisti eliminato.";
                renderPurchases();
            } catch (error) {
                console.error("Impossibile eliminare lo storico degli acquisti.", error);
                managerMessage.textContent = "Non è stato possibile eliminare lo storico.";
            }
        });

        function renderProfile() {
            const loggedIn = loggedInUser !== null;
            loginForm.hidden = loggedIn;
            profileSession.hidden = !loggedIn;
            manager.hidden = !loggedIn;
            loginPrompt.hidden = loggedIn;
            document.getElementById("profile-title").textContent = loggedIn ? "Il tuo profilo" : "Accedi al profilo";
            profileButton.querySelector("span").textContent = loggedIn ? loggedInUser.name : "Accedi";
            if (!loggedIn) {
                savedTripsList.replaceChildren();
                purchasesList.replaceChildren();
                savedTripsEmpty.hidden = false;
                purchasesEmpty.hidden = false;
                return;
            }
            document.getElementById("profile-name").textContent = `Ciao, ${loggedInUser.name}!`;
            try {
                renderVisitedCountries(loggedInUser.email);
            } catch (error) {
                console.error("Impossibile mostrare i Paesi visitati.", error);
                loginMessage.textContent = "Non è stato possibile mostrare l'elenco dei Paesi visitati.";
            }
            try {
                savedTrips = readSavedTrips(loggedInUser.email);
                purchases = readPurchases(loggedInUser.email);
                renderSavedTrips();
                renderPurchases();
            } catch (error) {
                console.error("Impossibile caricare itinerari o acquisti.", error);
                managerMessage.textContent = "Non è stato possibile caricare i tuoi itinerari o lo storico.";
            }
        }

        loggedInUser = loadProfile();
        renderProfile();
        profileButton.addEventListener("click", () => {
            renderProfile();
            profileDialog.showModal();
        });
        document.getElementById("trips-login-button").addEventListener("click", () => profileButton.click());
        document.querySelector(".profile-trips-link").addEventListener("click", () => profileDialog.close());
        document.getElementById("close-profile").addEventListener("click", () => profileDialog.close());
        document.getElementById("confirm-profile").addEventListener("click", () => profileDialog.close());
        profileDialog.addEventListener("click", (event) => {
            if (event.target === profileDialog) profileDialog.close();
        });
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const submission = getDemoLoginSubmission(loginForm, event);
            if (!submission) return;
            const { user, isRegistering } = submission;
            const email = user.email;
            try {
                const trips = readSavedTrips(email);
                const userPurchases = readPurchases(email);
                window.localStorage.setItem(savedTripsKey + email.toLowerCase(), JSON.stringify(trips));
                window.localStorage.setItem(profileStorageKey, JSON.stringify(user));
                loggedInUser = user;
                savedTrips = trips;
                purchases = userPurchases;
                document.getElementById("login-password").value = "";
                loginMessage.textContent = isRegistering
                    ? "Registrazione completata."
                    : "Accesso effettuato.";
                managerMessage.textContent = "";
                renderProfile();
            } catch (error) {
                console.error("Impossibile accedere o caricare i viaggi.", error);
                loginMessage.textContent = "Non è stato possibile accedere o caricare i tuoi viaggi.";
            }
        });
        document.getElementById("logout-button").addEventListener("click", () => {
            loggedInUser = null;
            savedTrips = [];
            purchases = [];
            loginForm.reset();
            loginMessage.textContent = "";
            try {
                window.localStorage.removeItem(profileStorageKey);
            } catch (error) {
                console.error("Impossibile rimuovere il profilo salvato.", error);
                loginMessage.textContent = "Non è stato possibile rimuovere il profilo salvato dal browser.";
            }
            renderProfile();
        });
        document.getElementById("trips-year").textContent = new Date().getFullYear();
    }

    function initHomePage() {
        const carousel = document.getElementById("countries-container");
        const prevButton = document.getElementById("prev-card");
        const nextButton = document.getElementById("next-card");
        const capitalsCarousel = document.getElementById("capitals-container");
        const prevCapitalButton = document.getElementById("prev-capital");
        const nextCapitalButton = document.getElementById("next-capital");
        const searchInput = document.getElementById("destination-search");
        const carouselTargets = {
            "countries-container": carousel,
            "capitals-container": capitalsCarousel
        };

        function updateCarouselButtons(container, previous, next) {
            const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
            previous.disabled = container.scrollLeft <= 1;
            next.disabled = maxScroll - container.scrollLeft <= 2;
        }

        function scrollCarousel(container, previous, next, direction) {
            updateCarouselButtons(container, previous, next);
            if ((direction < 0 && previous.disabled) || (direction > 0 && next.disabled)) {
                return;
            }

            const card = container.querySelector(".continente-card:not([hidden])");
            if (!card) return;

            const gap = parseFloat(getComputedStyle(container).columnGap);
            container.scrollBy({
                left: direction * (card.getBoundingClientRect().width + gap),
                behavior: "smooth"
            });
        }

        function refreshCarousels() {
            updateCarouselButtons(carousel, prevButton, nextButton);
            updateCarouselButtons(capitalsCarousel, prevCapitalButton, nextCapitalButton);
        }

        function centerReturnedCard() {
            const params = new URLSearchParams(window.location.search);
            const targetCarousel = carouselTargets[params.get("returnCarousel")];
            const savedCardIndex = params.get("returnCard");
            const cardIndex = Number(savedCardIndex);
            if (!targetCarousel || savedCardIndex === null || !Number.isInteger(cardIndex) || cardIndex < 0) return;

            const cards = targetCarousel.querySelectorAll(".continente-card:not([hidden])");
            if (cardIndex === 0 || cardIndex >= cards.length) return;

            const card = cards[cardIndex === cards.length - 1 ? cardIndex - 1 : cardIndex];
            card.style.scrollSnapAlign = "center";
            targetCarousel.style.scrollSnapType = "x proximity";

            window.requestAnimationFrame(() => {
                const cardRect = card.getBoundingClientRect();
                const carouselRect = targetCarousel.getBoundingClientRect();
                const cardCenter = cardRect.left - carouselRect.left + targetCarousel.scrollLeft + cardRect.width / 2;
                const centeredScroll = cardCenter - targetCarousel.clientWidth / 2;
                targetCarousel.scrollTo({
                    left: Math.max(0, Math.min(centeredScroll, targetCarousel.scrollWidth - targetCarousel.clientWidth)),
                    behavior: "smooth"
                });
                refreshCarousels();
            });
        }

        prevButton.addEventListener("click", () => scrollCarousel(carousel, prevButton, nextButton, -1));
        nextButton.addEventListener("click", () => scrollCarousel(carousel, prevButton, nextButton, 1));
        prevCapitalButton.addEventListener("click", () => scrollCarousel(capitalsCarousel, prevCapitalButton, nextCapitalButton, -1));
        nextCapitalButton.addEventListener("click", () => scrollCarousel(capitalsCarousel, prevCapitalButton, nextCapitalButton, 1));
        [carousel, capitalsCarousel].forEach((container) => {
            container.addEventListener("scroll", refreshCarousels);
            container.addEventListener("scrollend", refreshCarousels);
        });
        window.addEventListener("resize", refreshCarousels);
        window.addEventListener("storage", (event) => {
            if (event.key === profileStorageKey) {
                loggedInUser = loadLoggedInUser();
                renderProfile();
            }
        });
        refreshCarousels();
        document.getElementById("current-year").textContent = new Date().getFullYear();

        searchInput.addEventListener("keydown", (event) => {
            const query = searchInput.value.trim().toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (event.key !== "Enter") return;

            const countryCard = [...carousel.querySelectorAll(".country-card")].find((card) =>
                card.querySelector("h2").textContent.trim().toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === query
            );
            if (countryCard) {
                window.location.href = countryCard.href;
            } else if (query === "roma" || query === "rome") {
                window.location.href = "destinazioni/roma.html";
            } else if (query === "parigi" || query === "paris") {
                window.location.href = "destinazioni/parigi.html";
            }
        });

        const profileButton = document.getElementById("profile-button");
        const profileDialog = document.getElementById("profile-dialog");
        const loginForm = document.getElementById("login-form");
        const profileSession = document.getElementById("profile-session");
        const loginMessage = document.getElementById("login-message");
        const profileName = document.getElementById("profile-name");
        const profileStorageKey = "travelExplorerProfile";

        function loadLoggedInUser() {
            try {
                const savedProfile = window.localStorage.getItem(profileStorageKey);
                if (!savedProfile) return null;

                const user = JSON.parse(savedProfile);
                if (typeof user.name !== "string" || typeof user.email !== "string") {
                    throw new Error("Il profilo salvato non contiene i dati richiesti.");
                }
                return user;
            } catch (error) {
                console.error("Impossibile leggere il profilo salvato.", error);
                loginMessage.textContent = "Non è stato possibile recuperare il profilo salvato.";
                return null;
            }
        }

        let loggedInUser = loadLoggedInUser();

        function getDisplayName(email) {
            const nameFromEmail = email.split("@")[0]
                .split("+")[0]
                .replace(/[._-]+/g, " ")
                .trim();

            if (!nameFromEmail) return "Viaggiatore";

            return nameFromEmail.split(/\s+/)
                .map((part) => part.charAt(0).toLocaleUpperCase("it") + part.slice(1))
                .join(" ");
        }

        function renderProfile() {
            const loggedIn = loggedInUser !== null;
            loginForm.hidden = loggedIn;
            profileSession.hidden = !loggedIn;
            document.getElementById("profile-title").textContent = loggedIn ? "Il tuo profilo" : "Accedi al profilo";
            profileButton.querySelector("span").textContent = loggedIn ? loggedInUser.name : "Accedi";
            if (loggedIn) {
                profileName.textContent = `Ciao, ${loggedInUser.name}!`;
                try {
                    renderVisitedCountries(loggedInUser.email);
                } catch (error) {
                    console.error("Impossibile mostrare i Paesi visitati.", error);
                    loginMessage.textContent = "Non è stato possibile mostrare l'elenco dei Paesi visitati.";
                }
            }
        }

        renderProfile();

        profileButton.addEventListener("click", () => {
            renderProfile();
            profileDialog.showModal();
        });

        document.getElementById("footer-profile").addEventListener("click", () => profileButton.click());

        document.getElementById("close-profile").addEventListener("click", () => profileDialog.close());
        document.getElementById("confirm-profile").addEventListener("click", () => profileDialog.close());

        profileDialog.addEventListener("click", (event) => {
            if (event.target === profileDialog) profileDialog.close();
        });

        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const submission = getDemoLoginSubmission(loginForm, event);
            if (!submission) return;
            const { user, isRegistering } = submission;
            loggedInUser = user;
            document.getElementById("login-password").value = "";
            renderProfile();
            loginMessage.textContent = isRegistering ? "Registrazione completata." : "Accesso effettuato.";

            try {
                window.localStorage.setItem(profileStorageKey, JSON.stringify(loggedInUser));
            } catch (error) {
                console.error("Impossibile mantenere il profilo tra le pagine.", error);
                loginMessage.textContent = "Accesso effettuato, ma non è stato possibile mantenere il profilo tra le pagine.";
            }
        });

        document.getElementById("logout-button").addEventListener("click", () => {
            loggedInUser = null;
            loginForm.reset();
            renderProfile();
            try {
                window.localStorage.removeItem(profileStorageKey);
            } catch (error) {
                console.error("Impossibile rimuovere il profilo salvato.", error);
                loginMessage.textContent = "Non è stato possibile rimuovere il profilo salvato dal browser.";
            }
        });

        function scrollToNavigation(targetId) {
            const body = document.body;
            if (body.classList.contains("adventure-transitioning")) return;
            if (targetId) {
                body.classList.remove("intro-locked", "adventure-transitioning");
                body.classList.add("adventure-complete");
                document.getElementById("destinations-nav").removeAttribute("inert");
                document.getElementById("destinazioni").removeAttribute("inert");
                document.getElementById(targetId).scrollIntoView({ behavior: "smooth" });
                centerReturnedCard();
                return;
            }
            if (body.classList.contains("adventure-complete")) {
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }

            const hero = document.getElementById("inizio");
            const targetTop = hero.offsetTop + hero.offsetHeight;
            let completionTimer;
            const finishTransition = () => {
                window.clearTimeout(completionTimer);
                window.removeEventListener("scrollend", finishTransition);
                body.classList.remove("adventure-transitioning");
                body.classList.add("adventure-complete");
            };

            document.body.classList.remove("intro-locked");
            body.classList.add("adventure-transitioning");
            document.getElementById("destinations-nav").removeAttribute("inert");
            document.getElementById("destinazioni").removeAttribute("inert");
            window.addEventListener("scrollend", finishTransition, { once: true });
            completionTimer = window.setTimeout(finishTransition, 2000);
            window.scrollTo({
                top: targetTop,
                behavior: "smooth"
            });
        }

        document.getElementById("start-adventure").addEventListener("click", () => scrollToNavigation());

        document.getElementById("back-to-nav").addEventListener("click", (event) => {
            event.preventDefault();
            scrollToNavigation();
        });

        if (window.location.hash === "#destinations-nav" || window.location.hash === "#destinazioni" || window.location.hash === "#capitali") {
            scrollToNavigation(window.location.hash.slice(1));
        }

        if (window.location.hash === "#login") {
            profileDialog.showModal();
        }
    }

    initPasswordVisibility();

    if (document.body.classList.contains("trips-page")) {
        initTripsPage();
    } else if (document.body.classList.contains("city-page")) {
        initCityPage();
    } else {
        initHomePage();
    }
})();
