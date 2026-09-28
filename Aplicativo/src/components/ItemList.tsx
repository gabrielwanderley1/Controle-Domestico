import { useEffect, useState } from 'react';
import { fetchItens } from '../services/itensService';
import type { Item } from '../types/database';
import './ItemList.css';

/** Status de proximidade do término de um item. */
export type ItemStatus = 'normal' | 'atencao' | 'critico';

interface ItemListProps {
  /** Incrementa quando a lista precisa ser recarregada (ex.: após adicionar item). */
  refreshKey?: number;
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
export function ItemList({ refreshKey = 0 }: ItemListProps) {
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                <StatusBadge status={status} diasRestantes={diasRestantes} />
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
