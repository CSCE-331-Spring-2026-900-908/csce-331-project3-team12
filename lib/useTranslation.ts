"use client";

import { useState } from "react";
import { translations, Lang } from "./translations";

export function useTranslation(defaultLang: Lang = "en") {
  const [lang, setLang] = useState<Lang>(defaultLang);

  function t(key: keyof typeof translations["en"]) {
    return translations[lang][key] ?? key;
  }

  return {
    lang,
    setLang,
    t,
  };
}