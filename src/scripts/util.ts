import { SummonOptions } from './models';
// const formatLogMessage = (msg: string) => `Summoner | ${msg}`;

import { log } from "../main";
import { getCanvas } from './settings';

// export const log = (msg: string, ...args: any[]) => {
//   if (game.settings.get("summoner", "debug")) {
//     console.log(formatLogMessage(msg), ...args);
//   }
// };

export function require<T>(entity: null | undefined | T, msg: string): T {
  if (entity === null || entity === undefined) {
    log(msg);
    ui.notifications.error(msg);
    throw new Error(msg);
  }
  return entity;
}

export const summonActorFromItemMacro = async function (mysummoneritem, summonOptions:SummonOptions) {

    let filterforfolder = summonOptions.filterforfolder;
    let folderId = summonOptions.folderId;
    let chosencreature = summonOptions.chosencreature;
    let numbercreature:number = summonOptions.defaultnumber ? parseInt(summonOptions.defaultnumber) : 1;
    let usespelltemplate = summonOptions.usespelltemplate;

    function spawnActor(scene, template) {

      let protoToken:Token.Data = filterforfolder ? <Token.Data>duplicate(game.actors.find( actor => actor.data.folder == folderId && actor.data.name == chosencreature).data.token) : <Token.Data>duplicate(game.actors.getName(chosencreature).data.token);
      protoToken.x = template.x;
      protoToken.y = template.y;
      protoToken.flags.summoner = mysummoneritem.tokenId;
      // Increase this offset for larger summons
      protoToken.x -= (scene.data.grid/2+(protoToken.width-1)*scene.data.grid);
      protoToken.y -= (scene.data.grid/2+(protoToken.height-1)*scene.data.grid);
      //@ts-ignore
      return getCanvas().scene.createEmbeddedDocuments("Token",[protoToken]);
  }

  async function deleteTemplatesAndSpawn (scene, template) {
    for (let i=0;i<numbercreature;i++){
      await spawnActor(scene,template);
    }
    await getCanvas().templates.deleteMany([template._id]);
  }


  if (usespelltemplate == false){
    for (let i=0;i<numbercreature;i++){
        await spawnActor(getCanvas().scene,getCanvas().templates.placeables.map(x=>x).reverse().find(t => t.data.user == game.user.id)?.data || getCanvas().tokens.get(mysummoneritem.tokenId));
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

  let actor:Actor = game.data.actors.find(t => t.data._id == mysummoneritem.actor._id);
  await actor.createEmbeddedEntity("ActiveEffect", effectData);
}


