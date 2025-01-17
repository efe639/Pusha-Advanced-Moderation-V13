const client = global.client;
const configs = require("../configs/sunucuayar.json");
const settings = require("../configs/settings.json")
const serverSettings = require("../models/sunucuayar")

const penals = require("../schemas/penals");
const {MessageEmbed} = require("discord.js")  

  module.exports = async (oldUser, newUser) => {
  
    let conf = await serverSettings.findOne({
      guildID: settings.guildID
  });



//ETKİNLİK ROL ALMA
  client.ws.on('INTERACTION_CREATE', async interaction => {  
    let name = interaction.data.custom_id
    let GameMap = new Map([
        ["buttoncekilis",`${conf.çekilis}`],
        ["buttonetkinlik",`${conf.etkinlik}`],
        ["buttonfilm",`${conf.film}`],
    ])
    let member = await client.guilds.cache.get(settings.guildID).members.fetch(interaction.member.user.id)
    if(!GameMap.has(name) || !member) return;
    let role = GameMap.get(name)
    let returnText;
    if(member.roles.cache.has(role)){
        await member.roles.remove(role)
        returnText = `Rol üzerinizden alındı`
    }else{
        await member.roles.add(role)
        returnText = `Rol üzerinize verildi`
      }
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 4,
            data: {
                content: returnText,
                flags: "64"}}})});




  client.guilds.cache.forEach(async (guild) => {
    const invites = await guild.fetchInvites();
    client.invites.set(guild.id, invites);
  });



  let botVoiceChannel = client.channels.cache.get(settings.botSes); 
  if (botVoiceChannel) 
  botVoiceChannel.join().then(e => {
    e.voice.setSelfDeaf(true);
    })
  .then(console.log(`Bot ses kanalına bağlandı!`)).catch(err => console.error("[HATA] Bot ses kanalına bağlanamadı!"));
  client.user.setPresence({ activity: { name: settings.botDurum}, status: "idle" });
  



client.guilds.cache.get(settings.guildID).members.cache.filter(uye => uye.user.username.includes(configs.tag) && !uye.user.bot && !uye.roles.cache.has(configs.boosterRolu) && (!uye.roles.cache.has(configs.ekipRolu) || !uye.displayName.startsWith(configs.tag))).array().forEach((uye) => {
setTimeout(() => {
    if (configs.ekipRolu) uye.roles.add(configs.ekipRolu).catch({ })
}, 1000 * 60 * 60);
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

setInterval(() => { TagAlıncaKontrol(); }, 20 * 1000);
setInterval(() => { TagBırakanKontrol(); }, 15 * 1000);
setInterval(() => { RolsuzeKayitsizVerme(); }, 10 * 1000);

async function RolsuzeKayitsizVerme()  { // Rolü olmayanı kayıtsıza atma

const guild = client.guilds.cache.get(settings.guildID);
let ozi = guild.members.cache.filter(m => m.roles.cache.filter(r => r.id !== guild.id).size == 0)
   ozi.forEach(r => {
   r.roles.add(configs.unregRoles)
   })
 
};

async function TagAlıncaKontrol() { // Tag alınca tarama
const guild = this.client.guilds.cache.get(settings.guildID)
const members = guild.members.cache.filter(member => member.user.username.includes(configs.tag) && !member.roles.cache.has(configs.jailRole) && !member.roles.cache.has(configs.ekipRolu)).array().splice(0, 10)
for await (const member of members) {
 await member.roles.add(configs.ekipRolu);
}
};

async function TagBırakanKontrol() { // Tagı olmayanın family rol çekme
const guild = this.client.guilds.cache.get(settings.guildID)
const members = guild.members.cache.filter(member => !member.user.username.includes(configs.tag) && !member.user.bot && member.roles.cache.has(configs.ekipRolu)).array().splice(0, 10)
for await (const member of members) {
 await member.roles.remove(configs.ekipRolu)
}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////s


setInterval(async () => {  
  const guild = client.guilds.cache.get(settings.guildID);
  if (!guild) return;
  const finishedPenals = await penals.find({ guildID: guild.id, active: true, temp: true, finishDate: { $lte: Date.now() } });
  finishedPenals.forEach(async (x) => {
    const member = guild.members.cache.get(x.userID);
    if (!member) return;
    if (x.type === "CHAT-MUTE") {
      x.active = false;
      await x.save();
      await member.roles.remove(conf.chatMute);
      client.channels.cache.get(conf.cmuteLogChannel).send(new MessageEmbed().setColor("#2f3136").setDescription(`${member.toString()} adlı Kullanıcının **Chat Mute** süresi doldu`));
    }
    if (x.type === "TEMP-JAIL") {
      x.active = false;
      await x.save();
      await member.setRoles(conf.unregRoles);
      client.channels.cache.get(conf.jailLogChannel).send(new MessageEmbed().setColor("#2f3136").setDescription(`${member.toString()} üyesinin jaili, süresi bittiği için kaldırıldı!`));
    } 
    if (x.type === "TEMP-REKLAM") {
      x.active = false;
      await x.save();
      await member.setRoles(conf.unregRoles);
      client.channels.cache.get(conf.reklamLogChannel).send(new MessageEmbed().setColor("#2f3136").setDescription(`${member.toString()} üyesinin reklami, süresi bittiği için kaldırıldı!`));
    } 
    if (x.type === "TEMP-BANNEDTAG") {
      x.active = false;
      await x.save();
      await member.setRoles(conf.unregRoles);
      client.channels.cache.get(conf.yasaklıTagLogChannel).send(new MessageEmbed().setColor("#2f3136").setDescription(`${member.toString()} üyesi Yaşaklı Tag Kaldırdıgı İçin Kayıtsıza Atıldı`));
    } 
    if (x.type === "VOICE-MUTE") {
      if (member.voice.channelID) {
        x.removed = true;
        await x.save();
        if (member.voice.serverMute) member.voice.setMute(false);
      }
      x.active = false;
      await x.save();
      member.roles.remove(conf.voiceMute);
      client.channels.cache.get(conf.vmuteLogChannel).send(new MessageEmbed().setColor("#2f3136").setDescription(`${member.toString()} adlı Kullanıcının **Ses Mute** süresi doldu`));
    }
  });

  const activePenals = await penals.find({ guildID: guild.id, active: true });
  activePenals.forEach(async (x) => {
    const member = guild.members.cache.get(x.userID);
    if (!member) return;
    if (x.type === "CHAT-MUTE" && !conf.chatMute.some((x) => member.roles.cache.has(x))) return member.roles.add(conf.chatMute);
    if ((x.type === "JAIL" || x.type === "TEMP-JAIL") && !conf.jailRole.some((x) => member.roles.cache.has(x))) return member.setRoles(conf.jailRole);
    if ((x.type === "REKLAM" || x.type === "TEMP-REKLAM") && !conf.reklamRole.some((x) => member.roles.cache.has(x))) return member.setRoles(conf.reklamRole);
    if ((x.type === "BANNEDTAG" || x.type === "TEMP-BANNEDTAG") && !conf.yasaklıtagRole.some((x) => member.roles.cache.has(x))) return member.setRoles(conf.yasaklıtagRole);
    if (x.type === "VOICE-MUTE") {
      if (!conf.voiceMute.some((x) => member.roles.cache.has(x))) member.roles.add(conf.voiceMute);
      if (member.voice.channelID && !member.voice.serverMute) member.voice.setMute(true);
    }
  });
}, 1000 * 60);
};

module.exports.conf = {
  name: "ready",
};