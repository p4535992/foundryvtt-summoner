// const formatLogMessage = (msg: string) => `Summoner | ${msg}`;

import { log } from "../main";

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

export const summonActorFromItemMacro = function () {

    function spawnActor(scene, template) {

      let protoToken = filterforfolder ? duplicate(game.actors.find( actor => actor.data.folder == folderId && actor.data.name == chosencreature).data.token) : duplicate(game.actors.getName(chosencreature).data.token);
      protoToken.x = template.x;
      protoToken.y = template.y;
      protoToken.flags.summoner = args[0].tokenId;
      // Increase this offset for larger summons
      protoToken.x -= (scene.data.grid/2+(protoToken.width-1)*scene.data.grid);
      protoToken.y -= (scene.data.grid/2+(protoToken.height-1)*scene.data.grid);

      return canvas.scene.createEmbeddedDocuments("Token",[protoToken]);
  }

  async function deleteTemplatesAndSpawn (scene, template) {
    for (let i=0;i<parseInt(numbercreature);i++){
    await spawnActor(scene,template);
  }
    await canvas.templates.deleteMany([template._id]);
  }


  if (usespelltemplate == false){
    for (let i=0;i<parseInt(numbercreature);i++){
        await spawnActor(canvas.scene,canvas.templates.placeables.map(x=>x).reverse().find(t => t.data.user == game.user.id)?.data || canvas.tokens.get(args[0].tokenId));
    }
  }
  //create flag to delete summon
  const effectData = {
  changes: [
  {key: "macro.itemMacro", mode: 0, value: `ItemMacro.${args[0].item.name}`, priority: 20},
  {key: "flags.midi-qol.concentration-data.targets", mode: 2, value: {"actorId":  args[0].actor._id, "tokenId": args[0].tokenId}, priority: 20}
  ],
  origin: args[0].uuid, //flag the effect as associated to the ability beeing applyed
  disabled: false,
  duration: args[0].item.data.duration,
  icon: args[0].item.img,
  label: args[0].item.name,
  flags: {dae: {itemData: args[0].item}}
  }
  await actor.createEmbeddedEntity("ActiveEffect", effectData);
}


