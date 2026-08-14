// ======================================================
// PLANTAS
// ======================================================
const plants = [
    {
        id: 1,
        name: "Jiboia",
        icon: "🌿",
        img: "img/jiboia.png",
        humidity: 60,
        status: "Ideal",
        color: "green",
        time: "2 horas atrás"
    },
    {
        id: 2,
        name: "Samambaia",
        icon: "🌿",
        img: "img/samambaia.png",
        humidity: 70,
        status: "Ideal",
        color: "green",
        time: "há 5 min"
    },
    {
        id: 3,
        name: "Suculenta",
        icon: "🪴",
        img: "img/suculenta.png",
        humidity: 45,
        status: "Atenção",
        color: "orange",
        time: "há 8 min"
    },
    {
        id: 4,
        name: "Cacto",
        icon: "🌵",
        img: "img/cacto.png",
        humidity: 30,
        status: "Precisa de água",
        color: "red",
        time: "há 3 min"
    }
];

// Índice da planta selecionada atualmente na tela principal
let currentPlantIndex = 0;

// ======================================================
// HISTÓRICO E NAVEGAÇÃO
// ======================================================
let history = [];
let activePage = "home";
let toastTimer;

// ======================================================
// SUPABASE
// ======================================================
const supabaseUrl = "https://lbwhdmbsudonlquchtow.supabase.co";
const supabaseKey = "sb_publishable_DRKSWNIHKCFcjURyxQz4Og_Q-4WQuqR";

// ======================================================
// CONVERTE DATA/HORA PARA FORMATO AMIGÁVEL (Hoje, Ontem, etc)
// ======================================================
function formatarDataBrasil(isoString) {
    if (!isoString) {
        return "Sem data";
    }

    const data = new Date(isoString);

    if (isNaN(data.getTime())) {
        return "Data inválida";
    }

    const agora = new Date();

    const horaFormatada = data.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
    });

    const dData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const dAgora = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    const diffDias = Math.round((dAgora - dData) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
        return `Hoje, às ${horaFormatada}`;
    } else if (diffDias === 1) {
        return `Ontem, às ${horaFormatada}`;
    } else {
        const diaMes = data.toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit"
        });
        return `${diaMes}, às ${horaFormatada}`;
    }
}

