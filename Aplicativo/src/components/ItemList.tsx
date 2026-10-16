import { useEffect, useState } from 'react';
import { deleteItem, fetchItens } from '../services/itensService';
import type { Item } from '../types/database';
import type { FeedbackType } from './FeedbackPopup';
import './ItemList.css';

/** Status de proximidade do término de um item. */
export type ItemStatus = 'normal' | 'atencao' | 'critico';

interface ItemListProps {
  /** Incrementa quando a lista precisa ser recarregada (ex.: após adicionar item). */
  refreshKey?: number;
  /** Callback para exibir feedback visual (sucesso/erro) no pop-up global. */
  onFeedback?: (message: string, type: FeedbackType) => void;
}

/**
 * Componente de listagem de itens do estoque.
 *
 * Busca os itens via `fetchItens()` (protegido por RLS) e renderiza
 * cada item com indicação visual baseada na proximidade do término:
 * - **Normal**: data de término confortável (> 5 dias)
 * - **Atenção**: término em 1–5 dias
 * - **Crítico**: término hoje ou já ultrapassado
 */
export function ItemList({ refreshKey = 0, onFeedback }: ItemListProps) {
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<Item | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchItens();
        if (!cancelled) setItens(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar itens.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleConfirmDelete(itemId: string) {
    setDeletingId(itemId);
    try {
      await deleteItem(itemId);
      setItens((prev) => prev.filter((item) => item.id !== itemId));
      setItemParaExcluir(null);
      onFeedback?.('Alterações salvas com sucesso!', 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível excluir o item.';
      setItemParaExcluir(null);
      onFeedback?.(message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="item-list-status">
        <div className="spinner" />
      </div>
    );
  }

  // ── Erro ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className="item-list-status">
        <p className="item-list-error">Não foi possível carregar o estoque.</p>
        <p className="item-list-error-detail">{error}</p>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────
  if (itens.length === 0) {
    return (
      <div className="item-list-status">
        <p className="item-list-empty-icon">📦</p>
        <p className="item-list-empty">Nenhum item cadastrado.</p>
        <p className="item-list-empty-hint">Use o formulário acima para adicionar seu primeiro item.</p>
      </div>
    );
  }

  // ── Lista ────────────────────────────────────────────────
  return (
    <div className="item-list">
      <h2 className="item-list-title">
        Meu Estoque
        <span className="item-list-count">{itens.length}</span>
      </h2>

      <ul className="item-list-items">
        {itens.map((item) => {
          const status = getItemStatus(item.data_estimada_termino);
          const diasRestantes = getDiasRestantes(item.data_estimada_termino);

          return (
            <li key={item.id} className={`item-card item-${status}`}>
              <div className="item-card-top">
                <span className="item-nome">{item.nome}</span>
                <div className="item-card-actions">
                  <StatusBadge status={status} diasRestantes={diasRestantes} />
                  <button
                    type="button"
                    className="item-delete-btn"
                    onClick={() => setItemParaExcluir(item)}
                    disabled={deletingId === item.id}
                    title="Excluir item"
                    aria-label={`Excluir ${item.nome}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="item-card-details">
                <Detail label="Qtd" value={String(item.quantidade)} />
                <Detail
                  label="Duração/un"
                  value={item.duracao_dias_unidade ? `${item.duracao_dias_unidade}d` : '—'}
                />
                <Detail
                  label="Compra"
                  value={formatDateBR(item.data_compra)}
                />
                <Detail
                  label="Término"
                  value={formatDateBR(item.data_estimada_termino)}
                  highlight={status !== 'normal'}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {itemParaExcluir && (
        <div
          className="item-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div className="item-confirm-modal">
            <h3 id="confirm-delete-title" className="item-confirm-title">
              Excluir item
            </h3>
            <p className="item-confirm-text">
              Deseja realmente remover <strong>{itemParaExcluir.nome}</strong> do estoque?
            </p>
            <div className="item-confirm-buttons">
              <button
                type="button"
                className="item-confirm-cancel"
                onClick={() => setItemParaExcluir(null)}
                disabled={deletingId !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="item-confirm-delete"
                onClick={() => handleConfirmDelete(itemParaExcluir.id)}
                disabled={deletingId !== null}
              >
                {deletingId === itemParaExcluir.id ? (
                  <span className="spinner-small" />
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponentes internos ────────────────────────────────────────

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="item-detail">
      <span className="item-detail-label">{label}</span>
      <span className={`item-detail-value ${highlight ? 'item-detail-highlight' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status, diasRestantes }: { status: ItemStatus; diasRestantes: number | null }) {
  if (status === 'normal') return null;

  const text = status === 'critico'
    ? (diasRestantes !== null && diasRestantes < 0 ? 'Vencido' : 'Hoje')
    : `${diasRestantes}d restantes`;

  return (
    <span className={`item-badge item-badge-${status}`}>
      {text}
    </span>
  );
}

// ── Funções utilitárias ────────────────────────────────────────────

/**
 * Determina o status visual de um item com base na data estimada de término.
 *
 * - **critico**: data ultrapassada ou é hoje (≤ 0 dias)
 * - **atencao**: faltam 1 a 5 dias
 * - **normal**: faltam mais de 5 dias, ou data não informada
 */
export function getItemStatus(dataEstimadaTermino: string | null): ItemStatus {
  const dias = getDiasRestantes(dataEstimadaTermino);
  if (dias === null) return 'normal';
  if (dias <= 0) return 'critico';
  if (dias <= 5) return 'atencao';
  return 'normal';
}

/**
 * Calcula quantos dias faltam até a data estimada de término.
 * Retorna `null` se a data não estiver definida.
 * Valor negativo = já venceu.
 */
export function getDiasRestantes(dataEstimadaTermino: string | null): number | null {
  if (!dataEstimadaTermino) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const termino = new Date(dataEstimadaTermino + 'T00:00:00');
  const diffMs = termino.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formata uma data ISO (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY).
 */
function formatDateBR(date: string | null): string {
  if (!date) return '—';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
