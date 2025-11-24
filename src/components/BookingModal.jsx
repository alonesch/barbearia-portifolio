import React, { useState, useEffect } from "react";
import "../styles/BookingModal.css";

const API_URL = import.meta.env.VITE_API_URL;

function BookingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    barbeiroId: "",
    servicoId: "",
    dataHora: "",
    observacao: "",
  });
  const [loading, setLoading] = useState(true);

  // 🔹 Carrega barbeiros e serviços da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [barbeirosRes, servicosRes] = await Promise.all([
          fetch(`${API_URL}/api/barbeiro`),
          fetch(`${API_URL}/api/servico`),
        ]);

        if (!barbeirosRes.ok || !servicosRes.ok) {
          throw new Error("Erro ao buscar dados do servidor.");
        }

        const barbeirosData = await barbeirosRes.json();
        const servicosData = await servicosRes.json();

        setBarbeiros(barbeirosData.$values || barbeirosData);
        setServicos(servicosData.$values || servicosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("⚠️ Erro ao carregar barbeiros ou serviços. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "observacao" && value.length > 150) return;
    setFormData({ ...formData, [name]: value });
  };

  // 🔹 Envia o agendamento para o backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/agendamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          cpf: formData.cpf || null,
          telefone: formData.telefone,
          barbeiroId: parseInt(formData.barbeiroId),
          dataHora: formData.dataHora + ":00",
          observacao: formData.observacao,
          agendamentoServicos: [
            {
              servicoId: parseInt(formData.servicoId),
              observacao: formData.observacao || null,
            },
          ],
        }),
      });
      

      const raw = await response.json();
      let result = {};

      try{
        result = raw ? JSON.parse(raw) : {};
      } catch(e) {
        console.log("Resposta não era JSON", raw);
      }

      if (response.ok){
        alert("✅ " + (result.mensagem || "Agendamento criado com sucesso!"));
        onClose();
      }
      else {
        alert("❌ " + (result.mensagem) || "Erro ao criar agendamento.")
      }
    } catch (err) {
      console.error("Erro de conexão:", err);
      alert("❌ Falha inesperada.");
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <p>Carregando opções...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3>Agendar horário</h3>

        <form className="booking-form" onSubmit={handleSubmit}>
          <label>
            Nome:
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Digite seu nome completo"
              required
            />
          </label>

          <label>
            CPF:
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="Somente números (obrigatório)"
              maxLength={11}
            />
          </label>

          <label>
            Telefone:
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Ex: 51999999999 (obrigatório)"
              maxLength={11}
              required
            />
          </label>

          <label>
            Barbeiro:
            <select
              name="barbeiroId"
              value={formData.barbeiroId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              {barbeiros.map((b) => (
                <option key={b.id || b.ID} value={b.id || b.ID}>
                  {b.nome || b.Nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Serviço:
            <select
              name="servicoId"
              value={formData.servicoId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              {servicos.map((s) => (
                <option key={s.id || s.ID} value={s.id || s.ID}>
                  {s.nomeServico + " — R$" + s.preco}
                </option>
              ))}
            </select>
          </label>

          <label>
            Data e Hora:
            <input
              type="datetime-local"
              name="dataHora"
              value={formData.dataHora}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Observações:
            <textarea
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              placeholder="Ex: Prefiro corte com máquina 2, ou outros detalhes..."
              maxLength={150}
            />
            <small>{formData.observacao.length}/150</small>
          </label>

          <div className="form-buttons">
            <button type="submit" className="confirm-btn">
              Confirmar
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;