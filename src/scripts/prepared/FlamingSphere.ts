import { ScalingActorSummon } from "../ScalingActorSummon";
import { SUMMONER_ITEM_MACRO_MODULE_NAME } from "../settings";

/**
 * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/ScalingActorSummon_Examples/FlamingSphere.js
 */
export class FlamingSphere extends ScalingActorSummon{


  module = SUMMONER_ITEM_MACRO_MODULE_NAME;
  // summonItem = summonerItem:any; //item; //'item' defined by Item Macro
  actorNameToSpawn = this.summonerItem.name;
  summonerActor = this.summonerItem.parent;
  summonerDc = this.summonerActor.data.data.attributes.spelldc;
  summonerSpellAttackMod = this.summonerDc - 8;

  /** needs to return a plain update object for this specific summoned token
      Note: this can be an empty object to skip updating the token */
  tokenUpdateGenerator(castingLevel, summonerActor, summonedToken){
      return {
        //token update data
      }
  }
  /** needs to return a plain update object for this specific summoned actor */
  actorUpdateGenerator(castingLevel, summonerActor, summonedToken){
      return {
          "name" : `${summonerActor.name}'s ${this.actorNameToSpawn}`,
          "data.attributes.ac.value": castingLevel
      };
  }

  /** needs to return an array of item updates (including '_id' field) */
  itemUpdateGenerator(castingLevel, summonerActor, summonedToken):Record<string, unknown>[]{
      const scalingItem = summonedToken.actor.items.getName("Flame Burst");
      return [{
          "_id" : scalingItem.id,
          "data.damage.parts": [
            [
              `${castingLevel}d6`,
              "fire"
            ]
          ],
          "data.save": {
            ability:"dex",
            dc:this.summonerDc,
            scaling:"flat"
          }
      }];
  }


}
