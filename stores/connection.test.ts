import { beforeEach, describe, expect, it } from "vitest";
import { activeView, useConnection, type LinkedAccount } from "./connection";

const daan: LinkedAccount = {
  schoolHost: "voorbeeld.magister.net",
  personId: 1002,
  name: "Daan Visser",
  linkedAt: "2026-10-07T12:00:00.000Z",
};

beforeEach(() => {
  useConnection.setState({ account: null, view: "demo", enrollmentId: null });
});

describe("useConnection", () => {
  it("toont na koppelen meteen je eigen Magister", () => {
    expect(useConnection.getState().link(daan)).toEqual({ isNew: true });
    expect(useConnection.getState()).toMatchObject({ account: daan, view: "magister" });
  });

  it("weet of je opnieuw koppelt met hetzelfde account", () => {
    useConnection.getState().link(daan);
    useConnection.getState().setEnrollment(1011);
    expect(
      useConnection.getState().link({ ...daan, linkedAt: "2026-10-08T08:00:00.000Z" }),
    ).toEqual({
      isNew: false,
    });
    // Opnieuw koppelen laat je gekozen schooljaar staan.
    expect(useConnection.getState().enrollmentId).toBe(1011);
    expect(useConnection.getState().link({ ...daan, personId: 2001 })).toEqual({ isNew: true });
    expect(useConnection.getState().enrollmentId).toBeNull();
  });

  it("wisselt alleen naar Magister als je gekoppeld bent", () => {
    useConnection.getState().setView("magister");
    expect(activeView(useConnection.getState())).toBe("demo");
    useConnection.getState().link(daan);
    useConnection.getState().setView("demo");
    expect(activeView(useConnection.getState())).toBe("demo");
    useConnection.getState().setView("magister");
    expect(activeView(useConnection.getState())).toBe("magister");
  });

  it("vergeet alles bij ontkoppelen", () => {
    useConnection.getState().link(daan);
    useConnection.getState().setEnrollment(1011);
    useConnection.getState().unlink();
    expect(useConnection.getState()).toMatchObject({
      account: null,
      view: "demo",
      enrollmentId: null,
    });
  });
});
