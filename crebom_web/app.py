from flask import Flask, render_template, request, jsonify, session
import uuid

app = Flask(__name__)
app.secret_key = 'crebom_secret_key_123' # Chave para sessões

# ARMAZENAMENTO EM MEMÓRIA (RESETA AO REINICIAR)
caixa = {
    "total": 0.0,
    "dinheiro": 0.0,
    "debito": 0.0,
    "credito": 0.0,
    "pix": 0.0
}
vendas = []

# Usuários iniciais (Login: admin / Senha: 123)
usuarios = {
    "admin": {"nome": "Administrador", "senha": "123", "cargo": "admin"}
}

produtos = [
    {"id": str(uuid.uuid4()), "nome": "Picolé Creme", "preco": 2.50, "tipo": "qtd", "categoria": "Picolé"},
    {"id": str(uuid.uuid4()), "nome": "Picolé Gelo", "preco": 2.00, "tipo": "qtd", "categoria": "Picolé"},
    {"id": str(uuid.uuid4()), "nome": "Casquinha", "preco": 5.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Cascão", "preco": 7.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Sorvete KG", "preco": 49.90, "tipo": "peso", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Pote 1L", "preco": 10.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Pote 2L", "preco": 15.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Milkshake 300ml", "preco": 10.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Milkshake 500ml", "preco": 15.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Milkshake 700ml", "preco": 20.00, "tipo": "qtd", "categoria": "Sorvetes"},
    {"id": str(uuid.uuid4()), "nome": "Água 500ml", "preco": 3.00, "tipo": "qtd", "categoria": "Bebidas"},
    {"id": str(uuid.uuid4()), "nome": "Refrigerante Lata", "preco": 5.00, "tipo": "qtd", "categoria": "Bebidas"},
    {"id": str(uuid.uuid4()), "nome": "Suco Del Valle", "preco": 6.00, "tipo": "qtd", "categoria": "Bebidas"},
    {"id": str(uuid.uuid4()), "nome": "Barra de Chocolate", "preco": 8.00, "tipo": "qtd", "categoria": "Chocolates/Doces/Salgadinhos"},
    {"id": str(uuid.uuid4()), "nome": "Salgadinho Elma Chips", "preco": 7.50, "tipo": "qtd", "categoria": "Chocolates/Doces/Salgadinhos"},
    {"id": str(uuid.uuid4()), "nome": "Bala de Goma", "preco": 1.50, "tipo": "qtd", "categoria": "Chocolates/Doces/Salgadinhos"}
]

# --- ROTAS DE AUTENTICAÇÃO ---
# ... (mantém as rotas de login/logout/me)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = usuarios.get(username)
    if user and user['senha'] == password:
        session['user'] = username
        session['cargo'] = user['cargo']
        return jsonify({"status": "sucesso", "user": {"username": username, "nome": user['nome'], "cargo": user['cargo']}})
    
    return jsonify({"erro": "Usuário ou senha inválidos"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "sucesso"})

@app.route('/api/me', methods=['GET'])
def get_me():
    if 'user' in session:
        user = usuarios[session['user']]
        return jsonify({"username": session['user'], "nome": user['nome'], "cargo": user['cargo']})
    return jsonify({"erro": "Não autenticado"}), 401

# --- ROTAS DE GESTÃO (ADMIN) ---

@app.route('/api/admin/usuarios', methods=['GET', 'POST'])
def gerenciar_usuarios():
    if session.get('cargo') != 'admin':
        return jsonify({"erro": "Acesso negado"}), 403
    
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        if username in usuarios:
            return jsonify({"erro": "Usuário já existe"}), 400
        usuarios[username] = {
            "nome": data.get('nome'),
            "senha": data.get('senha'),
            "cargo": data.get('cargo', 'funcionario')
        }
        return jsonify({"status": "sucesso"})
    
    return jsonify([{"username": k, "nome": v['nome'], "cargo": v['cargo']} for k, v in usuarios.items()])

@app.route('/api/admin/usuarios/<username>', methods=['DELETE'])
def deletar_usuario(username):
    if session.get('cargo') != 'admin':
        return jsonify({"erro": "Acesso negado"}), 403
    if username == 'admin':
        return jsonify({"erro": "Não é possível deletar o admin principal"}), 400
    if username in usuarios:
        del usuarios[username]
        return jsonify({"status": "sucesso"})
    return jsonify({"erro": "Usuário não encontrado"}), 404

# --- ROTAS DE PRODUTOS ---

@app.route('/api/produtos', methods=['GET', 'POST'])
def gerenciar_produtos():
    if request.method == 'POST':
        if session.get('cargo') != 'admin':
            return jsonify({"erro": "Acesso negado"}), 403
        data = request.json
        novo_prod = {
            "id": str(uuid.uuid4()),
            "nome": data.get('nome'),
            "preco": float(data.get('preco')),
            "tipo": data.get('tipo'),
            "categoria": data.get('categoria')
        }
        produtos.append(novo_prod)
        return jsonify({"status": "sucesso", "produto": novo_prod})
    
    return jsonify(produtos)

@app.route('/api/produtos/<id>', methods=['DELETE'])
def deletar_produto(id):
    if session.get('cargo') != 'admin':
        return jsonify({"erro": "Acesso negado"}), 403
    global produtos
    produtos = [p for p in produtos if p['id'] != id]
    return jsonify({"status": "sucesso"})

# --- ROTAS DE VENDAS ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/vender', methods=['POST'])
def vender():
    if 'user' not in session:
        return jsonify({"erro": "Login necessário"}), 401
    
    data = request.json
    try:
        itens = data.get('itens')
        total_venda = float(data.get('total'))
        metodo = data.get('metodo')

        if metodo not in caixa:
            return jsonify({"erro": "Método de pagamento inválido"}), 400

        caixa["total"] += total_venda
        caixa[metodo] += total_venda

        venda = {
            "id": str(uuid.uuid4()),
            "usuario": session['user'],
            "itens": itens,
            "total": total_venda,
            "metodo": metodo,
            "resumo": ", ".join([f"{i['nome']} (x{i['qtd']})" for i in itens])
        }
        vendas.append(venda)

        return jsonify({"status": "sucesso", "venda": venda})
    except Exception as e:
        return jsonify({"erro": str(e)}), 400

@app.route('/api/relatorio', methods=['GET'])
def relatorio():
    return jsonify({
        "caixa": caixa,
        "vendas": vendas
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

@app.route('/api/relatorio', methods=['GET'])
def relatorio():
    return jsonify({
        "caixa": caixa,
        "vendas": vendas
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
