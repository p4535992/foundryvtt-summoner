import { ScalingActorSummon } from "../ScalingActorSummon";
import { SUMMONER_ITEM_MACRO_MODULE_NAME } from "../settings";

/**
 * @href https://github.com/trioderegion/fvtt-macros/blob/master/honeybadger-macros/tokens/dnd5e/ScalingActorSummon_Examples/SummonAberration.js
 */
export class SummonAberration extends ScalingActorSummon{


  module = SUMMONER_ITEM_MACRO_MODULE_NAME;
  // summonItem = item; //'item' defined by Item Macro
  actorNameToSpawn = "Aberrant Spirit";
  summonerActor = this.summonerItem.parent;
  summonerDc = this.summonerActor.data.data.attributes.spelldc;
  summonerSpellAttackMod = this.summonerDc - 8;

  /** needs to return a plain update object for this specific summoned token
      Note: this can be an empty object to skip updating the token */
  tokenUpdateGenerator(castingLevel, summonerActor, summonedToken){
      return {
          "name": `${summonerActor.name}'s Spirit`,
          "displayName": CONST.TOKEN_DISPLAY_MODES.HOVER
      }
  }

  /** needs to return a plain update object for this specific summoned actor
      Note: this can be an empty object to skip updating the actor */
  actorUpdateGenerator(castingLevel, summonerActor, summonedToken){
      return {
          "name" : `${summonerActor.name}'s ${this.actorNameToSpawn}`,
          "data.attributes.ac.value": 11 + castingLevel,
          "data.attributes.hp": {value: 40 + 10*(castingLevel - 4), max: 40 + 10*(castingLevel - 4)},
      };
  }

  /** needs to return an array of item updates (including '_id' field)
      Note: this can be an empty array to skipp updating the actor's items */
  itemUpdateGenerator(castingLevel, summonerActor, summonedToken):Record<string, unknown>[]{
      let itemUpdates:Record<string, unknown>[] = [];

      /** scale whispering aura */
      const whisperingAura = summonedToken.actor.items.getName("Whispering Aura");
      itemUpdates.push({
        "_id": whisperingAura.id,
        "data.save":
        {
          ability:"wis",
          dc:this.summonerDc,
          scaling:"flat"
        }  ,
        "data.damage.parts": [
          [
            `2d6`,
            "psychic"
          ]
        ],
      });

      /** scale eye ray (negate own spell attack bonuses) */
      const eyeRay = summonedToken.actor.items.getName("Eye Ray");
      itemUpdates.push({
          "_id": eyeRay.id,
          "data.attackBonus": `- @mod - @prof + ${this.summonerSpellAttackMod}`,
          "data.damage.parts": [
            [
              `1d8 + 3 + ${castingLevel}`,
              'psychic'
            ]
          ]
      });

      /** scale claws (negate own spell attack bonuses) */
      const claws = summonedToken.actor.items.getName("Claws");
      itemUpdates.push({
          "_id": claws.id,
          "data.attackBonus": `- @mod - @prof + ${this.summonerSpellAttackMod}`,
          "data.damage.parts": [
            [
              `1d10 + 3 + ${castingLevel}`,
              'slashing'
            ]
          ]
      });

      /** scale psychic slam (negate own spell attack bonuses) */
      const psychicSlam = summonedToken.actor.items.getName("Psychic Slam");
      itemUpdates.push({
          "_id": psychicSlam.id,
          "data.attackBonus": `- @mod - @prof + ${this.summonerSpellAttackMod}`,
          "data.damage.parts": [
            [
              `1d8 + 3 + ${castingLevel}`,
              'psychic'
            ]
          ]
      })

      const multiAttack = summonedToken.actor.items.getName("Multiattack");
      itemUpdates.push({
          "_id": multiAttack.id,
          "data.description.value": `The aberration makes ${Math.floor(castingLevel/2)} attacks`
      })

      return itemUpdates;
  }


}
