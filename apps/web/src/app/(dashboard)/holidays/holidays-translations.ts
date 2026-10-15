const HOLIDAY_TRANSLATIONS: Record<string, string> = {
  "New Year's Day": "Nowy Rok",
  Epiphany: "Trzech Króli",
  "Easter Sunday": "Wielkanoc (Niedziela Wielkanocna)",
  "Easter Monday": "Poniedziałek Wielkanocny",
  "May Day": "Święto Pracy",
  "Constitution Day": "Święto Konstytucji 3 Maja",
  Pentecost: "Zielone Świątki",
  "Corpus Christi": "Boże Ciało",
  "Assumption Day": "Wniebowzięcie NMP",
  "All Saints' Day": "Wszystkich Świętych",
  "Independence Day": "Narodowe Święto Niepodległości",
  "Christmas Eve": "Wigilia Bożego Narodzenia",
  "Christmas Day": "Boże Narodzenie (pierwszy dzień)",
  "St. Stephen's Day": "Boże Narodzenie (drugi dzień)",
};

export const polishName = (englishName: string) =>
  HOLIDAY_TRANSLATIONS[englishName] || englishName;
