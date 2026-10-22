import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const TIPOS = ['denuncia', 'reclamacao', 'sugestao', 'elogio', 'solicitacao'];
const SETORES = [
  { value: 'direcao', label: 'Direção' },
  { value: 'pedagogico', label: 'Pedagógico' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'apoie', label: 'APOIE' },
  { value: 'tutor', label: 'Tutor' },
];

const initial = { tipo: 'reclamacao', titulo: '', descricao: '', setor: '', nome: '', contato: '', anonimo: false };

export default function NovaManifestacao() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const payload = {
        tipo: form.tipo,
        titulo: form.titulo,
        descricao: form.descricao,
        setor: form.setor || undefined,
        anonimo: form.anonimo,
        ...(form.anonimo ? {} : { nome: form.nome, contato: form.contato }),
      };
      const item = await api.createManifestacao(payload);
      setSuccess(item);
      setForm(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Nova manifestação</h1>
        <p className="muted">Registre sua manifestação. Você receberá um protocolo para acompanhamento.</p>

        {error && <p className="error">{error}</p>}
        {success && (
          <div className="card" style={{ marginBottom: 16, borderColor: '#bbf7d0' }}>
            <strong>Manifestação registrada!</strong>
            <p>Protocolo: <code>{success.protocolo}</code></p>
            <button className="btn btn-secondary" onClick={() => navigate(`/consultar?protocolo=${success.protocolo}`)}>
              Consultar andamento
            </button>
          </div>
        )}

        <div className="card">
          <form onSubmit={onSubmit} className="form">
            <label>
              Tipo
              <select value={form.tipo} onChange={(e) => update('tipo', e.target.value)}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Setor (opcional)
              <select value={form.setor} onChange={(e) => update('setor', e.target.value)}>
                <option value="">—</option>
                {SETORES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label>
              Título
              <input value={form.titulo} onChange={(e) => update('titulo', e.target.value)} required minLength={3} />
            </label>
            <label>
              Descrição
              <textarea value={form.descricao} onChange={(e) => update('descricao', e.target.value)} required minLength={5} rows={4} />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.anonimo} onChange={(e) => update('anonimo', e.target.checked)} style={{ width: 'auto' }} />
              Enviar de forma anônima
            </label>
            {!form.anonimo && (
              <>
                <label>
                  Nome
                  <input value={form.nome} onChange={(e) => update('nome', e.target.value)} />
                </label>
                <label>
                  Contato (e-mail/telefone)
                  <input value={form.contato} onChange={(e) => update('contato', e.target.value)} />
                </label>
              </>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar manifestação'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
