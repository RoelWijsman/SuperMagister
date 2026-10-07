/*
 * Maakt van een echte Magister-export (scripts/verzamel-magister.js) geanonimiseerde
 * testbestanden in lib/magister/__fixtures__. Namen, docenten, lokalen, id's,
 * omschrijvingen en huiswerkteksten worden nepwaarden; de VORM blijft precies gelijk.
 *
 *   node scripts/anonimiseer-magister.mjs <export.json> [<export2.json> …]
 *
 * Meerdere exports worden samengevoegd (latere winnen bij dezelfde naam).
 * Cijfers krijgen per vak een vaste, geheime verschuiving (een veelvoud van 0,1):
 * zo zijn ze nep, maar blijven Magisters gemiddelden precies kloppen met de
 * nepcijfers, en kunnen de tests onze berekening daartegen controleren.
 *
 * Daarna controleert het script zelf dat geen enkele echte waarde in de
 * testbestanden is achtergebleven. De ruwe export blijft in magister-voorbeelden/
 * (staat in .gitignore) en gaat nooit in git.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Gebruik: node scripts/anonimiseer-magister.mjs <export.json> [<export2.json> …]");
  process.exit(1);
}
const exported = inputs
  .map((file) => JSON.parse(readFileSync(file, "utf8")))
  .reduce((all, next) => ({ ...next, data: { ...all.data, ...next.data } }));
const OUT = join("lib", "magister", "__fixtures__");
const FAKE_HOST = "voorbeeld.magister.net";
const realHost = exported.rapport.school;
const schoolLabel = realHost.split(".")[0];

// ——— Vaste vervangingen ————————————————————————————————————————————————————
const ids = new Map();
const fakeId = (n) => {
  if (typeof n !== "number" || n <= 0) return n;
  if (!ids.has(n)) ids.set(n, 1001 + ids.size);
  return ids.get(n);
};
const mapper = (prefix, make) => {
  const map = new Map();
  return (value) => {
    if (value === null || value === undefined || value === "") return value;
    const key = String(value).toLowerCase();
    if (!map.has(key)) map.set(key, make(map.size, prefix));
    return map.get(key);
  };
};
const letter = (i) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : "");
const teacherCode = mapper("DOC", (i) => `DC${letter(i)}${letter(i + 7)}`);
const teacherName = mapper("Docent", (i) => `Docent ${letter(i)}`);
const room = mapper("R", (i) => `R${101 + i}`);
const replaceDigits = (text) =>
  String(text).replace(/\d{4,}/g, (digits) => String(fakeId(Number(digits))));

// Alles wat echt is en NIET in de fixtures mag staan, voor de controle achteraf.
const secrets = new Set([schoolLabel]);
const remember = (value) => {
  if (typeof value === "string" && value.trim().length >= 4) secrets.add(value.trim());
};

const HOMEWORK = "<p>Maak opgave 3 t/m 7 van § 2.4.<br>Neem je rekenmachine mee.</p>";
const INFO = "<p>Informatie over deze activiteit. <strong>Neem je pas mee.</strong></p>";

// ——— Per soort object ————————————————————————————————————————————————————
function anonymize(value, context = {}) {
  if (Array.isArray(value)) return value.map((item) => anonymize(item, context));
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    const k = key.toLowerCase();
    if (raw === null || raw === undefined) {
      out[key] = raw;
    } else if (typeof raw === "number" && /id$/i.test(key) && k !== "uuid") {
      out[key] = fakeId(raw);
    } else if (k === "uuid" || k === "externeid") {
      remember(raw);
      out[key] = `nep-${k}-${fakeId(hash(raw))}`;
    } else if (["roepnaam", "officielevoornamen"].includes(k)) {
      remember(raw);
      out[key] = k === "roepnaam" ? "Daan" : "Daan Pieter";
    } else if (["achternaam", "officieleachternaam", "geboorteachternaam"].includes(k)) {
      remember(raw);
      out[key] = "Visser";
    } else if (k === "voorletters") {
      out[key] = "D.P.";
    } else if (k === "geboortedatum") {
      remember(raw);
      out[key] = "2010-03-14T00:00:00.0000000Z";
    } else if (k === "docentcode") {
      remember(raw);
      out[key] = teacherCode(raw);
    } else if (k === "naam" && context.teacher) {
      remember(raw);
      out[key] = teacherName(raw);
    } else if (["docent", "ingevoerddoor"].includes(k) && typeof raw === "string") {
      remember(raw);
      out[key] = teacherName(raw);
    } else if (k === "lokatie" && typeof raw === "string") {
      out[key] = raw
        .split("|")
        .map((part) => {
          const trimmed = part.trim();
          if (!trimmed || trimmed === "-") return part;
          remember(trimmed);
          return part.replace(trimmed, room(trimmed));
        })
        .join("|");
    } else if (k === "naam" && context.room) {
      remember(raw);
      out[key] = room(raw);
    } else if (k === "inhoud" && typeof raw === "string") {
      remember(raw);
      out[key] = value.InfoType === 6 ? INFO : HOMEWORK;
    } else if (k === "omschrijving" && context.appointment) {
      remember(raw);
      const parts = String(raw).split(" - ");
      if (value.Type === 13 && parts.length === 3) {
        remember(parts[1]);
        remember(parts[2]);
        out[key] = `${parts[0]} - ${teacherCode(parts[1])} - k3a`;
      } else {
        out[key] = value.Type === 101 ? "Markering" : "Schoolactiviteit";
      }
    } else if (
      k === "omschrijving" &&
      context.grade &&
      ["waarde", "kolomId", "CijferStr"].some((name) => name in value)
    ) {
      remember(raw);
      out[key] = "Toets hoofdstuk 2";
    } else if (k === "href" || k === "self") {
      out[key] = replaceDigits(String(raw).replaceAll(realHost, FAKE_HOST));
    } else if (k === "docenten") {
      out[key] = anonymize(raw, { teacher: true });
    } else if (k === "lokalen") {
      out[key] = anonymize(raw, { room: true });
    } else if (k === "afspraak") {
      out[key] = anonymize(raw, { appointment: true });
    } else if (k === "privileges") {
      out[key] = raw.slice(0, 2);
    } else if (typeof raw === "string") {
      out[key] = raw.replaceAll(realHost, FAKE_HOST);
    } else {
      out[key] = anonymize(raw, context);
    }
  }
  return out;
}

function hash(text) {
  let h = 0;
  for (const char of String(text)) h = (h * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(h) + 1;
}

// ——— Kiezen en schrijven —————————————————————————————————————————————————
const data = exported.data;
const items = (d) => (Array.isArray(d) ? d : (d?.Items ?? d?.items ?? []));
const withItems = (d, list) =>
  Array.isArray(d) ? list : { ...d, Items: list, TotalCount: list.length };

/** Uit een lange lijst afspraken: van elke soort (Status/Type/InfoType) er twee. */
function representative(list, keyOf, perKind = 2) {
  const seen = new Map();
  return list.filter((item) => {
    const key = keyOf(item);
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count < perKind;
  });
}

