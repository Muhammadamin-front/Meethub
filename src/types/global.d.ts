import messages from "../../messages/en.json";

/**
 * Gives `useTranslations` / `getTranslations` autocomplete and type-checking
 * for message keys, using the English catalog as the source of truth.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
