import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardFilters } from "./components/collection/CardFilters";
import { CardGrid } from "./components/collection/CardGrid";
import { CategoryTabs } from "./components/collection/CategoryTabs";
import { CollectionSummary } from "./components/collection/CollectionSummary";
import { SearchInput } from "./components/collection/SearchInput";
import { CollectionImportExport } from "./components/exchange/CollectionImportExport";
import { ExchangeGenerator } from "./components/exchange/ExchangeGenerator";
import { TradeComparison } from "./components/exchange/TradeComparison";
import { PageContainer } from "./components/layout/PageContainer";
import { Button } from "./components/ui/Button";
import { Modal } from "./components/ui/Modal";
import { Toast } from "./components/ui/Toast";
import { ActiveAccountSelector } from "./components/profile/ActiveAccountSelector";
import { cards } from "./data/cards";
import { categories } from "./data/categories";
import type { SyncedCollection } from "./hooks/useSyncedCollection";
import type { ClashAccountsState } from "./hooks/useClashAccounts";
import { generateExchangeText } from "./services/exchangeTextGenerator";
import type { CardCategory } from "./types/card";
import type { CardFilter } from "./types/collection";
import { normalizeText } from "./utils/normalizeText";
import { cardSearchText } from "./utils/localizedCatalog";

interface CollectionPageProps {
  tracker: SyncedCollection;
  transferOpen: boolean;
  setTransferOpen: (open: boolean) => void;
  accountsState: ClashAccountsState;
}

export default function App({ tracker, transferOpen, setTransferOpen, accountsState }: CollectionPageProps) {
  const { t, i18n } = useTranslation(["collection", "exchange", "common"]);
  const {
    collection,
    summary,
    toggleOwned,
    changeDuplicates,
    setPreference,
    replaceCollection,
    clearCollection,
  } = tracker;
  const [search, setSearch] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const progress = useMemo(() => Object.fromEntries(categories.map((category) => {
    const categoryCards = cards.filter((card) => card.category === category.id);
    return [category.id, {
      total: categoryCards.length,
      owned: categoryCards.filter((card) => collection.cards[card.id]?.owned).length,
    }];
  })) as Record<CardCategory, { owned: number; total: number }>, [collection.cards]);

  const filterCounts = useMemo<Record<CardFilter, number>>(() => {
    const categoryCards = collection.preferences.category === "all"
      ? cards
      : cards.filter((card) => card.category === collection.preferences.category);
    return {
      all: categoryCards.length,
      owned: categoryCards.filter((card) => collection.cards[card.id]?.owned).length,
      missing: categoryCards.filter((card) => !collection.cards[card.id]?.owned).length,
      duplicates: categoryCards.filter((card) => (collection.cards[card.id]?.duplicates ?? 0) > 0).length,
    };
  }, [collection.cards, collection.preferences.category]);

  const visibleCards = useMemo(() => cards
    .filter((card) => collection.preferences.category === "all" || card.category === collection.preferences.category)
    .filter((card) => !search || normalizeText(cardSearchText(card)).includes(normalizeText(search.trim())))
    .filter((card) => {
      const state = collection.cards[card.id];
      if (collection.preferences.filter === "owned") return state?.owned;
      if (collection.preferences.filter === "missing") return !state?.owned;
      if (collection.preferences.filter === "duplicates") return (state?.duplicates ?? 0) > 0;
      return true;
    })
    .sort((a, b) => {
      const categoryDifference = categories.findIndex((item) => item.id === a.category)
        - categories.findIndex((item) => item.id === b.category);
      return categoryDifference || a.order - b.order;
    }), [collection.cards, collection.preferences, search]);

  const exchangeText = useMemo(() => generateExchangeText(cards, collection, i18n.language, accountsState.activeAccount), [accountsState.activeAccount, collection, i18n.language]);
  const transferableCollection = useMemo(() => accountsState.activeAccount ? { ...collection, playerName: `${accountsState.activeAccount.accountLabel} · ${accountsState.activeAccount.clashNickname} · ${accountsState.activeAccount.clashPlayerTag}` } : collection, [accountsState.activeAccount, collection]);
  const notify = (message: string) => setToast(message);
  const handleToggle = (cardId: string) => {
    const state = collection.cards[cardId];
    if (state?.owned && state.duplicates > 0) {
      notify(t("collection:toastOwnedDuplicate"));
      return;
    }
    toggleOwned(cardId);
  };

  return (
    <div className="min-h-screen">
      <PageContainer>
        <div className="space-y-5 pt-5 sm:space-y-7 sm:pt-7">
          <ActiveAccountSelector state={accountsState} />
          <CollectionSummary summary={summary} progress={progress} />

          <section aria-labelledby="cards-title">
            <div className="mb-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">{t("collection:cards.eyebrow")}</p>
                  <h2 id="cards-title" className="font-display text-2xl text-white sm:text-3xl">{t("collection:cards.title")}</h2>
                </div>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-black text-stone-400">{t("collection:cards.shown", { count: visibleCards.length })}</span>
              </div>
              <CategoryTabs value={collection.preferences.category} progress={progress} totalOwned={summary.collected} total={summary.total} onChange={(value) => setPreference("category", value)} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchInput value={search} onChange={setSearch} />
                <CardFilters value={collection.preferences.filter} counts={filterCounts} onChange={(value) => setPreference("filter", value)} />
              </div>
            </div>
            <CardGrid
              cards={visibleCards}
              getState={(id) => collection.cards[id] ?? { owned: false, duplicates: 0 }}
              onToggle={handleToggle}
              onDuplicatesChange={changeDuplicates}
            />
          </section>

          <ExchangeGenerator text={exchangeText} onNotify={notify} />
          <TradeComparison mine={collection} />
        </div>
      </PageContainer>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title={t("exchange:transfer.title")} description={t("exchange:transfer.description")}>
        <CollectionImportExport collection={transferableCollection} onImport={(next) => { replaceCollection(accountsState.activeAccount ? { ...next, playerName: accountsState.activeAccount.clashNickname } : next); setTransferOpen(false); }} onNotify={notify} onRequestClear={() => setClearOpen(true)} />
      </Modal>

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title={t("collection:clear.title")} description={t("collection:clear.description")}>
        <div className="rounded-2xl border border-red-400/15 bg-red-400/7 p-4 text-sm leading-relaxed text-red-100">{t("collection:clear.warning")}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setClearOpen(false)}>{t("common:actions.cancel")}</Button>
          <Button variant="danger" onClick={() => { clearCollection(); setSearch(""); setClearOpen(false); setTransferOpen(false); notify(t("collection:clear.success")); }}>{t("collection:clear.confirm")}</Button>
        </div>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
