// Aussprache im Sprechfunk. Die Buchstabierwörter und die deutsche Lesehilfe folgen der
// „Bekanntmachung über die Sprechfunkverfahren“ (NfL 2024-1-3266, Nr. 6 und Nr. 11),
// die englische Silbentrennung ICAO Anhang 10, Band II. Die großgeschriebene Silbe wird betont.
// Die Lesehilfe ist eine Annäherung – sie ersetzt nicht das Üben mit dem Fluglehrer.

export const BUCHSTABEN = {
  A: { wort: 'Alfa', icao: 'AL-fah', deutsch: 'AL-fa' },
  B: { wort: 'Bravo', icao: 'BRAH-voh', deutsch: 'BRA-wo' },
  C: { wort: 'Charlie', icao: 'CHAR-lee', deutsch: 'TSCHAHR-li' },
  D: { wort: 'Delta', icao: 'DELL-tah', deutsch: 'DEL-ta' },
  E: { wort: 'Echo', icao: 'ECK-oh', deutsch: 'ECK-o' },
  F: { wort: 'Foxtrot', icao: 'FOKS-trot', deutsch: 'FOX-trot' },
  G: { wort: 'Golf', icao: 'GOLF', deutsch: 'GOLF' },
  H: { wort: 'Hotel', icao: 'hoh-TELL', deutsch: 'ho-TELL' },
  I: { wort: 'India', icao: 'IN-dee-ah', deutsch: 'IN-dja' },
  J: { wort: 'Juliett', icao: 'JEW-lee-ett', deutsch: 'DSCHU-ljett' },
  K: { wort: 'Kilo', icao: 'KEY-loh', deutsch: 'KI-lo' },
  L: { wort: 'Lima', icao: 'LEE-mah', deutsch: 'LI-ma' },
  M: { wort: 'Mike', icao: 'MIKE', deutsch: 'MAIK' },
  N: { wort: 'November', icao: 'no-VEM-ber', deutsch: 'no-WEMM-ba' },
  O: { wort: 'Oscar', icao: 'OSS-cah', deutsch: 'OSS-ka' },
  P: { wort: 'Papa', icao: 'pah-PAH', deutsch: 'pa-PA' },
  Q: { wort: 'Quebec', icao: 'keh-BECK', deutsch: 'ki-BECK' },
  R: { wort: 'Romeo', icao: 'ROW-me-oh', deutsch: 'ROH-mio' },
  S: { wort: 'Sierra', icao: 'see-AIR-rah', deutsch: 'si-ER-ra' },
  T: { wort: 'Tango', icao: 'TANG-go', deutsch: 'TÄN-go' },
  U: { wort: 'Uniform', icao: 'YOU-nee-form', deutsch: 'JU-niform' },
  V: { wort: 'Victor', icao: 'VIK-tah', deutsch: 'WIK-tor' },
  W: { wort: 'Whiskey', icao: 'WISS-key', deutsch: 'WISS-ki' },
  X: { wort: 'X-ray', icao: 'ECKS-ray', deutsch: 'EX-re' },
  Y: { wort: 'Yankee', icao: 'YANG-key', deutsch: 'JÄN-ki' },
  Z: { wort: 'Zulu', icao: 'ZOO-loo', deutsch: 'SU-lu' },
};

/** Englische Zahlwörter im Sprechfunk mit ICAO-Aussprache. */
export const WOERTER = {
  zero: { icao: 'ZE-ro', deutsch: 'SI-ro' },
  one: { icao: 'WUN', deutsch: 'WOAN' },
  two: { icao: 'TOO', deutsch: 'TUH' },
  three: { icao: 'TREE', deutsch: 'TRI' },
  four: { icao: 'FOW-er', deutsch: 'FOHR' },
  five: { icao: 'FIFE', deutsch: 'FEIF' },
  six: { icao: 'SIX', deutsch: 'SIX' },
  seven: { icao: 'SEV-en', deutsch: 'SEW-en' },
  eight: { icao: 'AIT', deutsch: 'ÄIT' },
  niner: { icao: 'NIN-er', deutsch: 'NEIN-er' },
  decimal: { icao: 'DAY-see-mal', deutsch: 'DEH-si-mal' },
  hundred: { icao: 'HUN-dred', deutsch: 'HAN-dred' },
  thousand: { icao: 'TOU-sand', deutsch: 'TAU-sänd' },
};

/** Ziffern im deutschen Sprechfunk („zwo“ statt „zwei“, damit es nicht wie „drei“ klingt). */
export const ZIFFERN_DEUTSCH = ['null', 'eins', 'zwo', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
export const ZIFFERN_ENGLISCH = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'];

/** Zerlegt einen gesprochenen englischen Satz in Wörter mit Aussprache (falls bekannt). */
export function satzAussprache(satz) {
  return satz.split(' ').map((wort) => ({ wort, ...(WOERTER[wort] ?? {}) }));
}
