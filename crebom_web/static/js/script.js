let produtos = [];
let carrinho = [];
let produtoSelecionado = null;
let usuarioLogado = null;

const CATEGORIAS_ORDEM = ["Sorvetes", "Picolé", "Bebidas", "Chocolates/Doces/Salgadinhos"];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();
    document.getElementById('input-qtd-modal').addEventListener('input', atualizarPreviewValor);
});

async function verificarSessao() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            usuarioLogado = await response.json();
            mostrarApp();
        } else {
            mostrarLogin();
        }
    } catch (e) { mostrarLogin(); }
}

function mostrarLogin() {
    document.getElementById('tela-login').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
}

function mostrarApp() {
    document.getElementById('tela-login').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('user-info').innerText = `👤 ${usuarioLogado.nome} (${usuarioLogado.cargo})`;
    
    if (usuarioLogado.cargo === 'admin') {
        document.getElementById('btn-admin-area').classList.remove('hidden');
    }
    
    carregarProdutos();
    renderizarCarrinho();
}

async function fazerLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const erro = document.getElementById('login-erro');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        });

        if (response.ok) {
            usuarioLogado = (await response.json()).user;
            erro.classList.add('hidden');
            mostrarApp();
        } else {
            erro.innerText = "Usuário ou senha incorretos";
            erro.classList.remove('hidden');
        }
    } catch (e) { alert("Erro de conexão"); }
}

async function fazerLogout() {
    await fetch('/api/logout', {method: 'POST'});
    location.reload();
}

// Busca produtos da API
async function carregarProdutos() {
    const response = await fetch('/api/produtos');
    produtos = await response.json();
    renderizarProdutos();
}

function filtrarProdutos() {
    const termo = document.getElementById('busca-produto').value.toLowerCase();
    renderizarProdutos(termo);
}

function renderizarProdutos(filtro = "") {
    const container = document.getElementById('categorias-container');
    container.innerHTML = '';

    // Filtrar produtos pelo nome
    const produtosFiltrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(filtro)
    );

    if (produtosFiltrados.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-10 italic">Nenhum produto encontrado.</p>';
        return;
    }

    // Agrupar produtos por categoria
    const grupos = {};
    produtosFiltrados.forEach(p => {
        const cat = p.categoria || "Outros";
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(p);
    });

    // Criar seções para cada categoria seguindo a ordem preferencial
    const catsFinal = Object.keys(grupos).sort((a, b) => {
        let idxA = CATEGORIAS_ORDEM.indexOf(a);
        let idxB = CATEGORIAS_ORDEM.indexOf(b);
        if (idxA === -1) idxA = 99;
        if (idxB === -1) idxB = 99;
        return idxA - idxB;
    });

    catsFinal.forEach(cat => {
        const section = document.createElement('div');
        section.innerHTML = `
            <h3 class="text-lg font-bold text-blue-800 mb-3 border-l-4 border-blue-600 pl-3 uppercase tracking-wider">${cat}</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- Produtos da categoria aqui -->
            </div>
        `;
        const grid = section.querySelector('div');
        
        grupos[cat].forEach(p => {
            const card = document.createElement('button');
            card.className = "bg-white p-4 rounded-xl shadow hover:shadow-md border-2 border-transparent hover:border-blue-300 transition text-center flex flex-col items-center h-full";
            card.onclick = () => abrirModalQtd(p);
            
            let icon = '📦';
            if (cat === 'Sorvetes') icon = '🍨';
            else if (cat === 'Picolé') icon = '🍦';
            else if (cat === 'Bebidas') icon = '🥤';
            else if (cat === 'Chocolates/Doces/Salgadinhos') icon = '🍫';

            card.innerHTML = `
                <div class="text-3xl mb-1">${icon}</div>
                <div class="font-bold text-gray-800 text-sm leading-tight h-10 flex items-center justify-center">${p.nome}</div>
                <div class="text-blue-500 font-bold">R$ ${p.preco.toFixed(2)}${p.tipo === 'peso' ? '/kg' : ''}</div>
            `;
            grid.appendChild(card);
        });
        
        container.appendChild(section);
    });
}

// --- GESTÃO DO CARRINHO ---

function abrirModalQtd(produto) {
    produtoSelecionado = produto;
    document.getElementById('titulo-modal-qtd').innerText = produto.nome;
    const input = document.getElementById('input-qtd-modal');
    const label = document.getElementById('label-qtd');
    
    if (produto.tipo === 'peso') {
        label.innerText = "Peso em KG (ex: 0.550)";
        input.value = "0.000";
        input.step = "0.001";
    } else {
        label.innerText = "Quantidade";
        input.value = "1";
        input.step = "1";
    }
    atualizarPreviewValor();
    document.getElementById('modal-qtd').classList.remove('hidden');
    input.focus(); input.select();
}

function atualizarPreviewValor() {
    if (!produtoSelecionado) return;
    const qtd = parseFloat(document.getElementById('input-qtd-modal').value) || 0;
    document.getElementById('preview-valor-item').innerText = `R$ ${(qtd * produtoSelecionado.preco).toFixed(2)}`;
}

