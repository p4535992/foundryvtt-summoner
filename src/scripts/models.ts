import { TokenData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

export interface SummonOptions {
  setSpellBonuses?: boolean;
  polymorph?: { name?: string };
  // Added form 4535992
  shownumberdialog? : boolean; //uses defaultnumber
  defaultnumber? : string; //nuber of creatures to spawn if shownumberdialog = false
  onlyonecreature? : boolean; //set to true to skip chose creature dialog and use creatures[0] as the creature
  creatures? : Array<string>; /*populate with creatures names (must match actor name) ["aaa","bbb","ccc",...]*/
  usespelltemplate? : boolean;
  filterforfolder? : boolean;
  folderId? : string; // id of the folder where to find the creature
  chosencreature? : string; // name of the creature under the folder retrieve from folderId
}

export interface SummonRequestMessage {
  action: "summon";
  summonerUserId: string;
  summonerActorId: string;
  name: string;
  x: number;
  y: number;
  overrides: Partial<TokenData>;
  options: SummonOptions;

}

export interface DismissRequestMessage {
  action: "dismiss";
  name: string;
  userId: string;
}

export type Message = SummonRequestMessage | DismissRequestMessage;
