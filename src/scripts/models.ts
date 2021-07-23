import { TokenData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

export class SummonOptions {
  setSpellBonuses?: boolean;
  polymorph?: { name?: string };

  // ADDED 4535992
  shownumberdialog? : boolean; //uses defaultnumber
  defaultnumber? : string; //nuber of creatures to spawn if shownumberdialog = false
  onlyonecreature? : boolean; //set to true to skip chose creature dialog and use creatures[0] as the creature
  creatures? : Array<string>; /*populate with creatures names (must match actor name) ["aaa","bbb","ccc",...]*/
  usespelltemplate? : boolean;
  filterforfolder? : boolean;
  folderId? : string; // id of the folder where to find the creature
  chosencreature? : string; // name of the creature under the folder retrieve from folderId,

  summonerItem?:any;// = item //Both item-macro and midi-qol forward the 'item' symbol
  // summonerActor:Actor;// = item.parent;
  summonerDc?:number = 8;// = summonerActor.data.data.attributes.spelldc;
  summonerSpellAttackMod?:number = 0;// = summonerDc - 8; //assumes no bonus to spellDC or spell attack bonus
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
