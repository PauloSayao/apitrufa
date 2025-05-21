const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// =============================================
// CONFIGURAÇÃO SEGURA DO CORS
// =============================================

const allowedOrigins = [
  'https://projeto-final-one-ruby.vercel.app',
  'http://localhost:4200' // Para desenvolvimento
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Configuração explícita para OPTIONS nas rotas necessárias
app.options('/login', cors(corsOptions));
app.options('/register', cors(corsOptions));
app.options('/produtos', cors(corsOptions));
app.options('/produtos/:id', cors(corsOptions));
app.options('/pedidos', cors(corsOptions));
app.options('/pedidos/:id', cors(corsOptions));

// =============================================
// MIDDLEWARES
// =============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// DADOS (SIMULANDO UM BANCO DE DADOS)
// =============================================

const users = [
  { name: "admin", password: "123456", role: "admin", email: "admin@email.com", telephone: "123456789" },
  { name: "user", password: "123456", role: "user", email: "user@email.com", telephone: "987654321" },
];

const produtos = [
  {
    id: 1,
    name: 'Trufa de Chocolate',
    price: 5.0,
    image: 'trufachocolate.jpg',
    descricao: 'Deliciosa trufa recheada com ganache de chocolate meio amargo.',
    quantity: 1,
    ativo: true
  },
  // ... outros produtos
];

const pedidosSalvos = [];
let pedidoIdCounter = 1;

// =============================================
// ROTAS DE AUTENTICAÇÃO
// =============================================

app.post("/login", (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Nome e senha são obrigatórios!" });
    }

    const user = users.find(u => u.name === name && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: "Usuário ou senha incorretos!" });
    }

    return res.status(200).json({
      id: users.indexOf(user) + 1,
      name: user.name,
      email: user.email,
      role: user.role,
      telephone: user.telephone
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.post("/register", (req, res) => {
  try {
    const { name, password, email, fullName, telephone } = req.body;

    if (!name || !password || !email) {
      return res.status(400).json({ message: "Preencha todos os campos obrigatórios!" });
    }

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ message: "Email inválido!" });
    }

    const userExists = users.find(u => u.name === name || u.email === email);

    if (userExists) {
      return res.status(409).json({ message: "Usuário ou e-mail já cadastrado!" });
    }

    const newUser = {
      name,
      password,
      email,
      fullName,
      telephone,
      role: "user"
    };

    users.push(newUser);

    return res.status(201).json({ 
      message: "Usuário registrado com sucesso!",
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// =============================================
// ROTAS DE PRODUTOS
// =============================================

app.get("/produtos", (req, res) => {
  try {
    const ativosOnly = req.query.ativos === 'true';
    const resultado = ativosOnly ? produtos.filter(p => p.ativo) : produtos;
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.patch("/produtos/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const produto = produtos.find(p => p.id === id);
    
    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado!" });
    }
    
    if (req.body.ativo !== undefined) {
      produto.ativo = req.body.ativo;
    }
    
    return res.status(200).json(produto);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// =============================================
// ROTAS DE PEDIDOS
// =============================================

app.post("/pedidos", (req, res) => {
  try {
    const { produtos, nome, telefone } = req.body;

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0 || !nome || !telefone) {
      return res.status(400).json({ message: "Dados do pedido inválidos!" });
    }

    const novoPedido = {
      id: pedidoIdCounter++,
      produtos,
      nome,
      telefone,
      data: new Date().toISOString()
    };

    pedidosSalvos.push(novoPedido);
    return res.status(201).json({ 
      message: "Pedido salvo com sucesso!",
      pedido: novoPedido
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.get("/pedidos", (req, res) => {
  try {
    return res.status(200).json({ pedidos: pedidosSalvos });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.delete("/pedidos/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = pedidosSalvos.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Pedido não encontrado!" });
    }

    const pedidoRemovido = pedidosSalvos.splice(index, 1);
    return res.status(200).json({ 
      message: "Pedido removido com sucesso!",
      pedido: pedidoRemovido[0]
    });
  } catch (error) {
    console.error("Erro ao remover pedido:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

// =============================================
// MIDDLEWARE DE ERRO GLOBAL
// =============================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Acesso não permitido pela política CORS' });
  }
  
  res.status(500).json({ message: "Erro interno do servidor" });
});

// =============================================
// INICIAR SERVIDOR
// =============================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Origens permitidas: ${allowedOrigins.join(', ')}`);
});