import authEn from "./locales/en/auth";
import cardsEn from "./locales/en/cards";
import collectionEn from "./locales/en/collection";
import commonEn from "./locales/en/common";
import communityEn from "./locales/en/community";
import errorsEn from "./locales/en/errors";
import exchangeEn from "./locales/en/exchange";
import profileEn from "./locales/en/profile";
import authPtBr from "./locales/pt-BR/auth";
import cardsPtBr from "./locales/pt-BR/cards";
import collectionPtBr from "./locales/pt-BR/collection";
import commonPtBr from "./locales/pt-BR/common";
import communityPtBr from "./locales/pt-BR/community";
import errorsPtBr from "./locales/pt-BR/errors";
import exchangePtBr from "./locales/pt-BR/exchange";
import profilePtBr from "./locales/pt-BR/profile";

export const resources = {
  "pt-BR": { common: commonPtBr, auth: authPtBr, collection: collectionPtBr, community: communityPtBr, profile: profilePtBr, exchange: exchangePtBr, errors: errorsPtBr, cards: cardsPtBr },
  en: { common: commonEn, auth: authEn, collection: collectionEn, community: communityEn, profile: profileEn, exchange: exchangeEn, errors: errorsEn, cards: cardsEn },
} as const;

export const namespaces = ["common", "auth", "collection", "community", "profile", "exchange", "errors", "cards"] as const;
