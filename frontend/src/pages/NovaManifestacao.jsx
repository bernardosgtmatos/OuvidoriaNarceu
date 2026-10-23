import { useEffect, useState } from 'react';
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

const STEPS = [
  { label: 'Identificação' },
  { label: 'Tipo e setor' },
  { label: 'Detalhes' },
  { label: 'Revisão' },
];

const initial = {
  anonimo: false,
  nome: '',
  turma: '',
  tipo: 'reclamacao',
  setor: '',
  titulo: '',
  descricao: '',
};

export default function NovaManifestacao() {
  const [form, setForm] = useState(initial);
  const [turmas, setTurmas] = useState([]);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listTurmas().then((data) => setTurmas(Array.isArray(data) ? data : data.data || [])).catch(() => setTurmas([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateStep(s) {
    if (s === 0) return true; // identificação opcional
    if (s === 1) return true; // tipo tem default
    if (s === 2) {
      if (form.titulo.trim().length < 3) return false;
      if (form.descricao.trim().length < 5) return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) {
      setError('Preencha os campos obrigatórios antes de avançar.');
      return;
    }
    setError('');
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
  }

  function goPrev() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  function goTo(s) {
    if (s <= maxReached) {
      setError('');
      setStep(s);
    }
  }

  async function onSubmit(e) {
    if (e) e.preventDefault();
    if (!validateStep(2)) {
      setError('Preencha os campos obrigatórios.');
      setStep(2);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        tipo: form.tipo,
        titulo: form.titulo,
        descricao: form.descricao,
        setor: form.setor || undefined,
        anonimo: form.anonimo,
        ...(form.anonimo
          ? {}
          : { nome: form.nome || undefined, turma: form.turma || undefined }),
      };
      const item = await api.createManifestacao(payload);
      setSuccess(item);
      setForm(initial);
      setStep(STEPS.length - 1);
      setMaxReached(STEPS.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <h1>Manifestação registrada!</h1>
            <p>Protocolo: <code style={{ fontSize: 18 }}>{success.protocolo}</code></p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => navigate(`/consultar?protocolo=${success.protocolo}`)}>
                Consultar andamento
              </button>
              <button className="btn btn-secondary" onClick={() => { setSuccess(null); setStep(0); setMaxReached(0); }}>
                Nova manifestação
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>Nova manifestação</h1>
        <p className="muted">Registre sua manifestação em etapas. Você receberá um protocolo para acompanhamento.</p>

        {error && <p className="error">{error}</p>}

        <div className="wizard">
          <div className="wizard__progress">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className={`wizard__step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => goTo(i)}
                disabled={i > maxReached}
              >
                <span className="wizard__step-num">{i + 1}</span>
                <span className="wizard__step-label">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="wizard__viewport">
            <div className="wizard__track" style={{ transform: `translateX(-${step * 25}%)` }}>
              <div className="wizard__slide">
                <div className="card">
                  <h2>Identificação</h2>
                  <div className="form">
                    <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={form.anonimo}
                        onChange={(e) => update('anonimo', e.target.checked)}
                        style={{ width: 'auto' }}
                      />
                      Enviar de forma anônima
                    </label>
                    {!form.anonimo && (
                      <>
                        <label>
                          Nome completo
                          <input value={form.nome} onChange={(e) => update('nome', e.target.value)} />
                        </label>
                        <label>
                          Turma
                          <select value={form.turma} onChange={(e) => update('turma', e.target.value)}>
                            <option value="">Selecione…</option>
                            {turmas.map((t) => (
                              <option key={t.id} value={t.nome}>{t.nome} — {t.turno}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="wizard__slide">
                <div className="card">
                  <h2>Tipo e setor</h2>
                  <div className="form">
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
                  </div>
                </div>
              </div>

              <div className="wizard__slide">
                <div className="card">
                  <h2>Detalhes</h2>
                  <div className="form">
                    <label>
                      Título
                      <input
                        value={form.titulo}
                        onChange={(e) => update('titulo', e.target.value)}
                        minLength={3}
                        required
                      />
                    </label>
                    <label>
                      Descrição
                      <textarea
                        value={form.descricao}
                        onChange={(e) => update('descricao', e.target.value)}
                        minLength={5}
                        rows={4}
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="wizard__slide">
                <div className="card">
                  <h2>Revisão</h2>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <p><strong>Anônimo:</strong> {form.anonimo ? 'Sim' : 'Não'}</p>
                    {!form.anonimo && (
                      <>
                        <p><strong>Nome:</strong> {form.nome || '—'}</p>
                        <p><strong>Turma:</strong> {form.turma || '—'}</p>
                      </>
                    )}
                    <p><strong>Tipo:</strong> {form.tipo}</p>
                    <p><strong>Setor:</strong> {form.setor || '—'}</p>
                    <p><strong>Título:</strong> {form.titulo}</p>
                    <p><strong>Descrição:</strong> {form.descricao}</p>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>
                      {loading ? 'Enviando…' : 'Enviar manifestação'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="wizard__actions">
            <button type="button" className="btn btn-outline" onClick={goPrev} disabled={step === 0}>
              Voltar
            </button>
            {step < STEPS.length - 1 && (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                Avançar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