const fixtures = {};
if (data.account) fixtures.account = anonymize(data.account);
/** Klascodes zijn schoolspecifiek ("KV1J"); alleen "HAVO 3"-achtige namen blijven. */
const className = mapper("Klas", (i) => `Klas ${letter(i)}`);
if (data.aanmeldingen) {
  const general = /^(havo|vwo|vmbo|mavo)\s*\d$/i;
  fixtures.aanmeldingen = anonymize({
    ...data.aanmeldingen,
    Items: items(data.aanmeldingen).map((a) => {
      const group = a.Groep?.Omschrijving;
      if (group && !general.test(group)) remember(group);
      return {
        ...a,
        Studie: a.Studie && {
          ...a.Studie,
          Omschrijving: String(a.Studie.Omschrijving ?? "").replace(/^[A-Za-z]+_/, ""),
        },
        Groep: a.Groep && {
          ...a.Groep,
          Omschrijving: group && !general.test(group) ? className(group) : group,
        },
      };
    }),
  });
}
if (data.vakken) fixtures.vakken = anonymize(data.vakken);
if (data.cijferperioden) fixtures.cijferperioden = anonymize(data.cijferperioden);
if (data.laatsteCijfers)
  fixtures["cijfers-laatste"] = anonymize(data.laatsteCijfers, { grade: true });
