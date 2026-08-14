```javascript
const plants = [
    {
        id: 1,
        name: "Jiboia",
        icon: "🌿",
        humidity: 60,
        status: "Ideal",
        color: "green",
        time: "Sem registro"
    },
    {
        id: 2,
        name: "Samambaia",
        icon: "🌿",
        humidity: 70,
        status: "Ideal",
        color: "green",
        time: "Sem registro"
    },
    {
        id: 3,
        name: "Suculenta",
        icon: "🪴",
        humidity: 45,
        status: "Atenção",
        color: "orange",
        time: "Sem registro"
    },
    {
        id: 4,
        name: "Cacto",
        icon: "🌵",
        humidity: 30,
        status: "Precisa de água",
        color: "red",
        time: "Sem registro"
    }
];

// ======================================================
// HISTÓRICO
// ======================================================

let history = [];

let activePage = "home";
let toastTimer;

// ======================================================
// CONFIGURAÇÃO DO SUPABASE
// ======================================================

const supabaseUrl =
    "https://lbwhdmbsudonlquchtow.supabase.co";

const supabaseKey =
    "sb_publishable_DRKSWNIHKCFcjURyxQz4Og_Q-4WQuqR";

// ======================================================
// CONVERTE HORÁRIO DO SUPABASE PARA SÃO PAULO
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
        minute: "2-digit"
    });
}

// ======================================================
// BUSCA O HISTÓRICO NO SUPABASE
// ======================================================

async function fetchHistoryFromSupabase() {

    try {

        const resposta = await fetch(
            `${supabaseUrl}/rest/v1/comandos?select=*&order=horários.desc&limit=5`,
            {
                method: "GET",

                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`
                }
            }
        );

        if (!resposta.ok) {

            console.error(
                "Erro ao carregar histórico:",
                resposta.status,
                await resposta.text()
            );

            return;
        }

        const dados = await resposta.json();

        console.log("Dados recebidos do Supabase:", dados);

        // ==================================================
        // PEGA SOMENTE AS 5 ÚLTIMAS IRRIGAÇÕES
        // ==================================================

        const irrigacoes = dados.filter(item =>
            item.mensagem &&
            (
                item.mensagem.toUpperCase().includes("REGAR") ||
                item.mensagem.toUpperCase().includes("REGADO")
            )
        );

        // ==================================================
        // MONTA O HISTÓRICO DO SITE
        // ==================================================

        history = irrigacoes.slice(0, 5).map(item => ({

            plant: "Jiboia",

            icon: "💧",

            time: formatarDataBrasil(item["horários"]),

            value: item.mensagem

        }));

        // ==================================================
        // ATUALIZA A ÚLTIMA IRRIGAÇÃO DA JIBOIA
        // ==================================================

        if (irrigacoes.length > 0) {

            const ultima = irrigacoes[0];

            plants[0].time =
                formatarDataBrasil(ultima["horários"]);

        } else {

            plants[0].time = "Sem registro";
        }

        // ==================================================
        // ATUALIZA A INTERFACE
        // ==================================================

        render();

    } catch (erro) {

        console.error(
            "Erro de conexão com o Supabase:",
            erro
        );
    }
}

// ======================================================
// TOAST
// ======================================================

function toast(msg) {

    const el =
        document.getElementById("toast");

    if (!el) return;

    el.textContent = msg;

    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        () => el.classList.remove("show"),
        2500
    );
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

                <strong>
                    ${p.name}
                </strong>

                <p>
                    Sensor conectado
                </p>

            </div>

        </div>

        <div class="percent">
            ${p.humidity}%
        </div>

        <div class="bar">

            <span
                class="${p.color}"
                style="width:${p.humidity}%">
            </span>

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
// RENDERIZA A INTERFACE
// ======================================================

