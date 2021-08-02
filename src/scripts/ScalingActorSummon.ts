import { SummonOptions } from './models';
import { getCanvas, getGame, SUMMONER_ITEM_MACRO_MODULE_NAME, SUMMONER_MIDI_MODULE_NAME } from './settings';

/**
 * @href https://www.reddit.com/r/FoundryVTT/comments/ml9txh/how_to_create_a_summoned_creature_with/gtqsf3i/?utm_source=share&utm_medium=web2x&context=3
 * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
 * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/ScalingActorSummon.js
 */
export abstract class ScalingActorSummon {

  /* CONFIG */
  protected module:string = SUMMONER_ITEM_MACRO_MODULE_NAME;
  protected summonerItem:any;// = item //Both item-macro and midi-qol forward the 'item' symbol
  protected actorNameToSpawn:string;// = summonerItem.name;
  protected summonerActor:Actor;// = item.parent;
  protected summonerDc:number;// = summonerActor.data.data.attributes.spelldc;
  protected summonerSpellAttackMod:number;// = summonerDc - 8; //assumes no bonus to spellDC or spell attack bonus

  constructor(summonOptions:SummonOptions,moduleIdForLevelSpellCasting?:string){
    this.summonerItem = summonOptions.summonerItem;
    this.actorNameToSpawn = summonOptions.summonerItem.name;
    this.summonerDc = <number>summonOptions.summonerDc;
    this.summonerSpellAttackMod = <number>summonOptions.summonerSpellAttackMod;
    this.summonerActor = summonOptions.summonerItem.parent;
    if(moduleIdForLevelSpellCasting){
      this.module = moduleIdForLevelSpellCasting;
    }
  }

  /**
   * needs to return a plain update object for this specific summoned token
   * Note: this can be an empty object to skip updating the token
  */
  abstract tokenUpdateGenerator(castingLevel:number, summonerActor:Actor, summonedToken:TokenDocument):any;

  /**
   * needs to return a plain update object for this specific summoned actor
   * Note: this can be an empty object to skip updating the actor
   */
  abstract actorUpdateGenerator(castingLevel:number, summonerActor:Actor, summonedToken:TokenDocument):any;

  /**
   * needs to return an array of item updates (including '_id' field)
   * Note: this can be an empty array to skip updating the actor's items
   */
  abstract itemUpdateGenerator(castingLevel:number, summonerActor:Actor, summonedToken:TokenDocument):Record<string, unknown>[];

  /* \CONFIG */

  /* CORE LOGIC */

  async getLevelSpellCasting(){
    /** Get the level of the spell, depending on module used */
    let castingLevel = 0;
    switch (module.id) {
      case SUMMONER_ITEM_MACRO_MODULE_NAME:
          castingLevel = await this.rollItemGetLevel(this.summonerItem);
          break;
      case SUMMONER_MIDI_MODULE_NAME:
          castingLevel = this.summonerItem.spellLevel;
    }
  }

  /**
   * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
   * @param summonItem
   */
  async summonActorFromItem(){
    //const summonItem = mysummoneritem; //'item' defined by Item Macro
    //const actorNameToSpawn = mysummoneritem.name;
    Hooks.once("createMeasuredTemplate", this.deleteTemplatesAndSpawn(this.actorNameToSpawn,null,null));
    await this.summonerItem.roll();
    this.drawTemplatePreview(this.summonerItem,'circle', 3.5);
  }

  /* \CORE LOGIC */

  /* SUPPORTING FUNCTIONS */

  /**
   * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
   * @param item
   * @returns
   */
  async rollItemGetLevel(item){
    const result = await item.roll();
    // extract the level at which the spell was cast
    if(!result) return 0;
    const content = result.data.content;
    const level = content.charAt(content.indexOf("data-spell-level")+18);
    return parseInt(level);
  }

  /**
   * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
   * @param summonerActor
   * @param type
   * @param distance
   */
  drawTemplatePreview(summonerActor,type, distance){
    const data = {
        t: type,
        user: getGame().user?.id,
        distance: distance,
        direction: 0,
        x: 0,
        y: 0,
        fillColor: getGame().user?.data.color
    }

    const doc = new MeasuredTemplateDocument(data, { parent: <Scene>getCanvas().scene});
    //@ts-ignore
    let template = new getGame().dnd5e.getCanvas().AbilityTemplate(doc);
    template.actorSheet = summonerActor.sheet;
    template.drawPreview();
  }

  /**
   * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
   * @param actorName
   * @param template
   * @returns
   */
  spawnActorAtTemplate(actorName, template) {
    const scene = template.parent;

    let protoToken:any = duplicate(getGame().actors?.getName(actorName)?.data.token);

    protoToken.x = template.data.x;
    protoToken.y = template.data.y;

    // Increase this offset for larger summons
    protoToken.x -= (scene.data.grid/2+(protoToken.width-1)*scene.data.grid);
    protoToken.y -= (scene.data.grid/2+(protoToken.height-1)*scene.data.grid);

    return getCanvas().scene?.createEmbeddedDocuments("Token", [protoToken])
  }

  /**
   * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
   * @param summonedDocument
   * @param summonerActor
   * @param castingLevel
   * @returns
   */
  async updateSummon(summonedDocument:TokenDocument, summonerActor:Actor, castingLevel:number){
      /** gather the user defined updates */
    const itemsUpdate = this.itemUpdateGenerator(castingLevel, summonerActor, summonedDocument);
    const summonUpdate = this.actorUpdateGenerator(castingLevel, summonerActor, summonedDocument);
    const tokenUpdate = this.tokenUpdateGenerator(castingLevel, summonerActor, summonedDocument);

    /** perform the updates */
    await summonedDocument.update(tokenUpdate);
    await summonedDocument.actor?.update(summonUpdate);
    return summonedDocument.actor?.updateEmbeddedDocuments("Item", itemsUpdate);
  }

  /**
   * Factory function to generate a hook method to spawn a given actor name
   * at a template's location
   * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/SummonActorFromItem.js
   */
  deleteTemplatesAndSpawn(actorName, summonerActor, castingLevel){
    return async (templateDocument) => {
        const summonedDoc = <TokenDocument>((<TokenDocument[]>(await this.spawnActorAtTemplate(actorName, templateDocument)))[0]);
        await templateDocument.delete();
        if(summonerActor && castingLevel){
          await this.updateSummon(summonedDoc, summonerActor, castingLevel);
        }
    }
  }
  /* \SUPPORTING FUNCTIONS */


}
