import { ActorData, PrototypeTokenData, TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import { SummonOptions } from './models';
// const formatLogMessage = (msg: string) => `Summoner | ${msg}`;

import { log } from "../main";
import { getGame, getCanvas } from './settings';

// export const log = (msg: string, ...args: any[]) => {
//   if (getGame().settings.get("summoner", "debug")) {
//     console.log(formatLogMessage(msg), ...args);
//   }
// };

export function require<T>(entity: null | undefined | T, msg: string): T {
  if (entity === null || entity === undefined) {
    log(msg);
    ui.notifications?.error(msg);
    throw new Error(msg);
  }
  return entity;
}

export const summonActorFromItemMacro = async function (mysummoneritem:any, summonOptions:SummonOptions) {

    let filterforfolder = summonOptions.filterforfolder;
    let folderId = summonOptions.folderId;
    let chosencreature = <string>summonOptions.chosencreature;
    let numbercreature:number = summonOptions.defaultnumber ? parseInt(summonOptions.defaultnumber) : 1;
    let usespelltemplate = summonOptions.usespelltemplate;

    function spawnActor(scene, template) {

      let protoToken:any = <any>(
        filterforfolder ?
        <PrototypeTokenData|undefined>duplicate(getGame().actors?.find((actor:Actor) => actor.data.folder == folderId && actor.data.name == chosencreature)?.data.token) :
        <PrototypeTokenData|undefined>duplicate(getGame().actors?.getName(chosencreature)?.data.token)
      );
      protoToken.x = template.x;
      protoToken.y = template.y;
      protoToken.flags.summoner = mysummoneritem.tokenId;
      // Increase this offset for larger summons
      protoToken.x -= (scene.data.grid/2+(protoToken.width-1)*scene.data.grid);
      protoToken.y -= (scene.data.grid/2+(protoToken.height-1)*scene.data.grid);
      return getCanvas().scene?.createEmbeddedDocuments("Token",[protoToken]);
  }

  async function deleteTemplatesAndSpawn (scene, template) {
    for (let i=0;i<numbercreature;i++){
      await spawnActor(scene,template);
    }
    await getCanvas().templates?.deleteMany([template._id],{});
  }


  if (usespelltemplate == false){
    for (let i=0;i<numbercreature;i++){
        await spawnActor(getCanvas().scene,getCanvas().templates?.placeables.map(x=>x).reverse().find(t => t.data.user == getGame().user?.id)?.data || getCanvas().tokens?.get(mysummoneritem.tokenId));
    }
  }
  //create flag to delete summon

  const effectData = {
    changes: [
      {key: "macro.itemMacro", mode: 0, value: `ItemMacro.${mysummoneritem.item.name}`, priority: 20},
      {key: "flags.midi-qol.concentration-data.targets", mode: 2, value: {"actorId":  mysummoneritem.actor._id, "tokenId": mysummoneritem.tokenId}, priority: 20}
    ],
    origin: mysummoneritem.proto.uuid, //flag the effect as associated to the ability beeing applyed
    disabled: false,
    duration: mysummoneritem.item.data.duration,
    icon: mysummoneritem.item.img,
    label: mysummoneritem.item.name,
    flags: {dae: {itemData: mysummoneritem.item}}
  }
  //@ts-ignore
  let actor:Actor = getGame().data?.actors?.find((t:Actor) => t.data.id == mysummoneritem.actor._id);
  await actor.createEmbeddedEntity("ActiveEffect", effectData);
}