function render() {

    // ==================================================
    // PLANTAS NA HOME
    // ==================================================

    document.getElementById("homePlants").innerHTML =
        plants
            .slice(0, 3)
            .map(card)
            .join("");

    // ==================================================
    // LISTA DE PLANTAS
    // ==================================================

    document.getElementById("plantsList").innerHTML =
        plants.map(p => `

        <div class="plant-item">

            <div class="rowleft">

                <div class="thumb">
                    ${p.icon}
                </div>

                <div>

                    <strong>
                        ${p.name}
                    </strong>

                    <p class="muted">
                        ${p.humidity}% de umidade · ${p.status}
                    </p>

                </div>

            </div>

            <button
                onclick="selectPlant(${p.id})">
                Detalhes
            </button>

        </div>

        `).join("");

    // ==================================================
    // HISTÓRICO
    // ==================================================

    const hist =
        history.length > 0

            ? history.map(h => `

                <div class="row">

                    <div class="rowleft">

                        <div class="ico">
                            ${h.icon}
                        </div>

                        <div>

                            <strong>
                                ${h.plant}
                            </strong>

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

              `).join("")

            : `
                <p
                    class="muted"
                    style="padding: 10px;">
                    Carregando histórico do Supabase...
                </p>
              `;

    // ==================================================
    // HISTÓRICO DA HOME
    // ==================================================

    document.getElementById(
        "homeHistory"
    ).innerHTML = hist;

    // ==================================================
    // HISTÓRICO COMPLETO
    // ==================================================

    document.getElementById(
        "fullHistory"
    ).innerHTML = hist;

    // ==================================================
    // SELECT DE PLANTAS
    // ==================================================

    document.getElementById(
        "plantSelect"
    ).innerHTML =
        plants.map(p =>
            `<option>${p.name}</option>`
        ).join("");

    // ==================================================
    // ATUALIZA PLANTA PRINCIPAL
    // ==================================================

    updateMain();
}

// ======================================================
// ATUALIZA A PLANTA PRINCIPAL
// ======================================================

function updateMain() {

    const p = plants[0];

    const pct = p.humidity;

    // ==================================================
    // UMIDADE
    // ==================================================

    document.getElementById(
        "mainHumidity"
    ).textContent = pct + "%";

    // ==================================================
    // ANEL DE UMIDADE
    // ==================================================

    document.getElementById(
        "mainRing"
    ).style.background =
        `conic-gradient(
            var(--g) 0 ${pct}%,
            #d5dfd0 ${pct}% 100%
        )`;

    // ==================================================
    // STATUS
    // ==================================================

    document.getElementById(
        "mainStatus"
    ).textContent =

        pct < 40
            ? "Sua planta precisa de água."
            : pct < 50
            ? "A umidade está ficando baixa."
            : "Sua planta está em boas condições.";

    // ==================================================
    // ÚLTIMA IRRIGAÇÃO
    // ==================================================

    const ultimaRega =
        document.getElementById("lastWater");

    if (ultimaRega) {

        ultimaRega.textContent =
            p.time;

    }
}

// ======================================================
// NAVEGAÇÃO
// ======================================================

function navigate(page) {

    activePage = page;

    document.querySelectorAll(".page").forEach(x =>
        x.classList.toggle(
            "active",
            x.id === page
        )
    );

    document.querySelectorAll("[data-page]").forEach(x =>
        x.classList.toggle(
            "active",
            x.dataset.page === page
        )
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ======================================================
// CLIQUE NA NAVEGAÇÃO
// ======================================================

document.addEventListener("click", e => {

    const b =
        e.target.closest("[data-page]");

    if (b) {

        navigate(
            b.dataset.page
        );

    }
});

// ======================================================
// SELECIONAR PLANTA
// ======================================================

function selectPlant(id) {

    const p =
        plants.find(x => x.id === id);

    if (!p) return;

    plants[0] = {
        ...p
    };

    updateMain();

    navigate("home");

    toast(
        "🌱 " + p.name + " selecionada"
    );
}

// ======================================================
// REGAR AGORA
// ======================================================

async function waterNow() {

    try {

        const resposta =
            await fetch(
                `${supabaseUrl}/rest/v1/comandos`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            supabaseKey,

                        "Authorization":
                            `Bearer ${supabaseKey}`,

                        "Prefer":
                            "return=minimal"
                    },

                    body: JSON.stringify({
                        mensagem: "REGAR"
                    })
                }
            );

        if (resposta.ok) {

            toast(
                "💧 Comando de rega enviado!"
            );

            // ==================================================
            // AGUARDA O ESP32 PROCESSAR E DEPOIS ATUALIZA
            // ==================================================

            setTimeout(
                fetchHistoryFromSupabase,
                2000
            );

        } else {

            console.log(
                "Erro Supabase:",
                resposta.status,
                await resposta.text()
            );

            toast(
                "❌ Erro ao enviar comando."
            );
        }

    } catch (erro) {

        console.log(
            "Erro:",
            erro
        );

        toast(
            "❌ Não foi possível conectar ao servidor."
        );
    }
}

