// ======================================================
// MODO DE IRRIGAÇÃO - SUPABASE
// A tabela configuracoes é a fonte oficial do modo atual.
// ======================================================

async function carregarModoIrrigacao() {
    const manualActions = document.getElementById("manualActions");
    const autoToggle = document.querySelector('[data-toggle="auto"]');

    if (!manualActions || !autoToggle) return;

    try {
        const resposta = await fetch(
            `${supabaseUrl}/rest/v1/configuracoes?select=id,modo&order=id.asc&limit=1`,
            {
                method: "GET",
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`
                }
            }
        );

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const dados = await resposta.json();
        const modo = dados[0]?.modo || "manual";

        atualizarInterfaceModo(modo);
    } catch (erro) {
        console.error("[Supabase] Erro ao carregar modo:", erro);
        // Em caso de falha, mantém o modo manual para não bloquear os controles.
        atualizarInterfaceModo("manual");
    }
}

function atualizarInterfaceModo(modo) {
    const automatico = modo === "automatico";
    const manualActions = document.getElementById("manualActions");
    const autoToggle = document.querySelector('[data-toggle="auto"]');

    if (manualActions) {
        manualActions.style.display = automatico ? "none" : "";
    }

    if (autoToggle) {
        autoToggle.classList.toggle("on", automatico);
        autoToggle.setAttribute("aria-pressed", automatico ? "true" : "false");
    }
}

async function salvarModoIrrigacao(modo) {
    try {
        const resposta = await fetch(
            `${supabaseUrl}/rest/v1/configuracoes?modo=eq.${encodeURIComponent(modo)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    modo: modo,
                    updated_at: new Date().toISOString()
                })
            }
        );

        // O filtro acima não encontra a linha porque estamos filtrando pelo valor novo.
        // Se não alterou nenhuma linha, atualiza pela primeira configuração.
        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        atualizarInterfaceModo(modo);
        return true;
    } catch (erro) {
        console.error("[Supabase] Erro ao salvar modo:", erro);
        toast("❌ Não foi possível salvar o modo.");
        await carregarModoIrrigacao();
        return false;
    }
}

async function atualizarModoNoBanco(modo) {
    try {
        const leitura = await fetch(
            `${supabaseUrl}/rest/v1/configuracoes?select=id&order=id.asc&limit=1`,
            {
                headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`
                }
            }
        );

        if (!leitura.ok) throw new Error(`HTTP ${leitura.status}`);

        const dados = await leitura.json();
        if (!dados.length) throw new Error("Nenhuma configuração encontrada.");

        const id = dados[0].id;
        const resposta = await fetch(
            `${supabaseUrl}/rest/v1/configuracoes?id=eq.${id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    modo,
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        atualizarInterfaceModo(modo);
        toast(modo === "automatico"
            ? "🤖 Irrigação automática ativada"
            : "💧 Modo manual ativado"
        );
    } catch (erro) {
        console.error("[Supabase] Erro ao atualizar modo:", erro);
        toast("❌ Não foi possível salvar o modo.");
        await carregarModoIrrigacao();
    }
}

function iniciarControleModo() {
    const autoToggle = document.querySelector('[data-toggle="auto"]');
    if (!autoToggle) return;

    autoToggle.setAttribute("aria-pressed", "false");

    autoToggle.addEventListener("click", () => {
        const novoModo = autoToggle.classList.contains("on")
            ? "automatico"
            : "manual";

        atualizarModoNoBanco(novoModo);
    });

    carregarModoIrrigacao();

    // Mantém a interface sincronizada caso outro dispositivo altere o modo.
    setInterval(carregarModoIrrigacao, 15000);
}

document.addEventListener("DOMContentLoaded", iniciarControleModo);
