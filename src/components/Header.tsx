import type { Language } from "../types";

type HeaderProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  title: string;
  tagline: string;
  languageLabel: string;
};

export function Header({
  language,
  onLanguageChange,
  title,
  tagline,
  languageLabel,
}: HeaderProps) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">Temporal clock</p>
        <h1>{title}</h1>
        <p className="tagline">{tagline}</p>
      </div>
      <label className="language-switch">
        <span>{languageLabel}</span>
        <select value={language} onChange={(event) => onLanguageChange(event.target.value as Language)}>
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
      </label>
    </header>
  );
}