if (data.cijferoverzicht)
  fixtures.cijferoverzicht = anonymize(data.cijferoverzicht, { grade: true });
if (data.afspraken) {
  const picked = representative(
    items(data.afspraken),
    (a) => `${a.Status}/${a.Type}/${a.InfoType}/${a.DuurtHeleDag}`,
  );
  fixtures.afspraken = withItems(
    data.afspraken,
    picked.map((a) => anonymize(a, { appointment: true })),
  );
}
if (data.roosterwijzigingen)
  fixtures.roosterwijzigingen = withItems(
    data.roosterwijzigingen,
    items(data.roosterwijzigingen).map((a) => anonymize(a, { appointment: true })),
  );
if (data.absenties) {
  const picked = representative(
    items(data.absenties),
    (a) => `${a.Verantwoordingtype}/${a.Code}`,
    1,
  );
  fixtures.absenties = withItems(data.absenties, anonymize(picked));
}
// Versie 2: afspraken uit andere weken (toetsen, handmatig vervallen), alleen
// de soorten die nog niet in afspraken.json zitten. Als laatste, zodat de
// nep-id's van de andere bestanden gelijk blijven.
const extraAppointments = [
  ...items(data.afsprakenVorigJaar ?? []),
  ...items(data.afsprakenVooruit ?? []),
];
if (extraAppointments.length > 0) {
  const kindOf = (a) => `${a.Status}/${a.Type}/${a.InfoType}/${a.DuurtHeleDag}`;
  const known = new Set(items(data.afspraken ?? []).map(kindOf));
  const picked = representative(
    extraAppointments.filter((a) => !known.has(kindOf(a))),
    kindOf,
  );
  fixtures["afspraken-extra"] = {
    Items: picked.map((a) => anonymize(a, { appointment: true })),
    TotalCount: picked.length,
  };
}

// ——— Cijfers (voortgangscijfers, versie 3) ————————————————————————————————
/** Een vaste, geheime verschuiving per vak: een veelvoud van 0,1, binnen 1–10. */
function shiftFor(seed, values, wholeNumbers) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const options = [];
  for (let step = -15; step <= 15; step++) {
    if (Math.abs(step) < 3) continue;
    // Vakken met alleen hele cijfers schuiven in hele stappen.
    if (wholeNumbers && step % 10 !== 0) continue;
    const t = step / 10;
    if (min + t >= 1 && max + t <= 10) options.push(t);
  }
  return options.length ? options[seed % options.length] : null;
}
const isNumericText = (text) => /^\d+(?:[.,]\d+)?$/.test(String(text).trim());
const ROTATE = { O: "V", V: "RV", RV: "G", G: "O" };
const decimalsOf = (text) => (String(text).split(/[.,]/)[1] ?? "").length;

function anonymizeProgress(raw, keep) {
  const list = items(raw).filter((x) => !keep || keep.has(x.kolom?.studievakId));
  const groups = new Map();
  for (const x of list) {
    const id = x.kolom?.studievakId;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(x);
  }
  const out = [];
  let n = 0;
  for (const [studievakId, group] of groups) {
    const graded = (x) =>
      typeof x.cijferGetal === "number" && ["cijfer", "gemiddelde"].includes(x.kolom?.type);
    const numbers = group.filter(graded).map((x) => x.cijferGetal);
    const wholeNumbers = group
      .filter((x) => graded(x) && x.kolom.type === "cijfer" && isNumericText(x.waarde))
      .every((x) => decimalsOf(x.waarde) === 0);
    // Past er geen verschuiving, spiegel dan (11 − cijfer): ook dat houdt gemiddelden kloppend.
    const shift = numbers.length ? shiftFor(hash(String(studievakId)), numbers, wholeNumbers) : 0;
    const fake = (v) => (shift === null ? 11 - v : v + shift);
    for (const x of group) {
      const kolom = x.kolom ?? {};
      let { cijferGetal, waarde, isVoldoende } = x;
      if (graded(x)) {
        cijferGetal = Number(fake(x.cijferGetal).toFixed(Math.max(1, decimalsOf(x.cijferGetal))));
        // Tekst als "RV" of "V" blijft tekst; alleen getallen schuiven mee.
        if (isNumericText(waarde)) {
          waarde = cijferGetal.toFixed(decimalsOf(x.waarde)).replace(".", ",");
          isVoldoende = cijferGetal >= 5.5;
        } else if (typeof waarde === "string" && ROTATE[waarde.toUpperCase()]) {
          // Ook beoordelingen zijn nep: een vaste rondgang O → V → RV → G → O.
          waarde = ROTATE[waarde.toUpperCase()];
          isVoldoende = waarde !== "O";
        }
      } else if (typeof x.cijferGetal === "number") {
        // Tekortpunten (formule, som): nepwaarde.
        cijferGetal = 1;
        waarde = "1,0";
      }
      let omschrijving = kolom.omschrijving;
      if (kolom.type === "cijfer" && omschrijving) {
        remember(omschrijving);
        omschrijving = `Voorbeeldtoets ${++n}`;
      }
      out.push({ ...x, cijferGetal, waarde, isVoldoende, kolom: { ...kolom, omschrijving } });
    }
  }
  return anonymize({ ...raw, items: out, totalCount: out.length });
}

