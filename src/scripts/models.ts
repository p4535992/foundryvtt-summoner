export interface SummonOptions {
  setSpellBonuses?: boolean;
  polymorph?: { name?: string };
  shownumberdialog : boolean; //uses defaultnumber
  defaultnumber : number; //nuber of creatures to spawn if shownumberdialog = false
  onlyonecreature : boolean; //set to true to skip chose creature dialog and use creatures[0] as the creature
  creatures : Array<string>; /*populate with creatures names (must match actor name) ["aaa","bbb","ccc",...]*/
  usespelltemplate : boolean;
  filterforfolder : boolean;
  folderId : string;
}

export interface SummonRequestMessage {
  action: "summon";
  summonerUserId: string;
  summonerActorId: string;
  name: string;
  x: number;
  y: number;
  overrides: Partial<Token.Data>;
  options: SummonOptions;

}

export interface DismissRequestMessage {
  action: "dismiss";
  name: string;
  userId: string;
}

export type Message = SummonRequestMessage | DismissRequestMessage;
