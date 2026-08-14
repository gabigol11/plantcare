const plants=[
    {
        id:1,
        name:"Jiboia",
        icon:"🌿",
        humidity:60,
        status:"Ideal",
        color:"green",
        time:"2 horas atrás"
    },
    {
        id:2,
        name:"Samambaia",
        icon:"🌿",
        humidity:70,
        status:"Ideal",
        color:"green",
        time:"há 5 min"
    },
    {
        id:3,
        name:"Suculenta",
        icon:"🪴",
        humidity:45,
        status:"Atenção",
        color:"orange",
        time:"há 8 min"
    },
    {
        id:4,
        name:"Cacto",
        icon:"🌵",
        humidity:30,
        status:"Precisa de água",
        color:"red",
        time:"há 3 min"
    }
];

let history=[
    {
        plant:"Jiboia",
        icon:"🌿",
        time:"Hoje, 08:42",
        value:"+18%"
    },
    {
        plant:"Samambaia",
        icon:"🌿",
        time:"Ontem, 19:10",
        value:"+22%"
    },
    {
        plant:"Suculenta",
        icon:"🪴",
        time:"Ontem, 09:25",
        value:"+12%"
    }
];

let activePage="home";
let toastTimer;

function toast(msg){

    const el=document.getElementById("toast");

    el.textContent=msg;

    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer=setTimeout(
        ()=>el.classList.remove("show"),
        2500
    );
}

function card(p){

    let statusClass=
        p.color==="green"
        ?"ok"
        :p.color==="orange"
        ?"warn"
        :"crit";

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
            <span
                class="${p.color}"
                style="width:${p.humidity}%">
            </span>
        </div>

        <div class="bottom">

            <span class="${statusClass}">
                ● ${p.status}
            </span>

            <span>${p.time}</span>

        </div>

    </article>
    `;
}

function render(){

    document.getElementById("homePlants").innerHTML=
        plants.slice(0,3).map(card).join("");

    document.getElementById("plantsList").innerHTML=
        plants.map(p=>`

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

        `).join("");

    const hist=
        history.map(h=>`

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

        `).join("");

    document.getElementById("homeHistory").innerHTML=hist;

    document.getElementById("fullHistory").innerHTML=hist;

    document.getElementById("plantSelect").innerHTML=
        plants.map(p=>
            `<option>${p.name}</option>`
        ).join("");

    updateMain();
}

function updateMain(){

    const p=plants[0];

    const pct=p.humidity;

    document.getElementById("mainHumidity")
        .textContent=pct+"%";

    document.getElementById("mainRing")
        .style.background=
        `conic-gradient(
            var(--g) 0 ${pct}%,
            #d5dfd0 ${pct}% 100%
        )`;

    document.getElementById("mainStatus")
        .textContent=
        pct<40
        ?"Sua planta precisa de água."
        :pct<50
        ?"A umidade está ficando baixa."
        :"Sua planta está em boas condições.";
}

function navigate(page){

    activePage=page;

    document
        .querySelectorAll(".page")
        .forEach(x=>
            x.classList.toggle(
                "active",
                x.id===page
            )
        );

    document
        .querySelectorAll("[data-page]")
        .forEach(x=>
            x.classList.toggle(
                "active",
                x.dataset.page===page
            )
        );

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}

document.addEventListener(
    "click",
    e=>{

        const b=
            e.target.closest("[data-page]");

        if(b)
            navigate(b.dataset.page);
    }
);

function selectPlant(id){

    const p=
        plants.find(x=>x.id===id);

    plants[0]={...p};

    updateMain();

    navigate("home");

    toast(
        "🌱 "+p.name+" selecionada"
    );
}

async function waterNow(){

    try {

        const resposta = await fetch(
            "https://lbwhdmbsudonlquchtow.supabase.co/rest/v1/comandos",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "apikey": "sb_publishable_DRKSWNIHKCFcjURyxQz4Og_Q-4WQuqR",
                    "Authorization": "Bearer sb_publishable_DRKSWNIHKCFcjURyxQz4Og_Q-4WQuqR",
                    "Prefer": "return=minimal"
                },

                body: JSON.stringify({
                    mensagem: "REGAR"
                })
            }
        );

        if (resposta.ok) {

            toast("💧 Comando de rega enviado!");

        } else {

            console.log(
                "Erro Supabase:",
                resposta.status,
                await resposta.text()
            );

            toast("❌ Erro ao enviar comando.");

        }

    } catch (erro) {

        console.log("Erro:", erro);

        toast("❌ Não foi possível conectar ao servidor.");

    }
}
document.getElementById(
    "waterBtn"
).onclick=waterNow;

document.getElementById(
    "scheduleBtn"
).onclick=()=>{

    document.getElementById(
        "modalTitle"
    ).textContent=
        "Configurar irrigação";

    document.getElementById(
        "modalBg"
    ).classList.add("show");
};

document.getElementById(
    "closeModal"
).onclick=()=>{

    document.getElementById(
        "modalBg"
    ).classList.remove("show");
};

document.getElementById(
    "saveModal"
).onclick=()=>{

    const time=
        document.getElementById(
            "scheduleTime"
        ).value;

    const min=
        document.getElementById(
            "minHumidity"
        ).value;

    document.getElementById(
        "modalBg"
    ).classList.remove("show");

    toast(
        "🗓️ Agendado para "+
        time+
        " quando chegar a "+
        min+
        " de umidade."
    );
};

document.getElementById(
    "addPlant"
).onclick=()=>{

    const name=
        prompt(
            "Nome da nova planta:"
        );

    if(
        name &&
        name.trim()
    ){

        plants.push({

            id:Date.now(),

            name:name.trim(),

            icon:"🌱",

            humidity:50,

            status:"Atenção",

            color:"orange",

            time:"agora"

        });

        render();

        toast(
            "🌱 "+name+
            " adicionada!"
        );
    }
};

document
    .querySelectorAll(".toggle")
    .forEach(
        t=>t.onclick=()=>{

            t.classList.toggle("on");

            toast(
                t.dataset.toggle==="auto"

                ?

                (
                    t.classList.contains("on")
                    ?
                    "🤖 Irrigação automática ativada"
                    :
                    "Irrigação automática desativada"
                )

                :

                (
                    t.classList.contains("on")
                    ?
                    "🔔 Notificações ativadas"
                    :
                    "🔕 Notificações desativadas"
                )
            );
        }
    );

document.getElementById(
    "sensorInterval"
).onclick=()=>{

    toast(
        "⏱️ Intervalos disponíveis: 1, 5, 10 ou 15 minutos."
    );
};

render();
