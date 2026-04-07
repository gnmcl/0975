document.addEventListener("DOMContentLoaded", () => {
    const SUPABASE_URL = "https://pmstsocezwmxffcumjib.supabase.co";
    const SUPABASE_KEY = "sb_publishable_7QT6Pvv5JE_gggzRWNjMpg_9mAR8Z74";
    const PROFILE_STORAGE_KEY = "profile0975";
    const USER_ID_STORAGE_KEY = "userId0975";

    const homeScreen = document.getElementById("homeScreen");
    const simShell = document.getElementById("simShell");
    const contactsShell = document.getElementById("contactsShell");
    const app0975 = document.getElementById("app0975");
    const appContacts = document.getElementById("appContacts");
    const app0975Badge = document.getElementById("app0975Badge");
    const backBtn = document.getElementById("backBtn");
    const contactsBackBtn = document.getElementById("contactsBackBtn");
    const clock = document.getElementById("clock");
    const clockHome = document.getElementById("clockHome");
    const clockContacts = document.getElementById("clockContacts");
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
    const profileOverlay = document.getElementById("profileOverlay");
    const nameInput = document.getElementById("nameInput");
    const consentCheckbox = document.getElementById("consentCheckbox");
    const profileError = document.getElementById("profileError");
    const profileSaveBtn = document.getElementById("profileSaveBtn");
    const profileCancelBtn = document.getElementById("profileCancelBtn");

    let selectedAmount = null;
    let isConnecting = false;
    let spoilerUnlocked = false;
    let spoilerExpanded = false;
    let stepTimer = null;
    let flashStartTimer = null;
    let flashFadeTimer = null;
    let flashResetTimer = null;
    let pendingConnection = false;

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
        if (clockContacts) {
            clockContacts.textContent = `${hours}:${minutes}`;
        }
    };

    const getStoredProfile = () => {
        try {
            const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (!saved) return null;
            const parsed = JSON.parse(saved);
            if (!parsed?.name || !parsed?.consentAcceptedAt) return null;
            return parsed;
        } catch {
            return null;
        }
    };

    const saveProfile = (profile) => {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    };

    const toggleProfileOverlay = (isVisible) => {
        profileOverlay.classList.toggle("hidden", !isVisible);
        profileOverlay.setAttribute("aria-hidden", String(!isVisible));
        if (isVisible) {
            requestAnimationFrame(() => nameInput?.focus());
        }
    };

    const openProfileOverlay = () => {
        const profile = getStoredProfile();
        nameInput.value = profile?.name ?? "";
        consentCheckbox.checked = Boolean(profile?.consentAcceptedAt);
        profileError.textContent = "";
        toggleProfileOverlay(true);
    };

    const closeProfileOverlay = () => {
        pendingConnection = false;
        profileError.textContent = "";
        toggleProfileOverlay(false);
    };

    const normalizeProfileName = (name) => {
        return name.trim().replace(/\s+/g, " ");
    };

    const getOrCreateUserId = () => {
        let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
        if (userId) return userId;

        userId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `uid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        localStorage.setItem(USER_ID_STORAGE_KEY, userId);
        return userId;
    };

    const formatHumanTimestamp = (date) => {
        return new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date);
    };

    const buildTrackingPayload = (profileName) => {
        const now = new Date();
        return {
            timestamp: formatHumanTimestamp(now),
            user_id: getOrCreateUserId(),
            name: normalizeProfileName(profileName),
            amount: selectedAmount,
            tier: lineProfiles[selectedAmount]?.tier ?? "LINEA NOTTE",
        };
    };

    const hasExistingRecharge = async (profileName) => {
        const userId = getOrCreateUserId();
        const endpoint = `${SUPABASE_URL}/rest/v1/recharge_events?select=user_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Lookup Supabase fallita (${response.status})`);
        }

        const rows = await response.json();
        return Array.isArray(rows) && rows.length > 0;
    };

    const trackEvent = async (payload) => {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/recharge_events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({
                    user_id: payload.user_id,
                    name: payload.name,
                    amount: payload.amount,
                    tier: payload.tier,
                    created_at: new Date().toISOString(),
                }),
            });
        } catch (error) {
            console.error("Errore Supabase:", error);
        }
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
        homeScreen.classList.add("hidden");
        simShell.classList.add("hidden");
        contactsShell.classList.add("hidden");

        if (appName === "0975") {
            if (app0975Badge) {
                app0975.setAttribute("aria-label", "0975 Events");
                app0975.classList.add("badge-cleared");
            }
            simShell.classList.remove("hidden");
            return;
        }

        if (appName === "contacts") {
            contactsShell.classList.remove("hidden");
        }
    };

    app0975.addEventListener("click", () => openApp("0975"));
    appContacts.addEventListener("click", () => openApp("contacts"));

    const goHome = () => {
        simShell.classList.add("hidden");
        contactsShell.classList.add("hidden");
        homeScreen.classList.remove("hidden");
    };

    backBtn.addEventListener("click", goHome);
    contactsBackBtn.addEventListener("click", goHome);

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
        statusMessage.textContent = `${profile.message}`;
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

    const completeProfileAndConnect = async () => {
        const typedName = normalizeProfileName(nameInput.value);
        if (typedName.length < 2) {
            profileError.textContent = "Inserisci un nome valido (almeno 2 caratteri).";
            return;
        }

        if (!consentCheckbox.checked) {
            profileError.textContent = "Per continuare devi accettare il consenso.";
            return;
        }

        try {
            const alreadyRecharged = await hasExistingRecharge();
            if (alreadyRecharged) {
                profileError.textContent = "Hai gia effettuato una ricarica con questo dispositivo.";
                return;
            }
        } catch (error) {
            profileError.textContent = "Errore verifica ricarica. Riprova tra poco.";
            console.error(error);
            return;
        }

        const profile = {
            name: typedName,
            consentAcceptedAt: new Date().toISOString(),
        };
        saveProfile(profile);
        toggleProfileOverlay(false);

        const payload = buildTrackingPayload(typedName);
        trackEvent(payload);

        if (pendingConnection) {
            pendingConnection = false;
            startConnection();
        }
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

    connectBtn.addEventListener("click", async () => {
        if (!selectedAmount || isConnecting) return;
        if (connectBtn.classList.contains("is-connected")) return;

        const profile = getStoredProfile();
        if (!profile) {
            pendingConnection = true;
            openProfileOverlay();
            return;
        }

        try {
            const alreadyRecharged = await hasExistingRecharge();
            if (alreadyRecharged) {
                statusMessage.textContent = "Ricarica gia registrata per questo dispositivo.";
                meterFill.style.width = "100%";
                connectBtn.disabled = true;
                connectBtn.textContent = "RICARICA GIA EFFETTUATA";
                return;
            }
        } catch (error) {
            statusMessage.textContent = "Errore verifica ricarica. Riprova.";
            console.error(error);
            return;
        }

        const payload = buildTrackingPayload(profile.name);
        trackEvent(payload);
        startConnection();
    });

    profileSaveBtn.addEventListener("click", completeProfileAndConnect);
    profileCancelBtn.addEventListener("click", closeProfileOverlay);

    profileOverlay.addEventListener("click", (event) => {
        if (event.target === profileOverlay) {
            closeProfileOverlay();
        }
    });

    nameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            completeProfileAndConnect();
        }
    });

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
