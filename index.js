require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'data.json');
const defaults = {
  mode: 'on', maintenance: false, antiRaid: true,
  pix: { key: '', name: '' },
  channels: { restock: '', reviews: '', logs: '' },
  roles: { restockPing: '', support: '' },
  products: {}
};
let db = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA)) : defaults;
function save(){ fs.writeFileSync(DATA, JSON.stringify(db,null,2)); }

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});
client.commands = new Collection();

for (const file of fs.readdirSync(path.join(__dirname,'commands')).filter(x=>x.endsWith('.js'))) {
  const c=require(path.join(__dirname,'commands',file));
  client.commands.set(c.data.name,c);
}

client.once('ready', async ()=>{
  console.log(`ONLINE: ${client.user.tag}`);
  const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      {body:[...client.commands.values()].map(c=>c.data.toJSON())});
    console.log('SLASH COMMANDS OK');
  } catch(e){ console.error('Command registration:',e.message); }
});

client.on('interactionCreate', async i=>{
  try {
    if(i.isChatInputCommand()){
      const c=client.commands.get(i.commandName);
      if(c) await c.execute(i,{db,save,client});
      return;
    }
    if(!i.isButton()) return;

    if(i.customId==='ticket_open'){
      const existing=i.guild.channels.cache.find(c=>c.name===`ticket-${i.user.id}` && c.type===ChannelType.GuildText);
      if(existing) return i.reply({content:`🎫 Você já possui um ticket: ${existing}`,ephemeral:true});
      const support=db.roles.support && i.guild.roles.cache.get(db.roles.support);
      const ch=await i.guild.channels.create({
        name:`ticket-${i.user.id}`, type:ChannelType.GuildText,
        permissionOverwrites:[
          {id:i.guild.roles.everyone.id,deny:[PermissionsBitField.Flags.ViewChannel]},
          {id:i.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory]},
          ...(support?[{id:support.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory]}]:[])
        ]
      });
      const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger));
      await ch.send({content:`🎫 ${i.user} seu atendimento foi aberto.`,components:[row]});
      await i.reply({content:`✅ Ticket criado: ${ch}`,ephemeral:true});
      return;
    }
    if(i.customId==='ticket_close'){
      await i.reply('🔒 Ticket será fechado em 3 segundos.');
      setTimeout(()=>i.channel.delete().catch(()=>{}),3000);
      return;
    }
    if(i.customId.startsWith('rating_')){
      const n=i.customId.split('_')[1];
      const channel=db.channels.reviews && i.guild.channels.cache.get(db.channels.reviews);
      if(channel) await channel.send(`⭐ **Avaliação recebida** de ${i.user}: ${'⭐'.repeat(Number(n))} (${n}/5)`);
      await i.reply({content:'⭐ Obrigado pela avaliação!',ephemeral:true});
    }
  } catch(e){
    console.error(e);
    if(!i.replied && !i.deferred) await i.reply({content:'❌ Erro interno.',ephemeral:true}).catch(()=>{});
  }
});

client.login(process.env.DISCORD_TOKEN);
