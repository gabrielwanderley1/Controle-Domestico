import { useState, type FormEvent } from 'react';
import { insertItem } from '../services/itensService';
import './AddItemForm.css';

interface AddItemFormProps {
  /** Callback disparado após inserção bem-sucedida. Permite ao componente pai sincronizar listas. */
  onItemAdded?: () => void;
  /** Callback para exibir feedback visual (sucesso/erro). */
  onFeedback?: (message: string, type: 'success' | 'error') => void;
}

/**
 * Formulário modular para cadastro de itens no estoque.
 *
 * Calcula automaticamente a `data_estimada_termino` com base em:
 *   data_estimada_termino = data_compra + (quantidade × duracao_dias_unidade)
 *
 * Persiste diretamente no Supabase via `insertItem()`. O RLS garante
 * que o item é associado ao usuário autenticado (auth.uid()).
 */
export function AddItemForm({ onItemAdded, onFeedback }: AddItemFormProps) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [duracaoDias, setDuracaoDias] = useState('');
  const [dataCompra, setDataCompra] = useState(getTodayISO());
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // ── Validações ────────────────────────────────────────────
    const nomeTrimmed = nome.trim();
    if (!nomeTrimmed) {
      onFeedback?.('Informe o nome do item.', 'error');
      return;
    }

    const qtd = parseInt(quantidade, 10);
    if (isNaN(qtd) || qtd <= 0) {
      onFeedback?.('A quantidade deve ser um número inteiro maior que 0.', 'error');
      return;
    }

    const duracao = parseInt(duracaoDias, 10);
    if (isNaN(duracao) || duracao <= 0) {
      onFeedback?.('A duração por unidade deve ser um número inteiro maior que 0.', 'error');
      return;
    }

    if (!dataCompra) {
      onFeedback?.('Informe a data de compra.', 'error');
      return;
    }

    // ── Cálculo da data estimada de término ───────────────────
    const totalDias = qtd * duracao;
    const dataEstimadaTermino = calcularDataTermino(dataCompra, totalDias);

    // ── Persistência no Supabase ──────────────────────────────
    setIsSubmitting(true);
    try {
      await insertItem({
        nome: nomeTrimmed,
        quantidade: qtd,
        duracao_dias_unidade: duracao,
        data_compra: dataCompra,
        data_estimada_termino: dataEstimadaTermino,
      });

      onFeedback?.('Alterações salvas com sucesso!', 'success');
      resetForm();
      onItemAdded?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar item.';
      onFeedback?.(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setNome('');
    setQuantidade('');
    setDuracaoDias('');
    setDataCompra(getTodayISO());
  }

  // ── Preview da data estimada (em tempo real) ──────────────
  const previewTermino = getPreviewTermino(quantidade, duracaoDias, dataCompra);

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <h2 className="add-item-title">Adicionar Item</h2>

      <div className="form-field">
        <label htmlFor="item-nome">Nome do Item</label>
        <input
          id="item-nome"
          type="text"
          placeholder="Ex.: Arroz, Sabonete..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={isSubmitting}
          autoComplete="off"
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="item-quantidade">Quantidade</label>
          <input
            id="item-quantidade"
            type="number"
            placeholder="Ex.: 5"
            min="1"
            step="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field">
          <label htmlFor="item-duracao">Duração/Unidade (dias)</label>
          <input
            id="item-duracao"
            type="number"
            placeholder="Ex.: 30"
            min="1"
            step="1"
            value={duracaoDias}
            onChange={(e) => setDuracaoDias(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="item-data-compra">Data de Compra</label>
        <input
          id="item-data-compra"
          type="date"
          value={dataCompra}
          onChange={(e) => setDataCompra(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {previewTermino && (
        <div className="preview-termino">
          <span className="preview-label">Término estimado:</span>
          <span className="preview-date">{previewTermino}</span>
        </div>
      )}

      <button
        type="submit"
        className="add-item-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? <span className="spinner-small" /> : 'Salvar Item'}
      </button>
    </form>
  );
}

// ── Funções utilitárias ────────────────────────────────────────────

/** Retorna a data atual local no formato YYYY-MM-DD (sem distorção de UTC). */
function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula a data de término somando dias a uma data base no fuso local.
 * @param dataCompraISO Data base no formato YYYY-MM-DD.
 * @param totalDias Número de dias a somar.
 * @returns Data resultante no formato YYYY-MM-DD.
 */
function calcularDataTermino(dataCompraISO: string, totalDias: number): string {
  const [y, m, d] = dataCompraISO.split('-').map(Number);
  const data = new Date(y, m - 1, d);
  data.setDate(data.getDate() + totalDias);

  const year = data.getFullYear();
  const month = String(data.getMonth() + 1).padStart(2, '0');
  const day = String(data.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gera preview da data de término para exibição em tempo real.
 * Retorna string formatada ou null se os campos estiverem incompletos.
 */
function getPreviewTermino(
  quantidade: string,
  duracaoDias: string,
  dataCompra: string,
): string | null {
  const qtd = parseInt(quantidade, 10);
  const duracao = parseInt(duracaoDias, 10);

  if (isNaN(qtd) || qtd <= 0 || isNaN(duracao) || duracao <= 0 || !dataCompra) {
    return null;
  }

  const totalDias = qtd * duracao;
  const dataTermino = calcularDataTermino(dataCompra, totalDias);

  // Formata para DD/MM/YYYY (padrão brasileiro)
  const [year, month, day] = dataTermino.split('-');
  return `${day}/${month}/${year}`;
}
