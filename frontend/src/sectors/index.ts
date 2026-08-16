import { ClimateBlock } from "./climate";
import { ReadingsBlock } from "./readings";
import { SettingsBlock } from "./settings";
import type { Block } from "../components/block";

/** Material icon per app sector page, used by the sidebar navigation. */
export const SECTOR_ICONS: Record<string, string> = {
  climate: "thermostat",
  readings: "monitoring",
  settings: "settings",
};

export function createBlocks(
  onRefreshReadings: () => void,
): Record<string, Block> {
  return {
    climate: new ClimateBlock(),
    readings: new ReadingsBlock(onRefreshReadings),
    settings: new SettingsBlock(),
  };
}
