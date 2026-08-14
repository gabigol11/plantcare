```javascript
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

// Histórico
let history = [];

let activePage = "home";
let toastTimer;

// ======================================================
// CONFIGURAÇÃO DO SUPABASE
// ======================================================

const supabaseUrl = "https://lbwhdmbsudonlquchtow.supabase.co";
const supabaseKey = "sb_publishable_DRKSWNIHKCFcjURyxQz4Og_Q-4WQuqR";

// ======================================================
// CONVERTE HORÁRIO DO SUPABASE PARA HORÁRIO DE SÃO PAULO
// ======================================================

function formatarDataBrasil(isoString) {

    if (!isoString) {
        return "Sem data";
    }

    const data = new Date(isoString);

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
                resposta.status
            );

            return;
        }

        const dados = await resposta.json();

        // ==================================================
        // PEGA SOMENTE AS 5 ÚLTIMAS IRRIGAÇÕES
        // ==================================================

        history = dados
            .filter(item =>
                item.mensagem &&
                item.mensagem.toUpperCase().includes("REG")
            )
            .slice(0, 5)
            .map(item => ({

                plant: "PlantCare ESP32",

                icon: "💧",

                time: formatarDataBrasil(
                    item["horários"]
                ),

                value: item.mensagem
            }));

        // ==================================================
        // PEGA A ÚLTIMA REGA
        // ==================================================

        if (dados.length > 0) {

            const ultimaRega = dados.find(item =>
                item.mensagem &&
                item.mensagem.toUpperCase().includes("REG")
            );

            if (ultimaRega && ultimaRega["horários"]) {

                const horarioFormatado =
                    formatarDataBrasil(
                        ultimaRega["horários"]
                    );

                const elemento =
                    document.getElementById("lastWater");

                if (elemento) {

                    elemento.textContent =
                        horarioFormatado;
                }
            }
        }

        // Atualiza o site
        render();

    } catch (erro) {

        console.error(
            "Erro de conexão com Supabase:",
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
// RENDER
// ======================================================

function render() {

    document.getElementById("homePlants").innerHTML =
        plants
            .slice(0, 3)
            .map(card)
            .join("");


    document.getElementById("plantsList").innerHTML =
        plants
            .map(p => `
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
            `)
            .join("");


    // ==================================================
    // HISTÓRICO
    // ==================================================

    const hist =
        history.length > 0

            ? history
                .slice(0, 5)
                .map(h => `
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
                `)
                .join("")

            : `
                <p
                    class="muted"
                    style="padding: 10px;">
                    Carregando histórico do Supabase...
                </p>
            `;


    document.getElementById("homeHistory").innerHTML =
        hist;

    document.getElementById("fullHistory").innerHTML =
        hist;


    // ==================================================
    // SELECT DE PLANTAS
    // ==================================================

    document.getElementById("plantSelect").innerHTML =
        plants
            .map(p =>
                `<option>${p.name}</option>`
            )
            .join("");


    updateMain();
}

// ======================================================
// ATUALIZA PLANTA PRINCIPAL
// ======================================================

function updateMain() {

    const p = plants[0];

    const pct =
        p.humidity;

    document.getElementById(
        "mainHumidity"
    ).textContent =
        pct + "%";


    document.getElementById(
        "mainRing"
    ).style.background =
        `conic-gradient(
            var(--g) 0 ${pct}%,
            #d5dfd0 ${pct}% 100%
        )`;


    document.getElementById(
        "mainStatus"
    ).textContent =

        pct < 40
            ? "Sua planta precisa de água."
            : pct < 50
            ? "A umidade está ficando baixa."
            : "Sua planta está em boas condições.";
}

// ======================================================
// NAVEGAÇÃO
// ======================================================

function navigate(page) {

    activePage = page;

    document
        .querySelectorAll(".page")
        .forEach(x =>
            x.classList.toggle(
                "active",
                x.id === page
            )
        );


    document
        .querySelectorAll("[data-page]")
        .forEach(x =>
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
// CLIQUE DE NAVEGAÇÃO
// ======================================================

document.addEventListener(
    "click",
    e => {

        const b =
            e.target.closest("[data-page]");

        if (b) {
            navigate(b.dataset.page);
        }
    }
);


// ======================================================
// SELECIONAR PLANTA
// ======================================================

function selectPlant(id) {

    const p =
        plants.find(x => x.id === id);

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

                    body:
                        JSON.stringify({
                            mensagem: "REGAR"
                        })
                }
            );


        if (resposta.ok) {

            toast(
                "💧 Comando de rega enviado!"
            );


            // Atualiza o histórico
            // depois que o ESP32 processar
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
// BOTÃO REGAR
// ======================================================

document.getElementById(
    "waterBtn"
).onclick =
    waterNow;


// ======================================================
// BOTÃO CONFIGURAR HORÁRIO
// ======================================================

document.getElementById(
    "scheduleBtn"
).onclick = () => {

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Configurar irrigação";

    document.getElementById(
        "modalBg"
    ).classList.add("show");
};


// ======================================================
// FECHAR MODAL
// ======================================================

document.getElementById(
    "closeModal"
).onclick = () => {

    document.getElementById(
        "modalBg"
    ).classList.remove("show");
};


// ======================================================
// SALVAR MODAL
// ======================================================

document.getElementById(
    "saveModal"
).onclick = () => {

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


// ======================================================
// ADICIONAR PLANTA
// ======================================================

document.getElementById(
    "addPlant"
).onclick = () => {

    const name =
        prompt(
            "Nome da nova planta:"
        );


    if (name && name.trim()) {

        plants.push({

            id:
                Date.now(),

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
                "agora"
        });


        render();


        toast(
            "🌱 " +
            name +
            " adicionada!"
        );
    }
};


// ======================================================
// TOGGLES
// ======================================================

document
    .querySelectorAll(".toggle")
    .forEach(t =>

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
        }
    );


// ======================================================
// INTERVALO DO SENSOR
// ======================================================

document.getElementById(
    "sensorInterval"
).onclick = () => {

    toast(
        "⏱️ Intervalos disponíveis: 1, 5, 10 ou 15 minutos."
    );
};


// ======================================================
// INICIALIZAÇÃO
// ======================================================

render();

fetchHistoryFromSupabase();


// ======================================================
// ATUALIZA HISTÓRICO AUTOMATICAMENTE
// ======================================================

setInterval(
    fetchHistoryFromSupabase,
    10000
);
```
