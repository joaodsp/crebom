import tkinter as tk
from tkinter import messagebox

# -------------------------
# VARIÁVEIS
# -------------------------
total_caixa = 0
total_dinheiro = 0
total_debito = 0
total_credito = 0
total_pix = 0

vendas = []

# -------------------------
# FUNÇÃO DE VENDA
# -------------------------
def vender(produto, preco, tipo="qtd"):
    try:
        valor_digitado = float(entry_valor.get())

        if tipo == "qtd":
            valor = valor_digitado * preco
        else:
            valor = valor_digitado * preco

        abrir_pagamento(valor, produto)

    except:
        status["text"] = "Digite um valor válido!"


# -------------------------
# PAGAMENTO
# -------------------------
def abrir_pagamento(valor, produto):

    janela_pag = tk.Toplevel()
    janela_pag.title("Pagamento")
    janela_pag.geometry("250x300")

    tk.Label(janela_pag, text=f"Total: R$ {valor:.2f}", font=("Arial", 14)).pack(pady=10)

    def pagar(tipo):
        global total_caixa, total_dinheiro, total_debito, total_credito, total_pix

        total_caixa += valor

        if tipo == "dinheiro":
            total_dinheiro += valor
        elif tipo == "debito":
            total_debito += valor
        elif tipo == "credito":
            total_credito += valor
        elif tipo == "pix":
            total_pix += valor

        vendas.append(f"{produto} - R$ {valor:.2f}")

        status["text"] = f"Venda realizada: {produto}"
        entry_valor.delete(0, tk.END)

        janela_pag.destroy()

    # BOTÕES GRANDES
    tk.Button(janela_pag, text="💵 Dinheiro", height=2, command=lambda: pagar("dinheiro")).pack(fill="x", pady=5)
    tk.Button(janela_pag, text="💳 Débito", height=2, command=lambda: pagar("debito")).pack(fill="x", pady=5)
    tk.Button(janela_pag, text="💳 Crédito", height=2, command=lambda: pagar("credito")).pack(fill="x", pady=5)
    tk.Button(janela_pag, text="📱 PIX", height=2, command=lambda: pagar("pix")).pack(fill="x", pady=5)


# -------------------------
# RELATÓRIO
# -------------------------
def relatorio():
    texto = f"""
TOTAL: R$ {total_caixa:.2f}

Dinheiro: R$ {total_dinheiro:.2f}
Débito: R$ {total_debito:.2f}
Crédito: R$ {total_credito:.2f}
PIX: R$ {total_pix:.2f}
"""
    messagebox.showinfo("Relatório do Caixa", texto)


# -------------------------
# VENDAS
# -------------------------
def ver_vendas():
    if not vendas:
        messagebox.showinfo("Vendas", "Nenhuma venda registrada")
    else:
        lista = "\n".join(vendas)
        messagebox.showinfo("Vendas", lista)


# -------------------------
# INTERFACE PRINCIPAL
# -------------------------
janela = tk.Tk()
janela.title("CAIXA CREBOM 🍦")
janela.geometry("400x500")

# TÍTULO
tk.Label(janela, text="SORVETERIA CREBOM", font=("Arial", 16, "bold")).pack(pady=10)

# CAMPO
tk.Label(janela, text="Quantidade / Peso", font=("Arial", 12)).pack()
entry_valor = tk.Entry(janela, font=("Arial", 14), justify="center")
entry_valor.pack(pady=5)

# FRAME DE PRODUTOS
frame_produtos = tk.Frame(janela)
frame_produtos.pack(pady=10)

# BOTÕES (GRID)
tk.Button(frame_produtos, text="Picolé Creme\nR$2,50", width=15, height=3,
          command=lambda: vender("Picolé Creme", 2.50)).grid(row=0, column=0)

tk.Button(frame_produtos, text="Picolé Gelo\nR$2,00", width=15, height=3,
          command=lambda: vender("Picolé Gelo", 2.00)).grid(row=0, column=1)

tk.Button(frame_produtos, text="Casquinha\nR$5,00", width=15, height=3,
          command=lambda: vender("Casquinha", 5.00)).grid(row=1, column=0)

tk.Button(frame_produtos, text="Cascão\nR$7,00", width=15, height=3,
          command=lambda: vender("Cascão", 7.00)).grid(row=1, column=1)

tk.Button(frame_produtos, text="Sorvete KG\nR$49,90", width=15, height=3,
          command=lambda: vender("Sorvete KG", 49.90, "peso")).grid(row=2, column=0)

tk.Button(frame_produtos, text="Pote 1L\nR$10,00", width=15, height=3,
          command=lambda: vender("Pote 1L", 10.00)).grid(row=2, column=1)

tk.Button(frame_produtos, text="Pote 2L\nR$15,00", width=15, height=3,
          command=lambda: vender("Pote 2L", 15.00)).grid(row=3, column=0, columnspan=2, sticky="we")

# BOTÕES EXTRAS
tk.Button(janela, text="📊 Relatório", height=2, command=relatorio).pack(fill="x", pady=5)
tk.Button(janela, text="🧾 Ver Vendas", height=2, command=ver_vendas).pack(fill="x")

# STATUS
status = tk.Label(janela, text="Sistema pronto", bd=1, relief="sunken", anchor="w")
status.pack(fill="x", side="bottom")

janela.mainloop()
