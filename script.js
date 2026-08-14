// ======================================================
// PLANTAS
// ======================================================
const plants = [
    {
        id: 1,
        name: "Jiboia",
        icon: "🌿",
        humidity: 60,
        status: "Ideal",
        color: "green",
        time: "2 horas atrás"
    },
    {
        id: 2,
        name: "Samambaia",
        icon: "🌿",
        humidity: 70,
        status: "Ideal",
        color: "green",
        time: "há 5 min"
    },
    {
        id: 3,
        name: "Suculenta",
        icon: "🪴",
        humidity: 45,
        status: "Atenção",
        color: "orange",
        time: "há 8 min"
    },
    {
        id: 4,
        name: "Cacto",
        icon: "🌵",
        humidity: 30,
        status: "Precisa de água",
        color: "red",
        time: "há 3 min"
    }
];

// ======================================================
// HISTÓRICO
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
// CONVERTE DATA/HORA PARA SÃO PAULO
// ======================================================
function formatarDataBrasil(isoString) {
    if (!isoString) {
        return "Sem data";
    }

    const data = new Date(isoString);

    if (isNaN(data.getTime())) {
        return "Data inválida";
    }

    return data.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// ======================================================
// BUSCAR HISTÓRICO DO SUPABASE (Apenas as 5 últimas)
// ======================================================
async function fetchHistoryFromSupabase() {
    try {
        console.log("[Supabase] Buscando histórico...");

        // Adicionado &limit=5 no final da URL para buscar apenas as 5 últimas do banco
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

        // ERRO HTTP
        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            console.error("[Supabase] Erro:", erroTexto);
            history = [];
            render();
            return;
        }

        // CONVERTE RESPOSTA
        const dados = await resposta.json();
        console.log("[Supabase] Dados recebidos:", dados);

        // SE NÃO EXISTIR REGISTRO
        if (!Array.isArray(dados) || dados.length === 0) {
            history = [];
            render();
            return;
        }

        // MONTA HISTÓRICO (Limitado aos 5 primeiros)
        history = dados
            .map(item => {
                // Tenta pegar o campo da data (com ou sem acento / created_at)
                const dataBruta = item["horarios"] || item["horários"] || item["created_at"];
                
                // Pega a mensagem do ESP32 ou coloca um padrão
                const textoMensagem = item.mensagem || item.comando || "Comando registrado";

                return {
                    plant: "PlantCare",
                    icon: "💧",
                    time: formatarDataBrasil(dataBruta),
                    value: textoMensagem
                };
            })
            .slice(0, 5); // Garante no máximo 5 registros

        // ATUALIZA SITE
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

    // COLOCA HISTÓRICO NAS DUAS ÁREAS
    const homeHistory = document.getElementById("homeHistory");
    if (homeHistory) {
        homeHistory.innerHTML = hist;
    }

    const fullHistory = document.getElementById("fullHistory");
    if (fullHistory) {
        fullHistory.innerHTML = hist;
    }

    // SELECT DE PLANTAS
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
// ATUALIZA PLANTA PRINCIPAL
// ======================================================
function updateMain() {
    const p = plants[0];
    const pct = p.humidity;

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
// NAVEGAÇÃO
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

// ======================================================
// CLIQUE NAVEGAÇÃO
// ======================================================
document.addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (b) {
        navigate(b.dataset.page);
    }
});

// ======================================================
// SELECIONAR PLANTA
// ======================================================
function selectPlant(id) {
    const p = plants.find(x => x.id === id);
    if (!p) return;

    plants[0] = { ...p };

    updateMain();
    navigate("home");
    toast("🌱 " + p.name + " selecionada");
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

        console.log("[Supabase] HTTP:", resposta.status);

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

// ======================================================
// BOTÃO REGAR
// ======================================================
const waterBtn = document.getElementById("waterBtn");
if (waterBtn) {
    waterBtn.onclick = waterNow;
}

// ======================================================
// CONFIGURAR HORÁRIO
// ======================================================
const scheduleBtn = document.getElementById("scheduleBtn");
if (scheduleBtn) {
    scheduleBtn.onclick = () => {
        document.getElementById("modalTitle").textContent = "Configurar irrigação";
        document.getElementById("modalBg").classList.add("show");
    };
}

// ======================================================
// FECHAR MODAL
// ======================================================
const closeModal = document.getElementById("closeModal");
if (closeModal) {
    closeModal.onclick = () => {
        document.getElementById("modalBg").classList.remove("show");
    };
}

// ======================================================
// SALVAR MODAL
// ======================================================
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
// TOGGLES
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

// ======================================================
// INTERVALO DO SENSOR
// ======================================================
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
// Busca histórico imediatamente
fetchHistoryFromSupabase();
// Atualiza histórico a cada 10 segundos
setInterval(fetchHistoryFromSupabase, 10000);