// ======================================================
// BUSCAR HISTÓRICO DO SUPABASE
// ======================================================
async function fetchHistoryFromSupabase() {
    try {
        console.log("[Supabase] Buscando histórico...");

        const resposta = await fetch(
            `${supabaseUrl}/rest/v1/comandos?select=*&order=horarios.desc&limit=5`,
            {
                method: "GET",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`
                }
            }
        );

        console.log("[Supabase] HTTP:", resposta.status);

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            console.error("[Supabase] Erro:", erroTexto);
            history = [];
            render();
            return;
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados) || dados.length === 0) {
            history = [];
            render();
            return;
        }

        // 1. MONTA HISTÓRICO
        history = dados
            .map(item => {
                const dataBruta = item["horarios"] || item["horários"] || item["created_at"];
                const textoMensagem = item.mensagem || item.comando || "Comando registrado";

                return {
                    plant: "PlantCare",
                    icon: "💧",
                    time: formatarDataBrasil(dataBruta),
                    value: textoMensagem
                };
            })
            .slice(0, 5);

        // 2. ATUALIZA A ÚLTIMA IRRIGACÃO DA PLANTA ATUAL
        if (history.length > 0) {
            const ultimaRega = history[0].time; 
            plants[currentPlantIndex].time = ultimaRega;

            const lastWaterEl = document.getElementById("lastWater");
            if (lastWaterEl) {
                lastWaterEl.textContent = ultimaRega;
            }
        }

        render();

    } catch (erro) {
        console.error("[Supabase] Erro de conexão:", erro);
        history = [];
        render();
    }
}

// ======================================================
// TOAST
// ======================================================
function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;

    el.textContent = msg;
    el.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

// ======================================================
// CARD DA PLANTA
// ======================================================
function card(p) {
    let statusClass =
        p.color === "green"
            ? "ok"
            : p.color === "orange"
            ? "warn"
            : "crit";

    return `
    <article class="card" onclick="selectPlant(${p.id})">
        <div class="cardtop">
            <div class="thumb">
                ${p.icon}
            </div>
            <div>
                <strong>${p.name}</strong>
                <p>Sensor conectado</p>
            </div>
        </div>

        <div class="percent">
            ${p.humidity}%
        </div>

        <div class="bar">
            <span class="${p.color}" style="width:${p.humidity}%"></span>
        </div>

        <div class="bottom">
            <span class="${statusClass}">
                ● ${p.status}
            </span>
            <span>
                ${p.time}
            </span>
        </div>
    </article>
    `;
}

// ======================================================
// RENDER
// ======================================================
function render() {
    // PLANTAS HOME
    const homePlants = document.getElementById("homePlants");
    if (homePlants) {
        homePlants.innerHTML = plants
            .slice(0, 3)
            .map(card)
            .join("");
    }

    // LISTA DE PLANTAS
    const plantsList = document.getElementById("plantsList");
    if (plantsList) {
        plantsList.innerHTML = plants
            .map(p => `
            <div class="plant-item">
                <div class="rowleft">
                    <div class="thumb">
                        ${p.icon}
                    </div>
                    <div>
                        <strong>${p.name}</strong>
                        <p class="muted">
                            ${p.humidity}% de umidade · ${p.status}
                        </p>
                    </div>
                </div>

                <button onclick="selectPlant(${p.id})">
                    Detalhes
                </button>
            </div>
            `)
            .join("");
    }

    // HISTÓRICO
    let hist;
    if (history.length > 0) {
        hist = history
            .map(h => `
            <div class="row">
                <div class="rowleft">
                    <div class="ico">
                        ${h.icon}
                    </div>
                    <div>
                        <strong>${h.plant}</strong>
                        <br>
                        <small class="muted">
                            ${h.time}
                        </small>
                    </div>
                </div>

                <span class="value">
                    ${h.value}
                </span>
            </div>
            `)
            .join("");
    } else {
        hist = `
            <p class="muted" style="padding:10px;">
                Nenhum registro de irrigação encontrado.
            </p>
        `;
    }

    const homeHistory = document.getElementById("homeHistory");
    if (homeHistory) {
        homeHistory.innerHTML = hist;
    }

    const fullHistory = document.getElementById("fullHistory");
    if (fullHistory) {
        fullHistory.innerHTML = hist;
    }

    // SELECT DE PLANTAS NO MODAL
    const plantSelect = document.getElementById("plantSelect");
    if (plantSelect) {
        plantSelect.innerHTML = plants
            .map(p => `<option>${p.name}</option>`)
            .join("");
    }

    // ATUALIZA PLANTA PRINCIPAL
    updateMain();
}

// ======================================================
// ATUALIZA PLANTA PRINCIPAL (HERO)
// ======================================================
function updateMain() {
    const p = plants[currentPlantIndex];
    if (!p) return;

    const pct = p.humidity;

    // Imagem da planta
    const mainPlantImg = document.getElementById("mainPlantImg");
    if (mainPlantImg && p.img) {
        mainPlantImg.src = p.img;
        mainPlantImg.alt = p.name;
    }

    const mainPlantName = document.getElementById("mainPlantName");
    if (mainPlantName) {
        mainPlantName.textContent = p.name;
    }

    const lastWater = document.getElementById("lastWater");
    if (lastWater) {
        lastWater.textContent = p.time;
    }

    const mainHumidity = document.getElementById("mainHumidity");
    if (mainHumidity) {
        mainHumidity.textContent = pct + "%";
    }

    const mainRing = document.getElementById("mainRing");
    if (mainRing) {
        mainRing.style.background = `conic-gradient(var(--g) 0 ${pct}%, #d5dfd0 ${pct}% 100%)`;
    }

    const mainStatus = document.getElementById("mainStatus");
    if (mainStatus) {
        mainStatus.textContent =
            pct < 40
                ? "Sua planta precisa de água."
                : pct < 50
                ? "A umidade está ficando baixa."
                : "Sua planta está em boas condições.";
    }
}

// ======================================================
// NAVEGAÇÃO POR SETAS NO HERO CARD
// ======================================================
const prevBtn = document.getElementById("prevPlantBtn");
if (prevBtn) {
    prevBtn.onclick = () => {
        currentPlantIndex--;
        if (currentPlantIndex < 0) {
            currentPlantIndex = plants.length - 1;
        }
        updateMain();
    };
}

const nextBtn = document.getElementById("nextPlantBtn");
if (nextBtn) {
    nextBtn.onclick = () => {
        currentPlantIndex++;
        if (currentPlantIndex >= plants.length) {
            currentPlantIndex = 0;
        }
        updateMain();
    };
}

// ======================================================
// NAVEGAÇÃO DE PÁGINAS
// ======================================================
function navigate(page) {
    activePage = page;

    document.querySelectorAll(".page").forEach(x =>
        x.classList.toggle("active", x.id === page)
    );

    document.querySelectorAll("[data-page]").forEach(x =>
        x.classList.toggle("active", x.dataset.page === page)
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (b) {
        navigate(b.dataset.page);
    }
});

// ======================================================
// SELECIONAR PLANTA POR ID
// ======================================================
function selectPlant(id) {
    const idx = plants.findIndex(x => x.id === id);
    if (idx === -1) return;

    currentPlantIndex = idx;

    updateMain();
    navigate("home");
    toast("🌱 " + plants[idx].name + " selecionada");
}

// ======================================================
// REGAR AGORA
// ======================================================
async function waterNow() {
    try {
        console.log("[Supabase] Enviando REGAR...");

        const resposta = await fetch(`${supabaseUrl}/rest/v1/comandos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                mensagem: "REGAR"
            })
        });

        if (resposta.ok) {
            toast("💧 Comando de rega enviado!");
            setTimeout(fetchHistoryFromSupabase, 2000);
        } else {
            const erro = await resposta.text();
            console.error("[Supabase] Erro:", erro);
            toast("❌ Erro ao enviar comando.");
        }
    } catch (erro) {
        console.error("[Supabase] Erro:", erro);
        toast("❌ Não foi possível conectar ao Supabase.");
    }
}

const waterBtn = document.getElementById("waterBtn");
if (waterBtn) {
    waterBtn.onclick = waterNow;
}

// ======================================================
// CONFIGURAR HORÁRIO / MODAL
// ======================================================
const scheduleBtn = document.getElementById("scheduleBtn");
if (scheduleBtn) {
    scheduleBtn.onclick = () => {
        document.getElementById("modalTitle").textContent = "Configurar irrigação";
        document.getElementById("modalBg").classList.add("show");
    };
}

const closeModal = document.getElementById("closeModal");
if (closeModal) {
    closeModal.onclick = () => {
        document.getElementById("modalBg").classList.remove("show");
    };
}

const saveModal = document.getElementById("saveModal");
if (saveModal) {
    saveModal.onclick = () => {
        const time = document.getElementById("scheduleTime").value;
        const min = document.getElementById("minHumidity").value;

        document.getElementById("modalBg").classList.remove("show");
        toast("🗓️ Agendado para " + time + " quando chegar a " + min + "% de umidade.");
    };
}

// ======================================================
// ADICIONAR PLANTA
// ======================================================
const addPlant = document.getElementById("addPlant");
if (addPlant) {
    addPlant.onclick = () => {
        const name = prompt("Nome da nova planta:");

        if (name && name.trim()) {
            plants.push({
                id: Date.now(),
                name: name.trim(),
                icon: "🌱",
                img: "img/jiboia.png", // Imagem padrão
                humidity: 50,
                status: "Atenção",
                color: "orange",
                time: "agora"
            });

            render();
            toast("🌱 " + name + " adicionada!");
        }
    };
}

// ======================================================
// TOGGLES & CONFIGURAÇÕES
// ======================================================
document.querySelectorAll(".toggle").forEach(t => {
    t.onclick = () => {
        t.classList.toggle("on");

        toast(
            t.dataset.toggle === "auto"
                ? (t.classList.contains("on")
                    ? "🤖 Irrigação automática ativada"
                    : "Irrigação automática desativada")
                : (t.classList.contains("on")
                    ? "🔔 Notificações ativadas"
                    : "🔕 Notificações desativadas")
        );
    };
});

const sensorInterval = document.getElementById("sensorInterval");
if (sensorInterval) {
    sensorInterval.onclick = () => {
        toast("⏱️ Intervalos disponíveis: 1, 5, 10 ou 15 minutos.");
    };
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================
render();
fetchHistoryFromSupabase();
setInterval(fetchHistoryFromSupabase, 10000);
