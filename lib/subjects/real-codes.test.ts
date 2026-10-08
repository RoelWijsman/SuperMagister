import { describe, expect, it } from "vitest";
import vakken2526 from "@/lib/magister/__fixtures__/vakken-2526.json";
import vakken from "@/lib/magister/__fixtures__/vakken.json";
import { isCalculatedSubject } from "@/lib/magister/parse/subjects";
import { matchSubjectInfo } from "./catalog";

/** Alle vakken uit de echte (geanonimiseerde) Magister-voorbeelden, zonder rekenvakken. */
const realSubjects = [...vakken, ...vakken2526]
  .filter((v) => !isCalculatedSubject(v.omschrijving))
  .map((v) => ({ code: v.afkorting, name: v.omschrijving }))
  .filter((v, i, all) => all.findIndex((w) => w.code === v.code) === i);

describe("vakken met echte Magister-codes", () => {
  it.each(realSubjects)("$code ($name) krijgt een eigen icoon", ({ code, name }) => {
    expect(matchSubjectInfo(code, name).key).not.toBe("overig");
  });

  it("geeft een onbekend vak een nette standaard", () => {
    expect(matchSubjectInfo("xyz", "Iets heel nieuws")).toMatchObject({
      key: "overig",
      icon: "BookText",
    });
  });
});
