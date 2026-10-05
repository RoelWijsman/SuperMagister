import { describe, expect, it } from "vitest";
import { findSubjectInText, matchSubjectInfo } from "./catalog";

describe("matchSubjectInfo", () => {
  it.each([
    ["wisA", "Wiskunde A", "Sigma", "exact", true],
    ["biol", "Biologie", "Leaf", "exact", false],
    ["ak", "Aardrijkskunde", "Globe", "mens-maatschappij", false],
    ["netl", "Nederlandse taal", "BookOpen", "talen", true],
    ["entl", "Engelse taal", "MessagesSquare", "talen", true],
    ["fatl", "Franse taal", "Croissant", "talen", false],
    ["schk", "Scheikunde", "FlaskConical", "exact", false],
    ["lo", "Lichamelijke opvoeding", "Dumbbell", "bewegen", false],
    ["ckv", "CKV", "Theater", "kunst-cultuur", false],
    ["mentor", "Mentoruur", "Compass", "overig", false],
  ] as const)("%s (%s) → %s", (code, name, icon, group, isCore) => {
    const info = matchSubjectInfo(code, name);
    expect(info.icon).toBe(icon);
    expect(info.group).toBe(group);
    expect(info.isCore).toBe(isCore);
  });

  it("recognises a subject from its code alone", () => {
    expect(matchSubjectInfo("gs").icon).toBe("Landmark");
  });

  it("falls back to a neutral entry for unknown subjects", () => {
    const info = matchSubjectInfo("xyz", "Onbekend vak");
    expect(info.icon).toBe("BookText");
    expect(info.group).toBe("overig");
  });
});

describe("findSubjectInText", () => {
  const subjects = [
    { id: "wisa", code: "wisA", name: "Wiskunde A" },
    { id: "nat", code: "nat", name: "Natuurkunde" },
    { id: "ne", code: "ne", name: "Nederlands" },
    { id: "en", code: "en", name: "Engels" },
  ];

  it("finds a subject by its full name", () => {
    expect(findSubjectInText("wat moet ik halen voor natuurkunde", subjects)).toBe("nat");
  });

  it("finds a subject by a common alias", () => {
    expect(findSubjectInText("wat moet ik halen voor wiskunde", subjects)).toBe("wisa");
    expect(findSubjectInText("halen wis", subjects)).toBe("wisa");
  });

  it("does not match short codes inside other words", () => {
    // "en" en "ne" zitten in veel woorden; alleen hele woorden tellen.
    expect(findSubjectInText("wat moet ik halen", subjects)).toBeNull();
  });

  it("matches a short code as a whole word", () => {
    expect(findSubjectInText("cijfers en", subjects)).toBe("en");
  });
});