/** De studievak-id's van een paar vakken (op code), voor een klein maar compleet voorbeeld. */
const studyIds = (vakkenRaw, codes) =>
  new Set(
    items(vakkenRaw)
      .filter((v) => codes.includes(String(v.afkorting).toLowerCase()))
      .map((v) => v.studieVakId),
  );
if (data["voortgangscijfers-2627"]) {
  fixtures["cijfers-2627"] = anonymizeProgress(data["voortgangscijfers-2627"], null);
}
if (data["voortgangscijfers-2526"] && data.vakkenVorigJaar) {
  fixtures["vakken-2526"] = anonymize(data.vakkenVorigJaar);
  if (data.cijferperiodenVorigJaar)
    fixtures["cijferperioden-2526"] = anonymize(data.cijferperiodenVorigJaar);
  fixtures["cijfers-2526"] = anonymizeProgress(
    data["voortgangscijfers-2526"],
    studyIds(data.vakkenVorigJaar, ["ak", "ec", "en", "lo", "gem", "tek"]),
  );
}

// ——— Controle: staat er nog iets echts in? ——————————————————————————————————
const personId = data.account?.Persoon?.Id;
if (personId) secrets.add(String(personId));

/** Alle waarden (geen veldnamen) als tekst, om in te zoeken. */
const valuesOf = (value) =>
  Array.isArray(value)
    ? value.flatMap(valuesOf)
    : value && typeof value === "object"
      ? Object.values(value).flatMap(valuesOf)
      : value === null || value === undefined
        ? []
        : [String(value).toLowerCase()];

const leaks = [];
const texts = {};
// Een klein echt id kan toevallig gelijk zijn aan een nep-id; dat is geen lek.
const fakeIds = new Set(ids.values());
const wholeNumber = (v, n) => new RegExp(`(^|\\D)${n}(\\D|$)`).test(v);
for (const [name, fixture] of Object.entries(fixtures)) {
  const values = valuesOf(fixture);
  for (const secret of secrets) {
    if (values.some((v) => v.includes(secret.toLowerCase())))
      leaks.push(`${name}: "${secret.slice(0, 3)}…"`);
  }
  for (const real of ids.keys()) {
    if (real >= 1000 && !fakeIds.has(real) && values.some((v) => wholeNumber(v, real)))
      leaks.push(`${name}: id`);
  }
  texts[name] = JSON.stringify(fixture, null, 2);
}
if (leaks.length === 0) {
  mkdirSync(OUT, { recursive: true });
  for (const [name, text] of Object.entries(texts)) {
    writeFileSync(join(OUT, `${name}.json`), `${text}\n`);
  }
} else {
  console.error("STOP: er staat nog iets echts in (niets weggeschreven):", [...new Set(leaks)]);
  process.exit(1);
}
console.log(`Klaar: ${Object.keys(fixtures).length} geanonimiseerde testbestanden in ${OUT}.`);
