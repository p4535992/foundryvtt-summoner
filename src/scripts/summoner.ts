import { TokenData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { log } from "../main.js";
import { DismissRequestMessage, Message, SummonOptions, SummonRequestMessage } from "./models.js";
import { getCanvas, getGame, SUMMONER_MODULE_NAME, SUMMONER_SOCKET_NAME, SUMMONER_SUMMON_COMPLETE_FLAG } from "./settings.js";
import * as Util from "./util.js";



/**
 * Summons have the following fields:
 */
export function placeAndSummon(
  actor: Actor,
  minionName: string,
  overrides: Partial<TokenData>,
  options: SummonOptions
): Promise<TokenDocument> {
  //@ts-ignore
  return chooseSquare().then(({ x, y }) =>
    sendSummonRequest(actor, minionName, x, y, overrides, options)
  );
}

export function placeAndSummonFromSpell(
  actor: any,
  spell: any,
  minionName: string,
  overrides: Partial<TokenData> = {}
): Promise<TokenDocument> {
  return (game as any).dnd5e.applications.AbilityUseDialog.create(spell).then(
    (configuration) =>
      //@ts-ignore
      chooseSquare().then(async ({ x, y }) => {
        // Following logic ripped from DnD5e system.  Item5e.roll.
        const spellLevel =
          configuration.level === "pact"
            ? actor.data.data.spells.pact.level
            : parseInt(configuration.level);

        const consumeQuantity = spell.data.uses?.autoDestroy;
        const consumeUsage = Boolean(configuration.consumeUse);
        const consumeRecharge = Boolean(configuration.consumeRecharge);
        const consumeResource = Boolean(configuration.consumeResource);
        const consumeSpellSlot =
          Boolean(configuration.consumeSlot) &&
          (configuration.level === "pact" ? "pact" : `spell${spellLevel}`);

        // Determine whether the item can be used by testing for resource consumption
        const usage = spell._getUsageUpdates({
          consumeRecharge,
          consumeResource,
          consumeSpellSlot,
          consumeUsage,
          consumeQuantity,
        });
        if (!usage) return;
        const { actorUpdates, itemUpdates, resourceUpdates } = usage;

        // Commit pending data updates
        if (!isObjectEmpty(itemUpdates)) await spell.update(itemUpdates);
        if (consumeQuantity && spell.data.data.quantity === 0)
          await spell.delete();
        if (!isObjectEmpty(actorUpdates)) await actor.update(actorUpdates);
        if (!isObjectEmpty(resourceUpdates)) {
          const resource = actor.items.get(spell.data.consume?.target);
          if (resource) await resource.update(resourceUpdates);
        }
        // End Item5e.roll logic

        const spellLevelOverride = {
          actorData: { data: { attributes: { spellLevel } } },
        };
        return sendSummonRequest(
          actor,
          minionName,
          x,
          y,
          mergeObject(overrides, spellLevelOverride as any, { inplace: false }),
          { setSpellBonuses: true }
        );
      })
  );
}

export async function placeAndSummonPolymorphed(
  actor: Actor,
  minionName: string,
  polymorphOptions: any = {}
): Promise<TokenDocument|undefined> {
  const polymorphFolder = Util.require(
    getGame().folders?.getName(minionName),
    `Could not find folder of polymorphs. Only entities in the "${minionName}" folder can be used as polymorphs.`
  );
  const html = await renderTemplate(
    `/modules/${SUMMONER_MODULE_NAME}/templates/choose_polymorph.html`,
    {
      minionName,
      polymorphOptions: polymorphFolder.contents.map((a) => a.name),
    }
  );
  const { polymorphName } = await new Promise((resolve) => {
    const dialog = new Dialog({
      title: `Summon ${minionName}`,
      content: html,
      buttons: {
        cast: {
          icon: '<i class="fas fa-magic"></i>',
          label: "Summon",
          callback: (html) =>
            resolve(
              //@ts-ignore
              new FormDataExtended(html[0].querySelector("form")).toObject()
            )
        }
      },
      default: "cast",
      close: () => resolve({ polymorphName: null }),
    });
    dialog.render(true);
  });

  if (!polymorphName) {
    return;
  }
  //@ts-ignore
  return placeAndSummon(
    actor,
    minionName,
    {},
    { polymorph: { ...polymorphOptions, name: polymorphName } }
  );
}

export function dismiss(minionName: string): Promise<void|undefined> {
  let isDismiss:TokenDocument[] = <TokenDocument[]>getGame().actors?.getName(minionName)?.getActiveTokens();
  if (isDismiss?.length > 0) {
    return sendDismissRequest(minionName);
  } else {
    return Promise.resolve();
  }
}

/**
 * Updates all items on the token with a saving throw to have the actor's spell
 * save DC. This is a convenience to set up saves because there is otherwise no
 * good way to get a flat amount.
 *
 * TODO: is there a way to set these values on items when creating a token?
 */
export function updateSpellDcsFromActor(
  actor: Actor,
  token: TokenDocument
): Promise<TokenDocument|undefined>|undefined {
  // This is a DnD5e operation, so uses the 5E actor.
  const dc = (actor.data.data as any).attributes.spelldc;
  // The updates have to be reduced to make sure they are sequenced otherwise
  // they will cancel each other.
  // TODO: Can this be done in a bulk update?
  return token?.data?.actorData?.items?.reduce(
      //@ts-ignore
      (promise, item:ItemDataBaseProperties) =>
        promise.then(() =>
          //@ts-ignore
          item.update(
            {
              "data.save.dc": dc,
              "data.save.scaling": "flat",
            }
          )
        ),
      Promise.resolve({})
    )
    //@ts-ignore
    .then(() => token);
}

export function getSpellBonusesFromActor(actor: any) {
  const actorData = actor.data.data;
  const attackBonus =
    actorData.attributes.prof +
    (actorData.attributes.spellcasting
      ? actorData.abilities[actorData.attributes.spellcasting].mod
      : 0);
  return {
    actorData: {
      data: {
        bonuses: {
          spell: { dc: actorData.attributes.spelldc - 10 }, // This does not work?
          rsak: {
            attack: `${actorData.bonuses.rsak.attack} + ${attackBonus}`,
            damage: actorData.bonuses.rsak.damage,
          },
          msak: {
            attack: `${actorData.bonuses.msak.attack} + ${attackBonus}`,
            damage: actorData.bonuses.msak.damage,
          },
        },
      },
    },
  };
}

const PLACE_TOKEN_HIGHLIGHT_LAYER = "PlaceToken";
const PLACE_TOKEN_HIGHLIGHT_COLOR = 0x3366cc;
const PLACE_TOKEN_HIGHLIGHT_BORDER = 0x000000;

function chooseSquare(): Promise<{ x: number; y: number }|undefined> {
  if (getCanvas().ready) {
    //const readyCanvas: any = canvas;

    return new Promise((resolve) => {
      const highlightLayer = <GridHighlight>getCanvas().grid?.addHighlightLayer(
        PLACE_TOKEN_HIGHLIGHT_LAYER
      );

      const leftClickListener = function (event) {
        const scenePos = event.data.getLocalPosition(highlightLayer);
        const [x, y] = <PointArray>getCanvas().grid?.getTopLeft(scenePos.x, scenePos.y);

        highlightLayer.clear();
        getCanvas().stage.off("mousedown", leftClickListener);
        getCanvas().stage.off("mousemove", moveListener);

        resolve({ x, y });
      };

      let lastMoveTime = 0;
      const moveListener = function (event) {
        // event.stopPropagation();
        const now = Date.now();
        if (now - lastMoveTime <= 30) return;
        const scenePos = event.data.getLocalPosition(highlightLayer);
        const [x, y] = <PointArray>getCanvas().grid?.getTopLeft(scenePos.x, scenePos.y);
        highlightLayer.clear();
        getCanvas().grid?.grid?.highlightGridPosition(highlightLayer, {
          x,
          y,
          color: PLACE_TOKEN_HIGHLIGHT_COLOR,
          border: PLACE_TOKEN_HIGHLIGHT_BORDER,
        });
        lastMoveTime = now;
      };

      getCanvas().stage.on("mousedown", leftClickListener);
      getCanvas().stage.on("mousemove", moveListener);
    });
  }else{
    return Promise.apply(undefined);
  }
}



function sendSummonRequest(
  actor: Actor,
  name: string,
  x: number,
  y: number,
  overrides: Partial<TokenData>,
  options: SummonOptions
): Promise<TokenDocument> {
  log("Sending summon request");
  const user = getGame().user;
  const message:Message = {
    action: "summon" as const,
    summonerUserId: <string>user?.id,
    summonerActorId: <string>actor.id,
    name,
    x,
    y,
    overrides,
    options,
  };
  return new Promise((resolve) => {
    const hookId = Hooks.on(
      "updateToken",
      (scene: Scene, data, changes, isDiff) => {
        const token = new TokenDocument(data);
        if (
          changes.flags?.[SUMMONER_MODULE_NAME]?.[SUMMONER_SUMMON_COMPLETE_FLAG] &&
          getGame().actors?.getName(name)?.id == token.data.actorId
        ) {
          log(`Summoning complete for ${name}.`);
          resolve(token);
          Hooks.off("updateToken", hookId);
        }
      }
    );
    dispatchMessage(message);
  });
}

function sendDismissRequest(name: string): Promise<void> {
  const user = getGame().user;
  const message:Message = {
    action: "dismiss" as const,
    userId: <string>user?.id,
    name
  };

  return new Promise((resolve) => {
    const hookId = Hooks.on("deleteToken", (scene, data, changes, isDiff) => {
      if (getGame().actors?.getName(name)?.id == data.actorId) {
        log(`Dismiss complete for ${name}.`);
        resolve(data);
        Hooks.off("deleteToken", hookId);
      }
    });
    dispatchMessage(message);
  });
}

function dispatchMessage(message: Message) {
  if (getGame().user?.isGM) {
    receiveMessage(message);
  } else {
    getGame().socket?.emit(SUMMONER_SOCKET_NAME, message);
  }
}

export const receiveMessage = function(message: Message) {
  if (getGame().user?.id !== getGame().users?.filter((u) => u.isGM)[0]?.id) {
    // Skip anyone who isn't the first GM.
    return;
  }
  log("Received message: ", message);
  switch (message.action) {
    case "summon":
      return createSummonedToken(message);
    case "dismiss":
      return dismissSummonedTokens(message);
    default:
      console.error("Periodic | Received unknown message.", message);
  }
}

function canSummon(user: User, actor: Actor): boolean {
  return actor.hasPerm(user, CONST.ENTITY_PERMISSIONS.OWNER);
}

export async function createSummonedToken({
  name,
  summonerActorId,
  summonerUserId,
  x,
  y,
  overrides = {},
  options = {
    setSpellBonuses: false,
    polymorph: {},
    shownumberdialog: true,
    defaultnumber: "1",
    onlyonecreature: false,
    creatures: [],
    usespelltemplate: false,
    filterforfolder: false,
    folderId: <string>getGame().settings.get(SUMMONER_MODULE_NAME, "folder") ,
  },
}: SummonRequestMessage): Promise<TokenDocument> {
  const user: User = Util.require(
    getGame().users?.get(summonerUserId),
    `User ${summonerUserId} does not exist from request to summon ${name}.`
  );

  const summonerActor: Actor = Util.require(
    getGame().actors?.get(summonerActorId),
    `Actor ${summonerActorId} does not exist from request to summon ${name}.`
  );

  const summonFolder: Folder = Util.require(
    getGame().folders?.getName(<string>getGame().settings.get(SUMMONER_MODULE_NAME, "folder")) as Folder,
    `Could not find summons folder. Only entities in the "${<string>getGame().settings.get(SUMMONER_MODULE_NAME, "folder")}" folder can be summoned.`
  );
  const summonActor: Actor = <Actor>Util.require(
    summonFolder.contents.find((a) => a.name === name),
    `Received request to summon ${name} that cannot be found in the "${<string>getGame().settings.get(SUMMONER_MODULE_NAME, "folder")}" folder.`
  );

  if (!canSummon(user, summonActor)) {
    throw Error(
      `User ${user.name} needs ownership on ${name} to perform summoning actions`
    );
  }

  log(
    `Summoning ${name} on behalf of ${summonerActor.name}(${user.name}) at (${x}, ${y})`,
    overrides
  );
  //@ts-ignore
  const token:Token = await Token.fromActor(summonActor, {
    ...mergeObject(
      // Start with the derived bonuses, then apply overrides.
      options.setSpellBonuses ? getSpellBonusesFromActor(summonerActor) : {},
      overrides,
      { inplace: true }
    ),
    x,
    y,
  });

  return TokenDocument.create(token.data).then(async (token:TokenDocument) => {
    if (options.polymorph && options.polymorph.name) {
      await polymorphToken(token, options.polymorph);
    }
    if (options.setSpellBonuses) {
      await updateSpellDcsFromActor(summonerActor, token);
    }
    await token.setFlag(SUMMONER_MODULE_NAME, SUMMONER_SUMMON_COMPLETE_FLAG, true);
    return token;
  });
}

function polymorphToken(
  token: TokenDocument,
  polymorph: { name?: string } // and any other 5E polymorph options.
): Promise<TokenDocument|undefined> {
  const actorName = <string>token.data.actorData.name;
  const polymorphFolder = Util.require(
    getGame().folders?.getName(actorName),
    `Could not find folder of polymorph. Only entities in the "${actorName}" folder can be used as polymorph.`
  );
  const polymorphActor = <Actor>Util.require(
    polymorphFolder.contents.find((a) => a.name === polymorph.name),
    `Received request to polymorph "${token.name}" to "${polymorph.name}" that cannot be found in the "${actorName}" folder.`
  );

  if ((token.actor as any).transformInto) {
    return (token.actor as any).transformInto(polymorphActor, polymorph);
  } else {
    const from = token.data;
    const to = polymorphActor.data;
    const name = `${to.name} (${from.name})`;
    const newData:TokenDocument = {
      ...to.token,
      //@ts-ignore
      actorLink: from.actorLink,
      actorId: from.actorId,
      name,
      actorData: {
        type: from.actorData.type,
        name,
        data: to.data,
        items: to.items.contents.concat((<Actor>getGame().actors?.find((actor:Actor) => actor.name ===  from.name))?.items.contents),
        img: to.img,
        permission: from.actorData.permission,
        folder: from.actorData.folder,
        flags: from.flags,
      },
    };
    return token.update(newData);
  }
}

export function dismissSummonedTokens({
  name,
  userId,
}: DismissRequestMessage): Promise<(TokenDocument|undefined)[]> {
  const user = <User>getGame().users?.get(userId);
  const summonFolderName = <string>getGame().settings?.get(SUMMONER_MODULE_NAME, "folder");
  const summonFolder = <Folder>getGame().folders?.getName(summonFolderName);
  const summonActor = <Actor>summonFolder?.contents.find((content:Actor) => content.data.name === name);

  if (!canSummon(user, summonActor)) {
    console.error(
      `User ${userId} needs ownership on ${name} to perform summoning actions`
    );
    return Promise.apply(undefined);
  }

  return Promise.all(
    summonActor.getActiveTokens().map((token:TokenDocument) => token.delete())
  );
}
