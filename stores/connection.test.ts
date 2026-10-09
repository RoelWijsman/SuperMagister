import { beforeEach, describe, expect, it } from "vitest";
import { useConnection, type LinkedAccount } from "./connection";

const daan: LinkedAccount = {
  schoolHost: "voorbeeld.magister.net",
  personId: 1002,
  name: "Daan Visser",
  linkedAt: "2026-10-07T12:00:00.000Z",
};

beforeEach(() => {
  useConnection.setState({ account: null, enrollmentId: null, demo: false });
});

describe("useConnection", () => {
  it("bewaart met welk account je gekoppeld bent", () => {
    expect(useConnection.getState().link(daan)).toEqual({ isNew: true });
    expect(useConnection.getState().account).toEqual(daan);
  });

  it("weet of je opnieuw koppelt met hetzelfde account", () => {
    useConnection.getState().link(daan);
    useConnection.getState().setEnrollment(1011);
    expect(
      useConnection.getState().link({ ...daan, linkedAt: "2026-10-08T08:00:00.000Z" }),
    ).toEqual({ isNew: false });
    // Opnieuw koppelen laat je gekozen schooljaar staan.
    expect(useConnection.getState().enrollmentId).toBe(1011);
    expect(useConnection.getState().link({ ...daan, personId: 2001 })).toEqual({ isNew: true });
    expect(useConnection.getState().enrollmentId).toBeNull();
  });

  it("vergeet alles bij ontkoppelen", () => {
    useConnection.getState().link(daan);
    useConnection.getState().setEnrollment(1011);
    useConnection.getState().unlink();
    expect(useConnection.getState()).toMatchObject({ account: null, enrollmentId: null });
  });

  it("zet de demo aan en uit, en echt koppelen zet hem uit", () => {
    useConnection.getState().startDemo();
    expect(useConnection.getState().demo).toBe(true);
    useConnection.getState().stopDemo();
    expect(useConnection.getState().demo).toBe(false);
    useConnection.getState().startDemo();
    useConnection.getState().link(daan);
    expect(useConnection.getState().demo).toBe(false);
  });

  it("biedt geen demo aan als je al gekoppeld bent", () => {
    useConnection.getState().link(daan);
    useConnection.getState().startDemo();
    expect(useConnection.getState().demo).toBe(false);
  });
});