function adicionarAoCarrinho() {
    const qtd = parseFloat(document.getElementById('input-qtd-modal').value);
    if (isNaN(qtd) || qtd <= 0) return alert("Valor inválido");

    carrinho.push({
        nome: produtoSelecionado.nome,
        preco_unit: produtoSelecionado.preco,
        qtd: qtd,
        tipo: produtoSelecionado.tipo,
        total: qtd * produtoSelecionado.preco
    });
    fecharModais();
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const lista = document.getElementById('lista-carrinho');
    const totalDisplay = document.getElementById('valor-total-carrinho');
    const badge = document.getElementById('total-carrinho-badge');
    
    lista.innerHTML = '';
    let total = 0;
    carrinho.forEach((item, i) => {
        total += item.total;
        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-blue-50 p-2 rounded-lg border text-sm";
        div.innerHTML = `
            <div><div class="font-bold">${item.nome}</div><div class="text-xs text-gray-500">${item.qtd}${item.tipo==='peso'?'kg':'x'}</div></div>
            <div class="flex items-center gap-2"><b>R$ ${item.total.toFixed(2)}</b><button onclick="removerCarrinho(${i})" class="text-red-500">✕</button></div>
        `;
        lista.appendChild(div);
    });
    totalDisplay.innerText = `R$ ${total.toFixed(2)}`;
    badge.innerText = `${carrinho.length} itens`;
}

function removerCarrinho(i) { carrinho.splice(i, 1); renderizarCarrinho(); }
function limparCarrinho() { carrinho = []; renderizarCarrinho(); }

function abrirPagamento() {
    if (carrinho.length === 0) return alert("Carrinho vazio");
    const total = carrinho.reduce((acc, i) => acc + i.total, 0);
    document.getElementById('total-modal').innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById('modal-pagamento').classList.remove('hidden');
}

async function confirmarVenda(metodo) {
    const total = carrinho.reduce((acc, i) => acc + i.total, 0);
    const res = await fetch('/api/vender', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({itens: carrinho, total: total, metodo: metodo})
    });
    if (res.ok) {
        carrinho = []; renderizarCarrinho(); fecharModais();
        alert("Venda realizada!");
    }
}

// --- PAINEL ADMIN ---

function abrirAdmin() {
    document.getElementById('modal-admin').classList.remove('hidden');
    setTabAdmin('usuarios');
}

function fecharModais() {
    document.querySelectorAll('.fixed.inset-0:not(#tela-login)').forEach(m => m.classList.add('hidden'));
}

async function setTabAdmin(tab) {
    const content = document.getElementById('admin-content');
    const btnUsers = document.getElementById('tab-users');
    const btnProds = document.getElementById('tab-prods');

    if (tab === 'usuarios') {
        btnUsers.className = "px-6 py-2 rounded-full font-bold bg-blue-600 text-white";
        btnProds.className = "px-6 py-2 rounded-full font-bold bg-gray-200 text-gray-600";
        content.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-xl mb-6">
                <h4 class="font-bold mb-3">Novo Funcionário</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input id="new-u-user" placeholder="Usuário" class="p-2 border rounded">
                    <input id="new-u-nome" placeholder="Nome" class="p-2 border rounded">
                    <input id="new-u-pass" type="password" placeholder="Senha" class="p-2 border rounded">
                    <button onclick="salvarUsuario()" class="bg-green-500 text-white font-bold rounded p-2">Adicionar</button>
                </div>
            </div>
            <table class="w-full text-left">
                <thead><tr class="border-b"><th>Usuário</th><th>Nome</th><th>Cargo</th><th>Ação</th></tr></thead>
                <tbody id="lista-admin-users"></tbody>
            </table>
        `;
        const res = await fetch('/api/admin/usuarios');
        const users = await res.json();
        const tbody = document.getElementById('lista-admin-users');
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = "border-b h-12";
            tr.innerHTML = `<td>${u.username}</td><td>${u.nome}</td><td>${u.cargo}</td>
                <td>${u.username !== 'admin' ? `<button onclick="deletarUsuario('${u.username}')" class="text-red-500">Excluir</button>` : '-'}</td>`;
            tbody.appendChild(tr);
        });
    } else {
        btnProds.className = "px-6 py-2 rounded-full font-bold bg-blue-600 text-white";
        btnUsers.className = "px-6 py-2 rounded-full font-bold bg-gray-200 text-gray-600";
        content.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-xl mb-6">
                <h4 class="font-bold mb-3 text-sm">Novo Produto</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <input id="new-p-nome" placeholder="Nome" class="p-2 border rounded text-sm">
                    <input id="new-p-preco" type="number" step="0.01" placeholder="Preço" class="p-2 border rounded text-sm">
                    <select id="new-p-tipo" class="p-2 border rounded text-sm">
                        <option value="qtd">Unidade</option>
                        <option value="peso">Peso (KG)</option>
                    </select>
                    <select id="new-p-cat" class="p-2 border rounded text-sm">
                        ${CATEGORIAS_ORDEM.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                    <button onclick="salvarProduto()" class="bg-green-500 text-white font-bold rounded p-2 col-span-2">Adicionar Produto</button>
                </div>
            </div>
            <table class="w-full text-left text-sm">
                <thead><tr class="border-b"><th>Produto</th><th>Preço</th><th>Categoria</th><th>Ação</th></tr></thead>
                <tbody id="lista-admin-prods"></tbody>
            </table>
        `;
        const res = await fetch('/api/produtos');
        const prods = await res.json();
        const tbody = document.getElementById('lista-admin-prods');
        prods.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = "border-b h-12";
            tr.innerHTML = `<td>${p.nome}</td><td>R$ ${p.preco.toFixed(2)}</td><td>${p.categoria}</td>
                <td><button onclick="deletarProduto('${p.id}')" class="text-red-500">Excluir</button></td>`;
            tbody.appendChild(tr);
        });
    }
}

