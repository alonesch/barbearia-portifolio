import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Home from "./pages/Home";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import "./styles/styles.css";

function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [authCarregado, setAuthCarregado] = useState(false);
  const [credenciais, setCredenciais] = useState({ usuario: "", senha: "" });
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  // 🔹 Verifica login salvo
  useEffect(() => {
    const token = localStorage.getItem("token");
    const barbeiroId = localStorage.getItem("barbeiroId");

    if (token && barbeiroId) {
      setAutenticado(true);
    }


    setAuthCarregado(true);
  }, []);

  if (!authCarregado) {
    return <div>Carregando...</div>;
  }

  // 🔹 Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/login`, credenciais);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("usuarioId", response.data.usuario.id);
      localStorage.setItem("usuarioNome", response.data.usuario.nomeUsuario);
      localStorage.setItem("barbeiroId", response.data.usuario.barbeiroId);

      setAutenticado(true);

    } catch (err) {
      console.error("Houve um erro ao logar.", err.message);
      setErro("Houve um erro ao logar.");
    } finally {
      setLoading(false);
    }
    


  };





  // 🔹 Logout
  const handleLogout = () => {
    localStorage.clear();
    setAutenticado(false);
  };

  return (
    <Router>
      <Routes>
        {/* Página inicial */}
        <Route path="/" element={<Home />} />

        {/* Login */}
        <Route
          path="/login"
          element={
            autenticado ? (
              <Navigate to="/admin" replace />
            ) : (
              <div className="login-container">
                <h1>💈 Login do Barbeiro</h1>
                <form onSubmit={handleLogin} className="login-form">
                  <input
                    type="text"
                    placeholder="Usuário"
                    value={credenciais.usuario}
                    onChange={(e) =>
                      setCredenciais({ ...credenciais, usuario: e.target.value })
                    }
                    required
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={credenciais.senha}
                    onChange={(e) =>
                      setCredenciais({ ...credenciais, senha: e.target.value })
                    }
                    required
                  />
                  <button className={`login-btn ${loading ? "loading" : ""}`} disabled={loading}>
                    {loading ? <div className="spinner"></div> : "Entrar"}
                  </button>
                  {erro && <p className="erro-login">{erro}</p>}
                </form>

                <button
                  onClick={() => (window.location.href = "/")}
                  className="voltar-site"
                >
                  ← Voltar ao site
                </button>
              </div>
            )
          }
        />

        {/* Histórico */}
        <Route
          path="/admin/historico"
          element={
            autenticado ? (
              <AdminPage tipo="historico" onLogout={handleLogout}/>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            autenticado ? (
              <AdminPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
