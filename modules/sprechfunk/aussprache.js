// Aussprache im Sprechfunk nach ICAO (Anhang 10, Band II).
// Die großgeschriebene Silbe wird betont. Die deutsche Lesehilfe zeigt, wie man es
// als Deutschsprachiger ungefähr spricht – sie ersetzt nicht das Üben mit dem Fluglehrer.

export const BUCHSTABEN = {
  A: { wort: 'Alfa', icao: 'AL-fah', deutsch: 'ÄL-fa' },
  B: { wort: 'Bravo', icao: 'BRAH-voh', deutsch: 'BRA-wo' },
  C: { wort: 'Charlie', icao: 'CHAR-lee', deutsch: 'TSCHAR-li' },
  D: { wort: 'Delta', icao: 'DELL-tah', deutsch: 'DÄLL-ta' },
  E: { wort: 'Echo', icao: 'ECK-oh', deutsch: 'ÄCK-o' },
  F: { wort: 'Foxtrot', icao: 'FOKS-trot', deutsch: 'FOX-trott' },
  G: { wort: 'Golf', icao: 'GOLF', deutsch: 'GOLF' },
  H: { wort: 'Hotel', icao: 'hoh-TELL', deutsch: 'ho-TÄLL' },
  I: { wort: 'India', icao: 'IN-dee-ah', deutsch: 'IN-di-a' },
  J: { wort: 'Juliett', icao: 'JEW-lee-ett', deutsch: 'DSCHU-li-ätt' },
  K: { wort: 'Kilo', icao: 'KEY-loh', deutsch: 'KI-lo' },
  L: { wort: 'Lima', icao: 'LEE-mah', deutsch: 'LI-ma' },
  M: { wort: 'Mike', icao: 'MIKE', deutsch: 'MEIK' },
  N: { wort: 'November', icao: 'no-VEM-ber', deutsch: 'no-WÄMM-ber' },
  O: { wort: 'Oscar', icao: 'OSS-cah', deutsch: 'OSS-ka' },
  P: { wort: 'Papa', icao: 'pah-PAH', deutsch: 'pa-PA' },
  Q: { wort: 'Quebec', icao: 'keh-BECK', deutsch: 'ke-BÄCK' },
  R: { wort: 'Romeo', icao: 'ROW-me-oh', deutsch: 'RO-mi-o' },
  S: { wort: 'Sierra', icao: 'see-AIR-rah', deutsch: 'si-ÄR-ra' },
  T: { wort: 'Tango', icao: 'TANG-go', deutsch: 'TÄNG-go' },
  U: { wort: 'Uniform', icao: 'YOU-nee-form', deutsch: 'JU-ni-form' },
  V: { wort: 'Victor', icao: 'VIK-tah', deutsch: 'WICK-ta' },
  W: { wort: 'Whiskey', icao: 'WISS-key', deutsch: 'WISS-ki' },
  X: { wort: 'X-ray', icao: 'ECKS-ray', deutsch: 'ÄCKS-reh' },
  Y: { wort: 'Yankee', icao: 'YANG-key', deutsch: 'JÄNG-ki' },
  Z: { wort: 'Zulu', icao: 'ZOO-loo', deutsch: 'SU-lu' },
};

/** Englische Zahlwörter im Sprechfunk mit ICAO-Aussprache. */
export const WOERTER = {
  zero: { icao: 'ZE-ro', deutsch: 'SI-ro' },
  one: { icao: 'WUN', deutsch: 'wann' },
  two: { icao: 'TOO', deutsch: 'tu' },
  three: { icao: 'TREE', deutsch: 'tri' },
  four: { icao: 'FOW-er', deutsch: 'FAU-er' },
  five: { icao: 'FIFE', deutsch: 'faif' },
  six: { icao: 'SIX', deutsch: 'sicks' },
  seven: { icao: 'SEV-en', deutsch: 'SÄW-en' },
  eight: { icao: 'AIT', deutsch: 'eit' },
  niner: { icao: 'NIN-er', deutsch: 'NEI-ner' },
  decimal: { icao: 'DAY-see-mal', deutsch: 'DEH-si-mal' },
  hundred: { icao: 'HUN-dred', deutsch: 'HANN-dred' },
  thousand: { icao: 'TOU-sand', deutsch: 'TAU-send' },
};

/** Ziffern im deutschen Sprechfunk („zwo“ statt „zwei“, damit es nicht wie „drei“ klingt). */
export const ZIFFERN_DEUTSCH = ['null', 'eins', 'zwo', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
export const ZIFFERN_ENGLISCH = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'];

/** Zerlegt einen gesprochenen englischen Satz in Wörter mit Aussprache (falls bekannt). */
export function satzAussprache(satz) {
  return satz.split(' ').map((wort) => ({ wort, ...(WOERTER[wort] ?? {}) }));
}