async function salvarUsuario() {
    const username = document.getElementById('new-u-user').value;
    const nome = document.getElementById('new-u-nome').value;
    const senha = document.getElementById('new-u-pass').value;
    if(!username || !nome || !senha) return alert("Preencha todos os campos");
    await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, nome, senha, cargo: 'funcionario'})
    });
    setTabAdmin('usuarios');
}

async function deletarUsuario(user) {
    if(confirm(`Excluir ${user}?`)) {
        await fetch(`/api/admin/usuarios/${user}`, {method: 'DELETE'});
        setTabAdmin('usuarios');
    }
}

async function salvarProduto() {
    const nome = document.getElementById('new-p-nome').value;
    const preco = document.getElementById('new-p-preco').value;
    const tipo = document.getElementById('new-p-tipo').value;
    const categoria = document.getElementById('new-p-cat').value;
    if(!nome || !preco) return alert("Preencha nome e preço");
    await fetch('/api/produtos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nome, preco, tipo, categoria})
    });
    setTabAdmin('produtos');
    carregarProdutos();
}

async function deletarProduto(id) {
    if(confirm("Excluir produto?")) {
        await fetch(`/api/produtos/${id}`, {method: 'DELETE'});
        setTabAdmin('produtos');
        carregarProdutos();
    }
}

// --- RELATÓRIOS ---

async function verRelatorio() {
    const res = await fetch('/api/relatorio');
    const data = await res.json();
    const c = data.caixa;
    document.getElementById('conteudo-relatorio').innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-600 text-white p-4 rounded-xl col-span-2 text-center shadow-lg">
                <div class="text-xs opacity-80 uppercase font-bold tracking-widest">TOTAL EM CAIXA</div>
                <div class="text-4xl font-black">R$ ${c.total.toFixed(2)}</div>
            </div>
            <div class="bg-gray-50 p-3 border rounded shadow-sm">
                <div class="text-[10px] text-gray-400 font-bold uppercase">Dinheiro</div>
                <div class="font-bold text-gray-700">R$ ${c.dinheiro.toFixed(2)}</div>
            </div>
            <div class="bg-gray-50 p-3 border rounded shadow-sm">
                <div class="text-[10px] text-gray-400 font-bold uppercase">Pix</div>
                <div class="font-bold text-gray-700">R$ ${c.pix.toFixed(2)}</div>
            </div>
            <div class="bg-gray-50 p-3 border rounded shadow-sm">
                <div class="text-[10px] text-gray-400 font-bold uppercase">Débito</div>
                <div class="font-bold text-gray-700">R$ ${c.debito.toFixed(2)}</div>
            </div>
            <div class="bg-gray-50 p-3 border rounded shadow-sm">
                <div class="text-[10px] text-gray-400 font-bold uppercase">Crédito</div>
                <div class="font-bold text-gray-700">R$ ${c.credito.toFixed(2)}</div>
            </div>
        </div>
    `;
    document.getElementById('modal-relatorio').classList.remove('hidden');
}

async function verVendas() {
    const res = await fetch('/api/relatorio');
    const data = await res.json();
    let html = '<h4 class="font-bold mb-4 uppercase text-gray-500 text-sm tracking-wider">Histórico de Vendas</h4><div class="space-y-3">';
    if(data.vendas.length === 0) html += '<p class="text-center text-gray-400 py-8 italic">Nenhuma venda hoje</p>';
    data.vendas.slice().reverse().forEach(v => {
        html += `<div class="p-3 bg-gray-50 border rounded-lg shadow-sm border-gray-100">
            <div class="flex justify-between font-black text-sm mb-1">
                <span class="text-blue-600">${v.metodo.toUpperCase()}</span>
                <span class="text-gray-800">R$ ${v.total.toFixed(2)}</span>
            </div>
            <div class="text-xs text-gray-600 mb-1 leading-relaxed">${v.resumo}</div>
            <div class="text-[9px] text-gray-400 uppercase font-bold flex justify-between">
                <span>Vendedor: ${v.usuario}</span>
                <span>ID: ${v.id.split('-')[0]}</span>
            </div>
        </div>`;
    });
    document.getElementById('conteudo-relatorio').innerHTML = html + '</div>';
    document.getElementById('modal-relatorio').classList.remove('hidden');
}