// ======================================================
// BOTÃO REGAR AGORA
// ======================================================

const waterButton =
    document.getElementById("waterBtn");

if (waterButton) {

    waterButton.onclick =
        waterNow;
}

// ======================================================
// CONFIGURAR HORÁRIO
// ======================================================

const scheduleButton =
    document.getElementById("scheduleBtn");

if (scheduleButton) {

    scheduleButton.onclick = () => {

        document.getElementById(
            "modalTitle"
        ).textContent =
            "Configurar irrigação";

        document.getElementById(
            "modalBg"
        ).classList.add("show");

    };
}

// ======================================================
// FECHAR MODAL
// ======================================================

const closeModal =
    document.getElementById("closeModal");

if (closeModal) {

    closeModal.onclick = () => {

        document.getElementById(
            "modalBg"
        ).classList.remove("show");

    };
}

// ======================================================
// SALVAR CONFIGURAÇÃO DO MODAL
// ======================================================

const saveModal =
    document.getElementById("saveModal");

if (saveModal) {

    saveModal.onclick = () => {

        const time =
            document.getElementById(
                "scheduleTime"
            ).value;

        const min =
            document.getElementById(
                "minHumidity"
            ).value;

        document.getElementById(
            "modalBg"
        ).classList.remove("show");

        toast(
            "🗓️ Agendado para " +
            time +
            " quando chegar a " +
            min +
            " de umidade."
        );
    };
}

// ======================================================
// ADICIONAR PLANTA
// ======================================================

const addPlant =
    document.getElementById("addPlant");

if (addPlant) {

    addPlant.onclick = () => {

        const name =
            prompt(
                "Nome da nova planta:"
            );

        if (
            name &&
            name.trim()
        ) {

            plants.push({

                id: Date.now(),

                name:
                    name.trim(),

                icon:
                    "🌱",

                humidity:
                    50,

                status:
                    "Atenção",

                color:
                    "orange",

                time:
                    "Sem registro"

            });

            render();

            toast(
                "🌱 " +
                name +
                " adicionada!"
            );
        }
    };
}

// ======================================================
// TOGGLES
// ======================================================

document
    .querySelectorAll(".toggle")
    .forEach(t => {

        t.onclick = () => {

            t.classList.toggle("on");

            toast(

                t.dataset.toggle === "auto"

                    ? (
                        t.classList.contains("on")

                            ? "🤖 Irrigação automática ativada"

                            : "Irrigação automática desativada"
                      )

                    : (
                        t.classList.contains("on")

                            ? "🔔 Notificações ativadas"

                            : "🔕 Notificações desativadas"
                      )

            );

        };

    });

// ======================================================
// INTERVALO DO SENSOR
// ======================================================

const sensorInterval =
    document.getElementById(
        "sensorInterval"
    );

if (sensorInterval) {

    sensorInterval.onclick = () => {

        toast(
            "⏱️ Intervalos disponíveis: 1, 5, 10 ou 15 minutos."
        );

    };
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

render();

fetchHistoryFromSupabase();

// ======================================================
// ATUALIZA HISTÓRICO AUTOMATICAMENTE
// A CADA 10 SEGUNDOS
// ======================================================

setInterval(
    fetchHistoryFromSupabase,
    10000
);
```
