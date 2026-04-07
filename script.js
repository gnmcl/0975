document.addEventListener("DOMContentLoaded", () => {
    const homeScreen = document.getElementById("homeScreen");
    const simShell = document.getElementById("simShell");
    const app0975 = document.getElementById("app0975");
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

    let selectedAmount = null;
    let isConnecting = false;
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

    const openApp = (appName) => {
        if (appName === "0975") {
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
    };

    const setSelectedState = () => {
        const profile = lineProfiles[selectedAmount];
        statusMessage.textContent = `${profile.message} Taglio ${selectedAmount}€ · ${profile.tier}.`;
        meterFill.style.width = `${Math.min(85, 25 + selectedAmount)}%`;
        connectBtn.disabled = false;
        connectBtn.textContent = "ENTRA IN LINEA";
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

            // Keep the top cards fully visible when the active balance card is injected.
            shell.scrollTo({ top: 0, behavior: "smooth" });
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
    setIdleState();
});
