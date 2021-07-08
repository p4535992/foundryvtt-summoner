import { Message } from './models';
import { warn, error, debug, log, i18n } from "../main";
import { MODULE_NAME, SOCKET_NAME } from "./settings";
import { receiveMessage } from './summoner';

export let readyHooks = async () => {

  log("Initializing...");
  game.socket.on(SOCKET_NAME, receiveMessage);

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
