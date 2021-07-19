import { Message } from './models';
import { warn, error, debug, log, i18n } from "../main";
import { getGame, SUMMONER_MODULE_NAME, SUMMONER_SOCKET_NAME } from "./settings";
import { receiveMessage } from './summoner';

export let readyHooks = async () => {

  log("Initializing...");
  getGame().socket?.on(SUMMONER_SOCKET_NAME, receiveMessage);

  (window as any).Summoner = {
    placeAndSummon: {},
    placeAndSummonFromSpell: {},
    placeAndSummonPolymorphed: {},
    dismiss: false
  };

  log("Initialized");
}

export const setupHooks = async () => {

  // setup all the hooks


}

export const initHooks = () => {
  warn("Init Hooks processing");

}
