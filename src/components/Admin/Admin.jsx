import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Admin.css";

const API_URL = import.meta.env.VITE_API_URL;

const Admin = ({ onVoltar, onLogout, tipo = "ativos" }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();


  // 🔹 Detecta mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔹 Busca agendamentos
  useEffect(() => {
    const fetchAgendamentos = async () => {
      const token = localStorage.getItem("token");
      const barbeiroId = localStorage.getItem("barbeiroId");

      if (!token || !barbeiroId) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/agendamento/barbeiro/${barbeiroId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data?.$values || response.data || [];

        const parsed = data.map((a) => ({
          id: a.id,
          cliente: a.nome,
          barbeiro: a.barbeiroId,
          dataHora: a.dataHora,
          status:
            a.status === 1 ? "Pendente" :
            a.status === 2 ? "Confirmado" :
            a.status === 5 ? "Cancelado pelo Cliente" :
            a.status === 6 ? "Cancelado pelo Barbeiro" :
            a.status === 7 ? "Finalizado" :
            "Desconhecido",
          observacao: a.observacao,
          servicos: (a.agendamentoServicos || []).map(
            (s) => `Serviço #${s.servicoId}`
          ),
        }));

        setAgendamentos(parsed);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        if (error.response?.status === 401) {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAgendamentos();
  }, [navigate]);

  // 🔹 Toasts
  const showToast = (mensagem, tipo = "info") => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // 🔹 Atualizar status
  const atualizarStatus = async (id, novoStatus) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/agendamento/status/${id}`,
        { status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAgendamentos((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status:
                  novoStatus === 2
                    ? "Confirmado"
                    : novoStatus === 6
                    ? "Cancelado pelo Barbeiro"
                    : novoStatus === 7
                    ? "Finalizado"
                    : a.status,
              }
            : a
        )
      );

      showToast("Status atualizado com sucesso ✅", "sucesso");
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      showToast("Erro ao atualizar o status ❌", "erro");
    }
  };

  // -------------------------------------------------------------------------
  // 🔹 Listas de Ativos e Histórico (filtragens)
  // -------------------------------------------------------------------------

  const ordenados = [...agendamentos].sort(
  (a,b) => new Date(b.dataHora) - new Date(a.dataHora)
  );

  const ativos = ordenados.filter((a) =>
    ["Pendente", "Confirmado"].includes(a.status)
  );

  const historico = ordenados.filter((a) =>
    ["Finalizado", "Cancelado pelo Barbeiro", "Cancelado pelo Cliente"].includes(a.status)
  );

  // 🔹 Escolhe qual lista mostrar com base no tipo passado pela rota
  const lista = tipo === "historico" ? historico : ativos;

  // -------------------------------------------------------------------------
  // 🔹 Paginação
  // -------------------------------------------------------------------------

  const itensPorPagina = 5;
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.ceil(lista.length / itensPorPagina);
  const paginaItens = lista.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  // Reseta para página 1 ao trocar de aba
  useEffect(() => {
    setPagina(1);
  }, [tipo]);

  // -------------------------------------------------------------------------
  // 🔹 Renderização
  // -------------------------------------------------------------------------

  const handleVoltar = () => {
    navigate("/");
    onVoltar?.();
  };

  const handleLogoff = () => {
    localStorage.removeItem("autenticado");
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("barbeiroId");

    onLogout?.();
    showToast("Sessão encerrada com sucesso 👋", "sucesso");

    setTimeout(() => navigate("/login", { replace: true }), 800);
  };

  return (
    <div className="admin-page">
      <div className="top-buttons">
        <button className="voltar-site" onClick={handleVoltar}>
          ← Voltar ao site
        </button>
        <button className="logoff-btn" onClick={handleLogoff}>
          ⎋ Sair do painel
        </button>
      </div>

      <div className="admin-container">
        <h1>💈 Painel do Barbeiro</h1>
        <p>
          {tipo === "historico"
            ? "Agendamentos Finalizados e Cancelados"
            : "Agendamentos Ativos"}
        </p>

        <div className="abas-container">
          <Link to="/admin" className={`aba ${tipo === "ativos" ? "ativa" : ""}`}>
            Ativos
          </Link>
          <Link to="/admin/historico" className={`aba ${tipo === "historico" ? "ativa" : ""}`}>
            Histórico
          </Link>
        </div>

        <div className="admin-table">
          {loading ? (
            <p className="texto-centro">Carregando...</p>
          ) : lista.length ? (
            !isMobile ? (
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Serviços</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaItens.map((a) => (
                    <tr key={a.id}>
                      <td>{a.cliente}</td>
                      <td>{a.servicos.join(", ")}</td>
                      <td>{new Date(a.dataHora).toLocaleString("pt-BR")}</td>
                      <td className={`status ${a.status.toLowerCase().replace(/\s/g, "-")}`}>
                        {a.status}
                      </td>
                      <td>{a.observacao || "-"}</td>
                      <td>
                        <div className="acoes-admin">
                          {a.status === "Pendente" && (
                            <>
                              <button onClick={() => atualizarStatus(a.id, 2)}>✅ Confirmar</button>
                              <button onClick={() => atualizarStatus(a.id, 6)}>❌ Cancelar</button>
                            </>
                          )}
                          {a.status === "Confirmado" && (
                            <>
                              <button onClick={() => atualizarStatus(a.id, 7)}>🏁 Finalizar</button>
                              <button onClick={() => atualizarStatus(a.id, 6)}>❌ Cancelar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              paginaItens.map((a) => (
                <div className="admin-card" key={a.id}>
                  <p><strong>Cliente:</strong> {a.cliente}</p>
                  <p><strong>Serviços:</strong> {a.servicos.join(", ")}</p>
                  <p><strong>Data:</strong> {new Date(a.dataHora).toLocaleString("pt-BR")}</p>
                  <p><strong>Status:</strong> {a.status}</p>
                  <p><strong>Obs:</strong> {a.observacao || "-"}</p>

                  <div className="acoes-admin">
                    {a.status === "Pendente" && (
                      <>
                        <button onClick={() => atualizarStatus(a.id, 2)}>✅ Confirmar</button>
                        <button onClick={() => atualizarStatus(a.id, 6)}>❌ Cancelar</button>
                      </>
                    )}
                    {a.status === "Confirmado" && (
                      <>
                        <button onClick={() => atualizarStatus(a.id, 7)}>🏁 Finalizar</button>
                        <button onClick={() => atualizarStatus(a.id, 6)}>❌ Cancelar</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="admin-empty">
              <p>Nenhum agendamento encontrado.</p>
            </div>
          )}
        </div>

        {lista.length > itensPorPagina && (
          <div className="paginacao">
            <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1}>
              ← Anterior
            </button>
            <span>Página {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas}>
              Próxima →
            </button>
          </div>
        )}
      </div>

      {toast && <div className={`toast ${toast.tipo}`}>{toast.mensagem}</div>}
    </div>
  );
};

export default Admin;
