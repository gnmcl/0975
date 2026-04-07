document.addEventListener("DOMContentLoaded", () => {
    const homeScreen = document.getElementById("homeScreen");
    const simShell = document.getElementById("simShell");
    const app0975 = document.getElementById("app0975");
    const app0975Badge = document.getElementById("app0975Badge");
    const backBtn = document.getElementById("backBtn");
    const clock = document.getElementById("clock");
    const clockHome = document.getElementById("clockHome");
    const cards = document.querySelectorAll(".amount-card");
    const connectBtn = document.getElementById("connectBtn");
    const statusMessage = document.getElementById("statusMessage");
    const meterFill = document.getElementById("meterFill");
    const shell = document.getElementById("simShell");

    const overlay = document.getElementById("connectOverlay");
    const overlayTitle = document.getElementById("overlayTitle");
    const overlayText = document.getElementById("overlayText");
    const progressFill = document.getElementById("progressFill");
    const cancelBtn = document.getElementById("cancelBtn");
    const successFlash = document.getElementById("successFlash");
    const successMeta = document.getElementById("successMeta");
    const balanceSection = document.getElementById("balanceSection");
    const balanceAmount = document.getElementById("balanceAmount");
    const balanceTier = document.getElementById("balanceTier");
    const eventSpoiler = document.getElementById("eventSpoiler");
    const eventLock = document.getElementById("eventLock");
    const eventCopy = document.getElementById("eventCopy");
    const eventCountdown = document.getElementById("eventCountdown");
    const spoilerBtn = document.getElementById("spoilerBtn");
    const spoilerReveal = document.getElementById("spoilerReveal");

    let selectedAmount = null;
    let isConnecting = false;
    let spoilerUnlocked = false;
    let spoilerExpanded = false;
    let stepTimer = null;
    let flashStartTimer = null;
    let flashFadeTimer = null;
    let flashResetTimer = null;

    const lineProfiles = {
        5: {
            tier: "INGRESSO BASE",
            message: "Sei in linea. Profilo base attivo.",
        },
        10: {
            tier: "LINEA CORE",
            message: "Connessione stabile.",
        },
        15: {
            tier: "NIGHT BOOST",
            message: "Segnale potenziato. Priorita ingresso attiva.",
        },
        20: {
            tier: "SEGNALE FULL",
            message: "Canale ad alta intensita attivo.",
        },
        50: {
            tier: "ALL ACCESS",
            message: "Linea VIP attiva. Accesso totale confermato.",
        },
    };

    const updateClock = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        clock.textContent = `${hours}:${minutes}`;
        clockHome.textContent = `${hours}:${minutes}`;
    };

    const getDaysToApril25 = () => {
        const now = new Date();
        const eventDate = new Date(now.getFullYear(), 3, 25, 23, 59, 59);
        if (now > eventDate) {
            eventDate.setFullYear(eventDate.getFullYear() + 1);
        }
        const diff = eventDate.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const updateEventCountdown = () => {
        const daysLeft = getDaysToApril25();
        eventCountdown.textContent = `Mancano ${daysLeft} giorni al 25 Aprile`;
    };

    const unlockSpoiler = () => {
        spoilerUnlocked = true;
        spoilerExpanded = true;
        eventSpoiler.dataset.unlocked = "true";
        eventSpoiler.classList.remove("is-hint", "is-peek", "is-collapsed");
        eventSpoiler.classList.add("is-unlocked", "is-expanded");
        eventLock.textContent = "SBLOCCATO";
        eventCopy.textContent = "Ricarica completata. Sei in lista per la prossima serata.";
        spoilerBtn.textContent = "Nascondi spoiler";
        spoilerReveal.setAttribute("aria-hidden", "false");
    };

    const teaserSpoiler = () => {
        eventSpoiler.classList.remove("is-hint");
        eventSpoiler.classList.add("is-hint", "is-peek");
        eventCopy.textContent = selectedAmount
            ? `Taglio ${selectedAmount}€ selezionato. Premi ENTRA IN LINEA per sbloccare lo spoiler del 25 Aprile.`
            : "Seleziona una ricarica e connettiti per sbloccare lo spoiler del 25 Aprile.";
        setTimeout(() => {
            eventSpoiler.classList.remove("is-hint", "is-peek");
        }, 1000);
    };

    const openApp = (appName) => {
        if (appName === "0975") {
            if (app0975Badge) {
                app0975.setAttribute("aria-label", "0975 Events");
                app0975.classList.add("badge-cleared");
            }
            homeScreen.classList.add("hidden");
            simShell.classList.remove("hidden");
        }
    };

    app0975.addEventListener("click", () => openApp("0975"));

    backBtn.addEventListener("click", () => {
        simShell.classList.add("hidden");
        homeScreen.classList.remove("hidden");
    });

    const setIdleState = () => {
        statusMessage.textContent = "Seleziona una ricarica per attivare la connessione.";
        meterFill.style.width = "12%";
        connectBtn.disabled = true;
        connectBtn.textContent = "ENTRA IN LINEA";
        if (!spoilerUnlocked) {
            eventCopy.textContent = "Effettua una ricarica per partecipare alla prossima serata.";
        }
    };

    const setSelectedState = () => {
        const profile = lineProfiles[selectedAmount];
        statusMessage.textContent = `${profile.message} Taglio ${selectedAmount}€ · ${profile.tier}.`;
        meterFill.style.width = `${Math.min(85, 25 + selectedAmount)}%`;
        connectBtn.disabled = false;
        connectBtn.textContent = "ENTRA IN LINEA";
        if (!spoilerUnlocked) {
            eventCopy.textContent = `Taglio ${selectedAmount}€ pronto. Connettiti per sbloccare lo spoiler del 25 Aprile.`;
        }
    };

    const toggleOverlay = (isVisible) => {
        overlay.classList.toggle("hidden", !isVisible);
        overlay.setAttribute("aria-hidden", String(!isVisible));
    };

    const clearFlashTimers = () => {
        clearTimeout(flashStartTimer);
        clearTimeout(flashFadeTimer);
        clearTimeout(flashResetTimer);
    };

    const showSuccessFlash = () => {
        clearFlashTimers();
        const activeProfile = lineProfiles[selectedAmount] ?? { tier: "LINEA NOTTE" };
        successMeta.textContent = `TAGLIO ${selectedAmount}€ · ${activeProfile.tier}`;
        successFlash.classList.remove("hidden", "is-fading");
        successFlash.setAttribute("aria-hidden", "false");

        flashStartTimer = setTimeout(() => {
            successFlash.classList.add("is-active");
        }, 20);

        flashFadeTimer = setTimeout(() => {
            successFlash.classList.add("is-fading");
        }, 1200);

        flashResetTimer = setTimeout(() => {
            successFlash.classList.remove("is-active", "is-fading");
            successFlash.classList.add("hidden");
            successFlash.setAttribute("aria-hidden", "true");
        }, 2150);
    };

    const endConnection = () => {
        isConnecting = false;
        shell.classList.remove("is-connecting");
        progressFill.style.width = "100%";
        overlayTitle.textContent = "Accesso confermato";
        overlayText.textContent = "0975 attiva. Sei dentro la notte.";
        cancelBtn.disabled = true;

        setTimeout(() => {
            toggleOverlay(false);
            showSuccessFlash();
            cancelBtn.disabled = false;
            progressFill.style.width = "0%";
            overlayTitle.textContent = "Connessione in corso...";
            overlayText.textContent = "Ricerca segnale clubbing";

            statusMessage.textContent = "Accesso confermato. Connessione alla notte attiva.";
            meterFill.style.width = "100%";
            connectBtn.textContent = "CONNESSO";
            connectBtn.classList.add("is-connected");
            connectBtn.disabled = true;
            connectBtn.blur();
            
            const activeProfile = lineProfiles[selectedAmount];
            balanceAmount.textContent = `${selectedAmount}€`;
            balanceTier.textContent = activeProfile.tier;
            balanceSection.classList.remove("hidden");
            unlockSpoiler();

            // Keep top content fixed when the balance card is injected.
            shell.scrollTop = 0;
            requestAnimationFrame(() => {
                shell.scrollTop = 0;
            });
            setTimeout(() => {
                shell.scrollTop = 0;
            }, 120);
        }, 2000);
    };

    const startConnection = () => {
        if (!selectedAmount || isConnecting) return;

        isConnecting = true;
        shell.classList.add("is-connecting");
        connectBtn.disabled = true;
        connectBtn.textContent = "CONNESSIONE...";
        toggleOverlay(true);
        progressFill.style.width = "0%";

        const steps = [
            { title: "Connessione in corso...", text: "Aggancio linea 0975", progress: 20 },
            { title: "Handshake SIM", text: `Ricarica ${selectedAmount}€ verificata`, progress: 52 },
            { title: "Chiamata alla notte", text: "Canale trap/hip-hop sincronizzato", progress: 78 },
            { title: "Quasi dentro", text: "Accesso in finalizzazione", progress: 94 },
        ];

        let index = 0;
        const runStep = () => {
            const current = steps[index];
            overlayTitle.textContent = current.title;
            overlayText.textContent = current.text;
            progressFill.style.width = `${current.progress}%`;
            meterFill.style.width = `${current.progress}%`;

            index += 1;
            if (index < steps.length) {
                stepTimer = setTimeout(runStep, 620);
            } else {
                stepTimer = setTimeout(endConnection, 2500);
            }
        };

        runStep();
    };

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            if (isConnecting || connectBtn.classList.contains("is-connected")) return;

            cards.forEach((item) => {
                item.classList.remove("is-selected");
                item.setAttribute("aria-pressed", "false");
            });

            card.classList.add("is-selected");
            card.setAttribute("aria-pressed", "true");
            selectedAmount = Number(card.dataset.amount);
            setSelectedState();
        });
    });

    connectBtn.addEventListener("click", startConnection);

    spoilerBtn.addEventListener("click", () => {
        if (!spoilerUnlocked) {
            teaserSpoiler();
            return;
        }

        spoilerExpanded = !spoilerExpanded;
        eventSpoiler.classList.toggle("is-expanded", spoilerExpanded);
        eventSpoiler.classList.toggle("is-collapsed", !spoilerExpanded);
        spoilerBtn.textContent = spoilerExpanded ? "Nascondi spoiler" : "Mostra spoiler";
        spoilerReveal.setAttribute("aria-hidden", String(!spoilerExpanded));
    });

    cancelBtn.addEventListener("click", () => {
        if (!isConnecting) return;

        clearTimeout(stepTimer);
        clearFlashTimers();
        isConnecting = false;
        shell.classList.remove("is-connecting");
        toggleOverlay(false);
        successFlash.classList.remove("is-active", "is-fading");
        successFlash.classList.add("hidden");
        successFlash.setAttribute("aria-hidden", "true");
        overlayTitle.textContent = "Connessione in corso...";
        overlayText.textContent = "Ricerca segnale clubbing";
        progressFill.style.width = "0%";

        statusMessage.textContent = "Connessione annullata. Premi ENTRA IN LINEA per riprovare.";
        meterFill.style.width = "30%";
        connectBtn.disabled = false;
        connectBtn.textContent = "ENTRA IN LINEA";
    });

    updateClock();
    setInterval(updateClock, 1000);
    updateEventCountdown();
    setIdleState();
});
