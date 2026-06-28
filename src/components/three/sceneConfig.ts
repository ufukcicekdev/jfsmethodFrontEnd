import { MODEL_CENTER_Y } from "./HumanBodyModel";

export const ORBIT_TARGET: [number, number, number] = [0, MODEL_CENTER_Y, 0];

export const TWIN_CAMERA = {
  position: [0, MODEL_CENTER_Y, 4.2] as [number, number, number],
  fov: 32,
};

export const HERO_CAMERA = {
  position: [0, MODEL_CENTER_Y, 5] as [number, number, number],
  fov: 30,
};
