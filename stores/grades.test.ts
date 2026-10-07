import { beforeEach, describe, expect, it } from "vitest";
import { NORM_PRESETS } from "@/lib/calc/promotion";
import { activeNorms, useGradesStore } from "./grades";

beforeEach(() => {
  useGradesStore.setState({ presetId: null, custom: null, combination: {}, tab: "vakken" });
});

describe("useGradesStore", () => {
  it("kiest automatisch de slaag-zakregeling in een examenklas", () => {
    const state = useGradesStore.getState();
    expect(activeNorms(state, true).presetId).toBe("examen");
    expect(activeNorms(state, false)).toEqual({
      presetId: "standaard",
      norms: NORM_PRESETS.standaard.norms,
      isCustom: false,
    });
  });

  it("past één norm aan bovenop de preset, en zet hem ook weer terug", () => {
    const { setPreset, setNorm } = useGradesStore.getState();
    setPreset("streng");
    const base = activeNorms(useGradesStore.getState(), false).norms;
    setNorm(base, "maxPoints", 3);
    const active = activeNorms(useGradesStore.getState(), false);
    expect(active).toMatchObject({ presetId: "streng", isCustom: true });
    expect(active.norms).toEqual({ ...NORM_PRESETS.streng.norms, maxPoints: 3 });
    useGradesStore.getState().resetNorms();
    expect(activeNorms(useGradesStore.getState(), false).isCustom).toBe(false);
  });

  it("onthoudt het combinatiecijfer per databron", () => {
    const { setCombination } = useGradesStore.getState();
    setCombination("demo", ["maat", "pws"]);
    setCombination("echt", ["maat"]);
    setCombination("demo", ["pws"]);
    expect(useGradesStore.getState().combination).toEqual({ demo: ["pws"], echt: ["maat"] });
  });
});
