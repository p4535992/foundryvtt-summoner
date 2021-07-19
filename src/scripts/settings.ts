import { debug, log, setDebugLevel, warn, i18n } from '../main';

export const SUMMONER_MODULE_NAME = "summoner";
export const SUMMONER_SOCKET_NAME = "module.summoner";
export const SUMMONER_SUMMON_COMPLETE_FLAG = "summoningComplete";

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
 export function getCanvas(): Canvas {
  if (!(canvas instanceof Canvas) || !canvas.ready) {
      throw new Error("Canvas Is Not Initialized");
  }
  return canvas;
}

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
 export function getGame(): Game {
  if (!(game instanceof Game)) {
      throw new Error("Canvas Is Not Initialized");
  }
  return game;
}

export const registerSettings = function () {

  getGame().settings.register(SUMMONER_MODULE_NAME, "debug", {
    name: "Debug",
    hint: "",
    scope: "client",
    default: false,
    type: Boolean,
    config: true,
  });

  getGame().settings.register(SUMMONER_MODULE_NAME, "folder", {
    name: "Summoner Folder",
    hint: "Name of the Summoner Folder",
    scope: "client",
    default: "Summons",
    type: String,
    config: true,
  });

}
