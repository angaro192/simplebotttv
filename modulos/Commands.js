const CommandRules = require('./CommandRules')

class Commands extends CommandRules {

    //Para comandos só de Mods, Subs, Vips e Broadcaster(Dono do canal)
    execute(channel, user, message, io){
        if(CommandRules.podeExecutar(user,[
            CommandRules.cargos.moderator,
            CommandRules.cargos.subscriber,
            CommandRules.cargos.vip,
            CommandRules.cargos.broadcaster
            ])
        ){
            this.client.say(channel, message)
            //io.emit("overlayer", message.substr(43))
        }else{
            this.client.say(channel, `@${user.username} Esse comando é exclusivo para Subs, Mods ou Vips.`)
            this.client.say(channel, `@${user.username} Se está gostando da live, aproveite o PRIME pra garantir seu Sub no nosso canal, ainda tem mutas vantagens que a amazon te dá.`)
        }
    }

    //Para comandos só de MODS e Broadcaster(Dono do canal)
    seformod(channel, user, message, io) {
        if(CommandRules.podeExecutar(user, [
            CommandRules.cargos.moderator,
            CommandRules.cargos.broadcaster
        ])
        ){
            this.client.say(channel, message)
        }else{
            this.client.say(channel, `@${user.username} Esse comando é exclusivo para Subs, Mods ou Vips.`)
            this.client.say(channel, `@${user.username} Se está gostando da live, aproveite o PRIME pra garantir seu Sub no nosso canal, ainda tem mutas vantagens que a amazon te dá.`)
        }
    }

}

module.exports = Commands